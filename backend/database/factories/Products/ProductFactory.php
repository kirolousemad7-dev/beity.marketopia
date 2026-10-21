<?php

namespace Database\Factories\Products;

use App\Models\Products\Product;
use Database\Factories\Categories\CategoryFactory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category_id' => CategoryFactory::new(),
            'slug' => fake()->unique()->slug(),
            'sku' => fake()->unique()->uuid(),
            'price' => 100,
            'price_after_discount' => 80,
            'stock' => 5,
            'is_active' => true,
            'en' => ['name' => fake()->words(3, true), 'description' => fake()->sentence()],
        ];
    }
}
