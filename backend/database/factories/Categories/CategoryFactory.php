<?php

namespace Database\Factories\Categories;

use App\Models\Categories\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'en' => ['name' => fake()->words(2, true), 'slug' => fake()->unique()->slug()],
        ];
    }
}
