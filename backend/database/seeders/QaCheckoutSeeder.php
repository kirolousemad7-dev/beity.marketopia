<?php

namespace Database\Seeders;

use App\Models\Bundles\Bundle;
use App\Models\Categories\Category;
use App\Models\Coupon;
use App\Models\Products\Product;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class QaCheckoutSeeder extends Seeder
{
    public function run(): void
    {
        $database = str_replace('\\', '/', (string) config('database.connections.sqlite.database'));
        if (config('database.default') !== 'sqlite' || ! str_ends_with($database, 'storage/framework/testing/beity-qa-checkout.sqlite')) {
            throw new RuntimeException('Refusing to seed because the connection is not the isolated QA database.');
        }

        $category = Category::factory()->create([
            'en' => ['name' => 'QA Kitchen', 'slug' => 'qa-kitchen'],
        ]);
        $mixer = $this->product($category->id, 'qa-mixer', 'QA-MIXER', 'QA Mixer', 100, 80, 40);
        $kettle = $this->product($category->id, 'qa-kettle', 'QA-KETTLE', 'QA Kettle', 40, null, 40);
        $scale = $this->product($category->id, 'qa-scale', 'QA-SCALE', 'QA Scale', 9, null, 9);
        $limited = $this->product($category->id, 'qa-limited', 'QA-LIMITED', 'QA Limited', 20, null, 2);

        $this->bundle('QA Kitchen Set', '150.00', [
            $mixer->id => 2,
            $kettle->id => 1,
        ]);
        $this->bundle('QA Remainder Set', '10.00', [
            $scale->id => 3,
        ]);
        $this->bundle('QA Limited Set', '15.00', [
            $limited->id => 2,
        ]);

        User::factory()->create([
            'name' => 'QA Customer',
            'email' => 'qa.customer@example.test',
            'password' => Hash::make('password'),
        ]);
        User::factory()->admin()->create([
            'name' => 'QA Admin',
            'email' => 'qa.admin@example.test',
            'password' => Hash::make('password'),
        ]);
        Coupon::query()->create([
            'code' => 'SAVE10',
            'discount_type' => 'fixed',
            'discount_value' => 10,
            'min_order_amount' => 0,
            'usage_limit' => 5,
            'usage_limit_per_user' => 1,
            'is_active' => true,
        ]);
        Setting::set('shipping_cost', '50');
        Setting::set('contact_phone', '01055550123');
        Setting::set('contact_email', 'qa@example.test');
        Setting::set('instapay_number', '01055550124');
    }

    private function product(int $categoryId, string $slug, string $sku, string $name, int $price, ?int $discount, int $stock): Product
    {
        return Product::factory()->create([
            'category_id' => $categoryId,
            'slug' => $slug,
            'sku' => $sku,
            'price' => $price,
            'price_after_discount' => $discount,
            'stock' => $stock,
            'is_active' => true,
            'en' => ['name' => $name, 'description' => 'Synthetic QA product'],
        ]);
    }

    /**
     * @param  array<int, int>  $contents
     */
    private function bundle(string $title, string $price, array $contents): void
    {
        $bundle = new Bundle;
        $bundle->bundle_price = $price;
        $bundle->is_active = true;
        $bundle->fill(['en' => ['title' => $title, 'description' => 'Synthetic QA package']]);
        $bundle->save();
        foreach ($contents as $productId => $quantity) {
            $bundle->products()->attach($productId, ['quantity' => $quantity]);
        }
    }
}
