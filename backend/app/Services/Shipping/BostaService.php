<?php

namespace App\Services\Shipping;

use App\Exceptions\Shipping\BostaException;
use App\Models\Orders\Order;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class BostaService
{
    /** @return array<string, array<string, mixed>> */
    public function cities(): array
    {
        return $this->locations('cities', '_id');
    }

    /** @return array<string, array<string, mixed>> */
    public function districts(string $cityId): array
    {
        return $this->locations('cities/'.rawurlencode($cityId).'/districts', 'districtId');
    }

    /** @return array<string, array{_id: string, locationName: string}> */
    public function pickupLocations(): array
    {
        if (blank(config('services.bosta.api_key'))) {
            throw new BostaException('Bosta API key is not configured.');
        }
        $key = 'bosta.pickup-locations.'.hash('sha256', config('services.bosta.base_url').'|'.config('services.bosta.api_key'));

        return Cache::remember($key, now()->addMinutes(5), function (): array {
            try {
                $response = $this->client()->withHeaders(['Authorization' => config('services.bosta.api_key')])
                    ->get('pickup-locations');
            } catch (ConnectionException) {
                throw new BostaException('Bosta pickup locations are unavailable. Please try again.');
            }
            $records = $response->json('data.list');
            if (! $response->successful() || $response->json('success') !== true || ! is_array($records) || ! array_is_list($records)) {
                throw new BostaException('Bosta pickup locations are unavailable. Please try again.');
            }

            return collect($records)->filter(fn (mixed $record): bool => is_array($record)
                && is_string($record['_id'] ?? null) && filled($record['_id'])
                && is_string($record['locationName'] ?? null) && filled($record['locationName']))
                ->mapWithKeys(fn (array $record): array => [$record['_id'] => [
                    '_id' => $record['_id'], 'locationName' => $record['locationName'],
                ]])->all();
        });
    }

    public function assertConfigured(): void
    {
        if (blank(config('services.bosta.api_key'))) {
            throw new BostaException('Bosta API key is not configured.');
        }
        $connection = config('services.bosta.queue_connection');
        if (config("queue.connections.{$connection}.driver") !== 'database'
            || (config("queue.connections.{$connection}.connection") ?? config('database.default')) !== config('database.default')) {
            throw new BostaException('Bosta requires a database queue using the application database.');
        }
    }

    /** @return array{delivery_id: string, tracking_number: string} */
    public function createDelivery(Order $order): array
    {
        $this->assertConfigured();
        $order->loadMissing(['items', 'transaction']);
        $names = explode(' ', trim($order->customer_name), 2);
        $payload = [
            'type' => 10,
            'businessReference' => $order->order_number,
            'uniqueBusinessReference' => $order->order_number,
            'cod' => $order->transaction->payment_method === 'cash_on_delivery' ? (float) $order->total_amount : 0,
            'dropOffAddress' => $order->bosta_address,
            'receiver' => array_filter([
                'firstName' => $names[0],
                'lastName' => $names[1] ?? null,
                'phone' => $this->phone($order->customer_phone),
                'secondPhone' => filled($order->additional_phone) ? $this->phone($order->additional_phone) : null,
            ], fn (mixed $value): bool => $value !== null),
            'specs' => [
                'packageType' => 'Parcel', 'size' => 'MEDIUM',
                'packageDetails' => ['itemsCount' => (int) $order->items->sum('quantity'), 'description' => $order->order_number],
            ],
            'allowToOpenPackage' => false,
        ];

        $pickupLocationId = $order->bosta_pickup_location_id;
        if (filled($pickupLocationId)) {
            $payload['businessLocationId'] = $pickupLocationId;
        }

        try {
            // Creation is not blindly retried: a lost response may hide an existing delivery.
            $response = $this->client()->timeout(20)
                ->withHeaders(['Authorization' => config('services.bosta.api_key')])
                ->post('deliveries?apiVersion=1', $payload);
        } catch (ConnectionException) {
            throw new BostaException('Bosta did not confirm the request. Check the order reference in Bosta before sending again.', true);
        }

        if ($response->serverError() || in_array($response->status(), [408, 409], true)) {
            throw new BostaException('Bosta did not confirm the request. Check the order reference in Bosta before sending again.', true);
        }
        if ($response->successful() && ! is_bool($response->json('success'))) {
            throw new BostaException('Bosta returned an incomplete confirmation. Check the order reference in Bosta.', true);
        }
        if (! $response->successful() || $response->json('success') !== true) {
            $code = $response->json('errorCode');
            $safeCode = is_scalar($code) && ctype_digit((string) $code) ? substr((string) $code, 0, 10) : '';
            throw new BostaException('Bosta rejected the shipment (HTTP '.$response->status().($safeCode ? ', code '.$safeCode : '').').');
        }
        $id = $response->json('data._id');
        $tracking = $response->json('data.trackingNumber');
        if (! is_string($id) || blank($id) || ! is_scalar($tracking) || blank((string) $tracking)) {
            throw new BostaException('Bosta returned an incomplete confirmation. Check the order reference in Bosta.', true);
        }

        return ['delivery_id' => $id, 'tracking_number' => (string) $tracking];
    }

    /** @return array<string, array<string, mixed>> */
    private function locations(string $path, string $idKey): array
    {
        // Bosta API key is not configured.

        // Bosta locations are unavailable. Please try again.

        $key = 'bosta.locations.'.hash('sha256', config('services.bosta.base_url').'/'.$path);

        return Cache::remember($key, now()->addHours(12), function () use ($path, $idKey): array {
            try {
                $response = $this->client()->get($path);
            } catch (ConnectionException) {
                throw new BostaException('Bosta locations are unavailable. Please try again.');
            }
            if ($response->successful() && ! is_bool($response->json('success'))) {
                throw new BostaException('Bosta returned an incomplete confirmation. Check the order reference in Bosta.', true);
            }
            if (! $response->successful() || $response->json('success') !== true) {
                throw new BostaException('Bosta locations are unavailable. Please try again.');
            }
            $records = $response->json('data.list') ?? $response->json('data');
            if (! is_array($records) || ! array_is_list($records)) {
                throw new BostaException('Bosta locations are unavailable. Please try again.');
            }

            return collect($records)->filter(fn (mixed $row): bool => is_array($row)
                && isset($row[$idKey]) && ($row['dropOffAvailability'] ?? false) === true)
                ->keyBy($idKey)->all();
        });
    }

    private function client(): PendingRequest
    {
        return Http::baseUrl(rtrim(config('services.bosta.base_url'), '/').'/')
            ->acceptJson()->asJson()->connectTimeout(3)->timeout(6);
    }

    private function phone(string $phone): string
    {
        $phone = preg_replace('/[^0-9+]/', '', $phone);

        return Str::startsWith($phone, '+20') ? '0'.substr($phone, 3) : $phone;
    }
}
