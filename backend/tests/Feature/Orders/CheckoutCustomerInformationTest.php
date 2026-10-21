<?php

namespace Tests\Feature\Orders;

use App\Models\Orders\Order;
use App\Models\Setting;
use App\Models\User;
use Database\Factories\Products\ProductFactory;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class CheckoutCustomerInformationTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_checkout_persists_recipient_details_separately_from_the_account(): void
    {
        $user = User::factory()->create(['name' => 'Account Owner']);
        Sanctum::actingAs($user);
        $payload = $this->checkoutPayload();
        $payload['additional_phone'] = '+20 (109) 876-5432';
        $payload['user_id'] = User::factory()->create()->id;

        $this->postJson('/api/v1/orders/checkout', $payload)
            ->assertOk()
            ->assertJsonPath('message.order.customer_name', 'Order Recipient')
            ->assertJsonPath('message.order.customer_phone', '01012345678')
            ->assertJsonPath('message.order.additional_phone', '+20 (109) 876-5432');

        $order = Order::sole();
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'user_id' => $user->id,
            'customer_name' => 'Order Recipient',
            'customer_phone' => '01012345678',
            'additional_phone' => '+20 (109) 876-5432',
        ]);
        $this->assertSame('Account Owner', $user->fresh()->name);
        $this->assertDatabaseHas('products', ['id' => $payload['items'][0]['product_id'], 'stock' => 3]);
        $this->assertDatabaseHas('payment_transactions', ['order_id' => $order->id, 'payment_method' => 'cash_on_delivery']);
    }

    public static function absentAdditionalPhones(): array
    {
        return ['omitted' => [false, null], 'null' => [true, null], 'blank' => [true, '   ']];
    }

    #[DataProvider('absentAdditionalPhones')]
    public function test_checkout_accepts_an_optional_additional_phone(bool $include, ?string $value): void
    {
        Sanctum::actingAs(User::factory()->create());
        $payload = $this->checkoutPayload();
        if ($include) {
            $payload['additional_phone'] = $value;
        }
        $payload['customer_name'] = '  Order Recipient  ';
        $payload['customer_phone'] = '  01012345678  ';

        $this->postJson('/api/v1/orders/checkout', $payload)
            ->assertOk()
            ->assertJsonPath('message.order.customer_name', 'Order Recipient')
            ->assertJsonPath('message.order.customer_phone', '01012345678')
            ->assertJsonPath('message.order.additional_phone', null);

        $this->assertDatabaseHas('orders', [
            'customer_name' => 'Order Recipient',
            'customer_phone' => '01012345678',
            'additional_phone' => null,
        ]);
    }

    public function test_checkout_rejects_missing_customer_details_with_422_before_changing_stock(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $payload = $this->checkoutPayload();
        unset($payload['customer_name'], $payload['customer_phone']);

        $this->postJson('/api/v1/orders/checkout', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['customer_name', 'customer_phone'])
            ->assertJsonPath('errors.customer_name.0', 'Customer name is required.')
            ->assertJsonPath('errors.customer_phone.0', 'Customer phone number is required.');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('payment_transactions', 0);
        $this->assertDatabaseHas('products', ['id' => $payload['items'][0]['product_id'], 'stock' => 5]);
    }

    public static function invalidCustomerDetails(): array
    {
        return [
            'blank name' => ['customer_name', '   '],
            'name array' => ['customer_name', ['Recipient']],
            'name too long' => ['customer_name', str_repeat('a', 101)],
            'blank phone' => ['customer_phone', '   '],
            'phone array' => ['customer_phone', ['01012345678']],
            'phone too long' => ['customer_phone', '01012345678'.str_repeat(' ', 20).'0'],
            'invalid primary phone' => ['customer_phone', 'invalid'],
            'additional phone array' => ['additional_phone', ['01012345678']],
            'additional phone too long' => ['additional_phone', '01012345678'.str_repeat(' ', 20).'0'],
            'invalid additional phone' => ['additional_phone', 'invalid'],
        ];
    }

    #[DataProvider('invalidCustomerDetails')]
    public function test_checkout_rejects_invalid_customer_details_with_422(string $field, mixed $value): void
    {
        Sanctum::actingAs(User::factory()->create());
        $payload = $this->checkoutPayload();
        $payload[$field] = $value;

        $this->postJson('/api/v1/orders/checkout', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors([$field]);

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseHas('products', ['id' => $payload['items'][0]['product_id'], 'stock' => 5]);
    }

    public function test_customer_validation_messages_are_translated_into_arabic(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $payload = $this->checkoutPayload();
        $payload['customer_name'] = '';
        $payload['customer_phone'] = 'invalid';

        $this->withHeader('Accept-Language', 'ar')->postJson('/api/v1/orders/checkout', $payload)
            ->assertUnprocessable()
            ->assertJsonPath('errors.customer_name.0', 'اسم العميل مطلوب.')
            ->assertJsonPath('errors.customer_phone.0', 'أدخل رقم هاتف صحيحاً يتكون من ٧ إلى ١٥ رقماً.');
    }

    public function test_checkout_requires_authentication_with_401(): void
    {
        $this->postJson('/api/v1/orders/checkout', [
            'customer_name' => 'Order Recipient',
            'customer_phone' => '01012345678',
        ])->assertUnauthorized();

        $this->assertDatabaseCount('orders', 0);
    }

    private function checkoutPayload(): array
    {
        Setting::set('shipping_cost', '50');
        $product = ProductFactory::new()->create();

        return [
            'customer_name' => 'Order Recipient',
            'customer_phone' => '01012345678',
            'shipping_address' => '10 Example Street',
            'payment_method' => 'cash_on_delivery',
            'total_amount' => 210,
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ];
    }
}
