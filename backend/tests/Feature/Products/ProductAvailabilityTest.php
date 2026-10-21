<?php

namespace Tests\Feature\Products;

use App\Interfaces\ProductInterface;
use Database\Factories\Products\ProductFactory;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class ProductAvailabilityTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_deleted_products_return_not_found_with_404(): void
    {
        $product = ProductFactory::new()->create();
        $slug = $product->slug;
        $product->delete();

        $this->getJson('/api/v1/products/'.$slug)
            ->assertNotFound()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', "This product doesn't exist");
    }

    public function test_existing_products_remain_available_with_200(): void
    {
        $product = ProductFactory::new()->create();

        $this->getJson('/api/v1/products/'.$product->slug)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $product->id);
    }

    public function test_unexpected_product_failures_remain_server_errors_with_500(): void
    {
        $this->mock(ProductInterface::class)
            ->shouldReceive('show')->once()->with('coffee-machine')
            ->andThrow(new RuntimeException('Private error details'));

        $this->getJson('/api/v1/products/coffee-machine')
            ->assertStatus(500)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'An error occurred while fetching the product.')
            ->assertDontSee('Private error details');
    }
}
