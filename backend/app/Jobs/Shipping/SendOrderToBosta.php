<?php

namespace App\Jobs\Shipping;

use App\Enums\BostaSubmissionStatus;
use App\Exceptions\Shipping\BostaException;
use App\Models\Orders\Order;
use App\Services\Shipping\BostaService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class SendOrderToBosta implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 45;

    public bool $failOnTimeout = true;

    public function __construct(public int $orderId) {}

    public function handle(BostaService $bosta): void
    {
        $claimed = Order::query()->whereKey($this->orderId)->where('status', 'processing')
            ->whereNull('bosta_delivery_id')->where('bosta_submission_status', BostaSubmissionStatus::Queued->value)
            ->update(['bosta_submission_status' => BostaSubmissionStatus::Submitting->value, 'bosta_error' => null]);
        if (! $claimed) {
            return;
        }
        $order = Order::findOrFail($this->orderId);
        try {
            $delivery = $bosta->createDelivery($order);
            $order->forceFill([
                'bosta_submission_status' => BostaSubmissionStatus::Submitted,
                'bosta_delivery_id' => $delivery['delivery_id'],
                'bosta_tracking_number' => $delivery['tracking_number'],
                'bosta_submitted_at' => now(), 'bosta_error' => null,
            ])->save();
        } catch (BostaException $exception) {
            $order->forceFill([
                'bosta_submission_status' => $exception->needsReview ? BostaSubmissionStatus::NeedsReview : BostaSubmissionStatus::Failed,
                'bosta_error' => $exception->getMessage(),
            ])->save();
            throw $exception;
        }
    }

    public function failed(?Throwable $exception): void
    {
        Order::query()->whereKey($this->orderId)
            ->where('bosta_submission_status', BostaSubmissionStatus::Queued->value)
            ->update([
                'bosta_submission_status' => BostaSubmissionStatus::Failed->value,
                'bosta_error' => 'The queue job failed before shipment submission. Please retry from the order list.',
            ]);
        // A worker can stop after the remote side effect but before saving its confirmation.
        Order::query()->whereKey($this->orderId)
            ->where('bosta_submission_status', BostaSubmissionStatus::Submitting->value)
            ->update([
                'bosta_submission_status' => BostaSubmissionStatus::NeedsReview->value,
                'bosta_error' => 'Shipment confirmation was interrupted. Check the order reference in Bosta before sending again.',
            ]);
    }
}
