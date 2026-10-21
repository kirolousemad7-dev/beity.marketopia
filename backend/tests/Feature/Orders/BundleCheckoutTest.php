<?php

namespace Tests\Feature\Orders;

use App\Models\Bundles\Bundle;
use App\Models\Coupon;
use App\Models\Orders\Order;
use App\Models\Products\Product;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BundleCheckoutTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_checkout_prices_a_package_from_its_saved_offer_and_ignores_client_totals(): void
    {
        Sanctum::actingAs(User::factory()->create());
        [$bundle, $first, $second] = $this->package();

        $this->postJson('/api/v1/orders/checkout', $this->payload($bundle, [
            'bundles' => [[
                'bundle_id' => $bundle->id,
                'quantity' => 1,
                'bundle_price' => 150,
                'products' => [
                    ['product_id' => $first->id, 'quantity' => 2],
                    ['product_id' => $second->id, 'quantity' => 1],
                ],
            ]],
            'total_amount' => 1,
        ]))->assertOk();

        $order = Order::with('items')->sole();
        $this->assertSame('200.00', $order->total_amount);
        $this->assertSame('0.00', $order->discount_amount);
        $this->assertCount(2, $order->items);
        $this->assertEqualsCanonicalizing(
            [[$first->id, 2], [$second->id, 1]],
            $order->items->map(fn ($item) => [$item->product_id, $item->quantity])->all(),
        );
        $this->assertTrue($order->items->every(fn ($item) => $item->bundle_id === $bundle->id));
        $this->assertSame(3, $first->fresh()->stock);
        $this->assertSame(4, $second->fresh()->stock);
    }

    public function test_modified_package_contents_are_rejected_without_an_order(): void
    {
        Sanctum::actingAs(User::factory()->create());
        [$bundle, $first] = $this->package();

        $this->postJson('/api/v1/orders/checkout', $this->payload($bundle, [
            'bundles' => [[
                'bundle_id' => $bundle->id,
                'quantity' => 1,
                'products' => [['product_id' => $first->id, 'quantity' => 99]],
            ]],
            'total_amount' => 1,
        ]))->assertUnprocessable()
            ->assertJsonValidationErrors(['bundles']);

        $this->assertDatabaseCount('orders', 0);
        $this->assertSame(5, $first->fresh()->stock);
    }

    public function test_standalone_quantity_stays_independent_from_the_same_product_inside_a_package(): void
    {
        Sanctum::actingAs(User::factory()->create());
        [$bundle, $first] = $this->package();

        $this->postJson('/api/v1/orders/checkout', $this->payload($bundle, [
            'items' => [['product_id' => $first->id, 'quantity' => 1]],
            'bundles' => [['bundle_id' => $bundle->id, 'quantity' => 1]],
            'total_amount' => 1,
        ]))->assertOk();

        $order = Order::with('items')->sole();
        $this->assertSame('280.00', $order->total_amount);
        $standalone = $order->items->first(fn ($item) => $item->bundle_id === null);
        $packaged = $order->items->first(fn ($item) => $item->bundle_id === $bundle->id && $item->product_id === $first->id);
        $this->assertSame(1, $standalone->quantity);
        $this->assertSame($first->id, $standalone->product_id);
        $this->assertSame(2, $packaged->quantity);
        $this->assertSame(2, $first->fresh()->stock);
    }

    public function test_multiple_complete_packages_multiply_the_saved_contents(): void
    {
        Sanctum::actingAs(User::factory()->create());
        [$bundle, $first, $second] = $this->package(stock: 8);

        $this->postJson('/api/v1/orders/checkout', $this->payload($bundle, [
            'bundles' => [['bundle_id' => $bundle->id, 'quantity' => 2]],
        ]))->assertOk();

        $order = Order::with('items')->sole();
        $this->assertSame('350.00', $order->total_amount);
        $this->assertSame(4, $order->items->firstWhere('product_id', $first->id)->quantity);
        $this->assertSame(2, $order->items->firstWhere('product_id', $second->id)->quantity);
    }

    public function test_insufficient_package_stock_does_not_create_an_order(): void
    {
        Sanctum::actingAs(User::factory()->create());
        [$bundle, $first] = $this->package(stock: 1);

        $this->postJson('/api/v1/orders/checkout', $this->payload($bundle))
            ->assertStatus(400)
            ->assertJsonPath('message', "Insufficient stock for product: {$first->name}");

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
        $this->assertSame(1, $first->fresh()->stock);
    }

    public function test_an_unavailable_package_is_rejected_without_an_order(): void
    {
        Sanctum::actingAs(User::factory()->create());
        [$bundle, $first] = $this->package();
        $bundle->update(['is_active' => false]);

        $this->postJson('/api/v1/orders/checkout', $this->payload($bundle))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['bundles']);

        $this->assertDatabaseCount('orders', 0);
        $this->assertSame(5, $first->fresh()->stock);
    }

    public function test_a_package_price_that_does_not_divide_evenly_still_reconciles_exactly(): void
    {
        Sanctum::actingAs(User::factory()->create());
        Setting::set('shipping_cost', '50');
        $product = Product::factory()->create([
            'stock' => 3,
            'price' => 9,
            'price_after_discount' => null,
            'en' => ['name' => 'Scale', 'description' => 'Scale'],
        ]);
        $bundle = new Bundle;
        $bundle->bundle_price = '10.00';
        $bundle->is_active = true;
        $bundle->fill(['en' => ['title' => 'Remainder set', 'description' => 'Offer']]);
        $bundle->save();
        $bundle->products()->attach($product->id, ['quantity' => 3]);

        $this->postJson('/api/v1/orders/checkout', $this->payload($bundle))->assertOk();

        $order = Order::with('items')->sole();
        $line = $order->items->sole();
        $this->assertSame(3, $line->quantity);
        $this->assertSame($bundle->id, $line->bundle_id);
        $this->assertSame('3.33', $line->price);
        $this->assertSame('10.00', $line->line_total);
        $this->assertSame('60.00', $order->total_amount);
        $this->assertSame('0.00', $order->discount_amount);
        $this->assertSame(1000, $this->cents($line->line_total));
        $this->assertSame(6000, $this->cents($order->total_amount));
        $this->assertSame(0, $product->fresh()->stock);
    }

    public function test_a_fixed_coupon_is_applied_once_to_the_saved_package_total(): void
    {
        Sanctum::actingAs(User::factory()->create());
        [$bundle] = $this->package();
        Coupon::query()->create([
            'code' => 'SAVE10',
            'discount_type' => 'fixed',
            'discount_value' => 10,
            'min_order_amount' => 0,
            'usage_limit' => 5,
            'usage_limit_per_user' => 1,
            'is_active' => true,
        ]);

        $this->postJson('/api/v1/orders/checkout', $this->payload($bundle, [
            'coupon_code' => 'SAVE10',
        ]))->assertOk();

        $order = Order::with('items')->sole();
        $packageCents = $order->items->reduce(fn (int $sum, $item) => $sum + $this->cents($item->line_total), 0);
        $this->assertSame(15000, $packageCents);
        $this->assertSame('10.00', $order->discount_amount);
        $this->assertSame('190.00', $order->total_amount);
        $this->assertSame(1, Coupon::query()->where('code', 'SAVE10')->value('used_count'));
    }

    public function test_combined_package_and_standalone_stock_fails_without_a_partial_order(): void
    {
        Sanctum::actingAs(User::factory()->create());
        [$bundle, $first, $second] = $this->package(stock: 3);

        $this->postJson('/api/v1/orders/checkout', $this->payload($bundle, [
            'items' => [['product_id' => $first->id, 'quantity' => 2]],
        ]))->assertStatus(400);

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
        $this->assertSame(3, $first->fresh()->stock);
        $this->assertSame(3, $second->fresh()->stock);
    }

    /**
     * @return array{0: Bundle, 1: Product, 2: Product}
     */
    private function package(int $stock = 5): array
    {
        Setting::set('shipping_cost', '50');
        $first = Product::factory()->create([
            'stock' => $stock,
            'price' => 100,
            'price_after_discount' => 80,
            'en' => ['name' => 'Mixer', 'description' => 'Mixer'],
        ]);
        $second = Product::factory()->create([
            'stock' => $stock,
            'price' => 40,
            'price_after_discount' => null,
            'en' => ['name' => 'Kettle', 'description' => 'Kettle'],
        ]);
        $bundle = new Bundle;
        $bundle->bundle_price = 150;
        $bundle->is_active = true;
        $bundle->fill(['en' => ['title' => 'Kitchen set', 'description' => 'Offer']]);
        $bundle->save();
        $bundle->products()->attach($first->id, ['quantity' => 2]);
        $bundle->products()->attach($second->id, ['quantity' => 1]);

        return [$bundle, $first, $second];
    }

    private function payload(Bundle $bundle, array $overrides = []): array
    {
        return array_replace([
            'customer_name' => 'Order Recipient',
            'customer_phone' => '01012345678',
            'shipping_address' => '10 Example Street',
            'payment_method' => 'cash_on_delivery',
            'bundles' => [['bundle_id' => $bundle->id, 'quantity' => 1]],
        ], $overrides);
    }

    private function cents(mixed $amount): int
    {
        $text = number_format((float) $amount, 2, '.', '');
        [$whole, $fraction] = explode('.', $text);

        return ((int) $whole) * 100 + (int) $fraction;
    }
}
