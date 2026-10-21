<?php

namespace Database\Factories\Orders;

use App\Models\Orders\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'total_amount' => 210,
            'status' => 'pending',
            'shipping_address' => fake()->address(),
            'customer_name' => null,
            'customer_phone' => null,
            'additional_phone' => null,
        ];
    }

    public function withCustomerInformation(): static
    {
        return $this->state(fn (array $attributes): array => [
            'customer_name' => fake()->name(),
            'customer_phone' => '01012345678',
            'additional_phone' => '01098765432',
        ]);
    }
}
