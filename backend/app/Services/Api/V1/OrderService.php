<?php

namespace App\Services\Api\V1;

use App\Exceptions\InvalidCouponCodeException;
use App\Exceptions\InvalidProductStockException;
use App\Http\Resources\V1\OrderResource;
use App\Interfaces\OrderInterface;
use App\Models\Bundles\Bundle;
use App\Models\Coupon;
use App\Models\Orders\Order;
use App\Models\Products\Product;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService implements OrderInterface
{
    public function index()
    {
        $user = request()->user();
        $orders = $user->orders()->with('items.product')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return $orders;
    }

    public function checkout(array $data, $request)
    {
        $order = DB::transaction(function () use ($data, $request) {
            $shippingCents = $this->toCents(Setting::get('shipping_cost'));
            $totalCents = $shippingCents;
            $itemsData = [];
            $packages = [];

            foreach ($data['bundles'] ?? [] as $bundleLine) {
                $bundleId = (int) $bundleLine['bundle_id'];
                $packages[$bundleId] = ($packages[$bundleId] ?? 0) + (int) $bundleLine['quantity'];
            }

            $lockedProducts = $this->lockCheckoutProducts($data['items'] ?? [], $packages);

            foreach ($data['items'] ?? [] as $item) {
                $product = $lockedProducts->get((int) $item['product_id']);
                $quantity = (int) $item['quantity'];
                $this->takeStock($product, $quantity);

                $unitCents = $this->toCents($product->price_after_discount ?? $product->price);
                $lineCents = $unitCents * $quantity;
                $totalCents += $lineCents;
                $itemsData[] = [
                    'product_id' => $product->id,
                    'bundle_id' => null,
                    'quantity' => $quantity,
                    'price' => $this->fromCents($unitCents),
                    'line_total' => $this->fromCents($lineCents),
                ];
            }

            foreach ($packages as $bundleId => $packageCount) {
                $bundle = Bundle::query()->with('bundleItems.product')->lockForUpdate()->find($bundleId);
                if (! $bundle || ! $bundle->is_active || $bundle->bundle_price === null) {
                    throw ValidationException::withMessages([
                        'bundles' => [__('This package is no longer available.')],
                    ]);
                }

                $components = [];
                foreach ($bundle->bundleItems as $component) {
                    $configured = (int) $component->quantity;
                    $product = $lockedProducts->get((int) $component->product_id);
                    if ($configured < 1 || ! $product || ! $product->is_active) {
                        throw ValidationException::withMessages([
                            'bundles' => [__('This package is no longer available.')],
                        ]);
                    }
                    $components[$product->id] = ($components[$product->id] ?? 0) + ($configured * $packageCount);
                }

                if ($components === []) {
                    throw ValidationException::withMessages([
                        'bundles' => [__('This package is no longer available.')],
                    ]);
                }

                $this->assertSubmittedPackageMatches($bundle, $request);

                foreach ($components as $productId => $quantity) {
                    $this->takeStock($lockedProducts->get($productId), $quantity);
                }

                $offerCents = $this->toCents($bundle->bundle_price) * $packageCount;
                $totalCents += $offerCents;
                array_push($itemsData, ...$this->packageLines($components, $offerCents, $bundle->id));
            }

            $coupon = null;
            $discountCents = 0;

            if ($request->filled('coupon_code')) {
                $coupon = Coupon::where('code', Str::upper($request->coupon_code))->first();
                $merchandiseAndShipping = (float) $this->fromCents($totalCents);

                if (! $coupon || ! $coupon->isValid($merchandiseAndShipping)) {
                    throw new InvalidCouponCodeException('Coupon is not valid');
                }
                $discountCents = $this->toCents($coupon->calculateDiscount($merchandiseAndShipping));
            }

            if ($coupon) {
                $coupon->increment('used_count');
            }

            $chargedCents = $totalCents - $discountCents;
            $charged = $this->fromCents($chargedCents);
            $order = Order::create([
                'user_id' => $request->user()->id,
                'coupon_id' => $coupon?->id,
                'discount_amount' => $this->fromCents($discountCents),
                'total_amount' => $charged,
                'status' => 'pending',
                'shipping_address' => $data['shipping_address'],
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'additional_phone' => $data['additional_phone'] ?? null,
            ]);

            $order->items()->createMany($itemsData);

            $transaction = $order->transaction()->create([
                'amount' => $charged,
                'status' => 'pending',
                'payment_method' => $data['payment_method'],
            ]);

            if ($request->hasFile('payment_screenshot')) {
                $transaction->addMediaFromRequest('payment_screenshot')
                    ->toMediaCollection('payment_screenshot');
            }

            return $order->load('items');
        });

        return OrderResource::make($order);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @param  array<int, int>  $packages
     */
    private function lockCheckoutProducts(array $items, array $packages)
    {
        $productIds = collect($items)->pluck('product_id')->map(fn ($id) => (int) $id);

        if ($packages !== []) {
            $componentIds = DB::table('bundle_items')
                ->whereIn('bundle_id', array_keys($packages))
                ->pluck('product_id');
            $productIds = $productIds->merge($componentIds);
        }

        $ids = $productIds->unique()->sort()->values();
        if ($ids->isEmpty()) {
            return collect();
        }

        return Product::query()
            ->whereIn('id', $ids)
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');
    }

    private function assertSubmittedPackageMatches(Bundle $bundle, $request): void
    {
        $configured = [];
        foreach ($bundle->bundleItems as $component) {
            $productId = (int) $component->product_id;
            $configured[$productId] = ($configured[$productId] ?? 0) + (int) $component->quantity;
        }
        ksort($configured);

        foreach ($request->input('bundles', []) as $line) {
            if (! is_array($line) || (int) ($line['bundle_id'] ?? 0) !== (int) $bundle->id) {
                continue;
            }

            if (array_key_exists('bundle_price', $line) || array_key_exists('price', $line)) {
                $stated = round((float) ($line['bundle_price'] ?? $line['price']), 2);
                if ($stated !== round((float) $bundle->bundle_price, 2)) {
                    $this->rejectModifiedPackage();
                }
            }

            if (! array_key_exists('products', $line) && ! array_key_exists('items', $line)) {
                continue;
            }

            $submitted = $line['products'] ?? $line['items'];
            $actual = [];
            if (is_array($submitted)) {
                foreach ($submitted as $component) {
                    if (! is_array($component)) {
                        $this->rejectModifiedPackage();
                    }
                    $productId = (int) ($component['product_id'] ?? $component['id'] ?? 0);
                    $actual[$productId] = ($actual[$productId] ?? 0) + (int) ($component['quantity'] ?? 0);
                }
            }
            ksort($actual);
            if ($actual !== $configured) {
                $this->rejectModifiedPackage();
            }
        }
    }

    private function rejectModifiedPackage(): void
    {
        throw ValidationException::withMessages([
            'bundles' => [__('This package must be added again before checkout.')],
        ]);
    }

    private function takeStock(?Product $product, int $quantity): void
    {
        if (! $product || $product->stock < $quantity) {
            $name = $product?->name ?? __('product');
            throw new InvalidProductStockException("Insufficient stock for product: {$name}");
        }

        $product->decrement('stock', $quantity);
    }

    /**
     * Split the saved offer across component lines in integer cents.
     * The last component receives the remainder, so the stored line totals
     * add up to the offer exactly. price remains a two-decimal unit amount.
     *
     * @param  array<int, int>  $components
     * @return array<int, array<string, mixed>>
     */
    private function packageLines(array $components, int $offerCents, int $bundleId): array
    {
        $units = array_sum($components);
        $lines = [];
        $allocated = 0;
        $productIds = array_keys($components);
        $last = array_key_last($productIds);

        foreach ($productIds as $index => $productId) {
            $quantity = $components[$productId];
            if ($index === $last) {
                $lineCents = $offerCents - $allocated;
            } else {
                $lineCents = intdiv($offerCents * $quantity, $units);
                $allocated += $lineCents;
            }

            $lines[] = [
                'product_id' => $productId,
                'bundle_id' => $bundleId,
                'quantity' => $quantity,
                'price' => $this->fromCents(intdiv($lineCents, $quantity)),
                'line_total' => $this->fromCents($lineCents),
            ];
        }

        return $lines;
    }

    private function toCents(mixed $amount): int
    {
        if ($amount === null || $amount === '') {
            return 0;
        }
        if (is_int($amount)) {
            return $amount * 100;
        }
        if (is_float($amount)) {
            $amount = number_format($amount, 2, '.', '');
        }

        $text = trim((string) $amount);
        if (! preg_match('/^(-)?(\d+)(?:\.(\d{1,2}))?$/', $text, $matches)) {
            throw new \InvalidArgumentException('Invalid money amount.');
        }

        $sign = ($matches[1] ?? '') === '-' ? -1 : 1;
        $fraction = str_pad($matches[3] ?? '0', 2, '0');

        return $sign * (((int) $matches[2]) * 100 + (int) $fraction);
    }

    private function fromCents(int $cents): string
    {
        $sign = $cents < 0 ? '-' : '';
        $cents = abs($cents);

        return $sign.sprintf('%d.%02d', intdiv($cents, 100), $cents % 100);
    }
}
