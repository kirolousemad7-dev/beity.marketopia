<?php

namespace App\Services\Orders;

use App\Enums\BostaSubmissionStatus;
use App\Http\Requests\Admin\Orders\AcceptOrderRequest;
use App\Jobs\Shipping\SendOrderToBosta;
use App\Models\Orders\Order;
use App\Models\User;
use App\Models\Users\UserAuditLog;
use App\Services\Shipping\BostaService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AcceptOrder
{
    public function __construct(private BostaService $bosta) {}

    public function handle(User $actor, Order $order, array $data, bool $retry = false): void
    {
        Gate::forUser($actor)->authorize($retry ? 'retryBosta' : 'accept', $order);
        $data = array_map(fn (mixed $value): mixed => is_string($value) ? trim($value) : $value, $data);
        $data = Validator::make($data, AcceptOrderRequest::acceptanceRules())->validate();
        $this->bosta->assertConfigured();
        $pickupLocation = $this->bosta->pickupLocations()[$data['pickup_location_id']] ?? null;
        if (! $pickupLocation) {
            throw ValidationException::withMessages(['pickup_location_id' => __('Select a valid Bosta pickup location.')]);
        }
        $city = $this->bosta->cities()[$data['city_id']] ?? null;
        if (! $city) {
            throw ValidationException::withMessages(['city_id' => __('Select a supported Bosta city.')]);
        }
        $district = $this->bosta->districts($data['city_id'])[$data['district_id']] ?? null;
        if (! $district) {
            throw ValidationException::withMessages(['district_id' => __('Select a deliverable district in the selected city.')]);
        }
        DB::transaction(function () use ($actor, $order, $data, $city, $district, $pickupLocation, $retry): void {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);
            Gate::forUser($actor)->authorize($retry ? 'retryBosta' : 'accept', $order);
            $payment = $order->transaction()->lockForUpdate()->first();
            if (! $payment || ! in_array($payment->payment_method, ['cash_on_delivery', 'wallet', 'instapay'], true)) {
                throw ValidationException::withMessages(['city_id' => __('The order payment details are missing or invalid.')]);
            }
            if ($payment->payment_method === 'cash_on_delivery' && ((float) $order->total_amount <= 0 || (float) $order->total_amount > 30000)) {
                throw ValidationException::withMessages(['city_id' => __('Bosta cash collection must be between 0 and 30000 EGP.')]);
            }
            if (! $order->items()->exists()) {
                throw ValidationException::withMessages(['city_id' => __('The order has no items to ship.')]);
            }
            $order->forceFill([
                'status' => 'processing',
                'bosta_pickup_location_id' => $data['pickup_location_id'],
                'bosta_pickup_location_name' => $pickupLocation['locationName'],
                'customer_name' => trim($data['customer_name']),
                'customer_phone' => trim($data['customer_phone']),
                'additional_phone' => filled($data['additional_phone'] ?? null) ? trim($data['additional_phone']) : null,
                'shipping_address' => trim($data['shipping_address']),
                'bosta_address' => array_filter([
                    'city' => $city['name'], 'cityId' => $data['city_id'],
                    'districtId' => $data['district_id'], 'zoneId' => $district['zoneId'] ?? null,
                    'firstLine' => trim($data['shipping_address']),
                ], fn (mixed $value): bool => $value !== null),
                'bosta_submission_status' => BostaSubmissionStatus::Queued,
                'bosta_error' => null,
            ])->save();
            if ($payment->payment_method !== 'cash_on_delivery') {
                $payment->update(['status' => 'completed']);
            }
            UserAuditLog::create([
                'action' => $retry ? 'order.bosta_requeued' : 'order.accepted',
                'user_id' => (string) $actor->id, 'ip_address' => request()->ip() ?? 'unknown',
                'details' => ['order_id' => $order->id, 'order_number' => $order->order_number],
            ]);
            // The dedicated database queue shares the order transaction, so enqueue failure rolls acceptance back.
            SendOrderToBosta::dispatch($order->id)->onConnection(config('services.bosta.queue_connection'))
                ->onQueue(config('services.bosta.queue'))->beforeCommit();
        });
    }
}
