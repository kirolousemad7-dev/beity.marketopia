<?php

namespace Tests\Feature\Orders;

use App\Models\User;
use Database\Factories\Orders\OrderFactory;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderCustomerInformationTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_order_history_returns_customer_details_only_to_the_owner(): void
    {
        $owner = User::factory()->create();
        $order = OrderFactory::new()->for($owner)->withCustomerInformation()->create();
        OrderFactory::new()->withCustomerInformation()->create();
        Sanctum::actingAs($owner);

        $this->getJson('/api/v1/orders')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $order->id)
            ->assertJsonPath('data.0.customer_name', $order->customer_name)
            ->assertJsonPath('data.0.customer_phone', '01012345678')
            ->assertJsonPath('data.0.additional_phone', '01098765432');
    }

    public function test_historical_orders_without_customer_details_still_render(): void
    {
        $owner = User::factory()->create();
        $order = OrderFactory::new()->for($owner)->create();
        Sanctum::actingAs($owner);

        $this->getJson('/api/v1/orders')
            ->assertOk()
            ->assertJsonPath('data.0.id', $order->id)
            ->assertJsonPath('data.0.customer_name', null)
            ->assertJsonPath('data.0.customer_phone', null)
            ->assertJsonPath('data.0.additional_phone', null);
    }

    public function test_admin_order_view_displays_customer_details_with_escaped_names(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $order = OrderFactory::new()->withCustomerInformation()->create([
            'customer_name' => '<script>Recipient</script>',
        ]);
        $order->transaction()->create([
            'amount' => 210,
            'status' => 'pending',
            'payment_method' => 'cash_on_delivery',
        ]);

        $this->actingAs($admin)->get('/admin/orders/'.$order->id)
            ->assertOk()
            ->assertSee('<script>Recipient</script>')
            ->assertDontSee('<script>Recipient</script>', false)
            ->assertSee('01012345678')
            ->assertSee('01098765432');
    }

    public function test_non_admin_cannot_view_customer_details_in_the_admin_panel_with_403(): void
    {
        $order = OrderFactory::new()->withCustomerInformation()->create();

        $this->actingAs(User::factory()->create(['is_admin' => false]))
            ->get('/admin/orders/'.$order->id)
            ->assertForbidden();
    }
}
