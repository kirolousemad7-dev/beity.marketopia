<?php

namespace Database\Seeders;

use App\Models\Coupon;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class CouponSeeder extends Seeder
{
    public function run(): void
    {
        $coupons = [
            [
                'code' => 'WELCOME50',
                'discount_type' => 'fixed',
                'discount_value' => 50,
                'min_order_amount' => 200,
                'max_discount_amount' => null,
                'usage_limit' => 100,
                'used_count' => 0,
                'usage_limit_per_user' => 1,
                'expires_at' => Carbon::now()->addDays(30),
                'is_active' => true,
            ],
            [
                'code' => 'FIX100',
                'discount_type' => 'fixed',
                'discount_value' => 100,
                'min_order_amount' => 500,
                'max_discount_amount' => null,
                'usage_limit' => 50,
                'used_count' => 12,
                'usage_limit_per_user' => 1,
                'expires_at' => Carbon::now()->addDays(15),
                'is_active' => true,
            ],
            [
                'code' => 'SALE20',
                'discount_type' => 'percent',
                'discount_value' => 20,
                'min_order_amount' => 300,
                'max_discount_amount' => 150, // 20% max 150 EGP
                'usage_limit' => 200,
                'used_count' => 45,
                'usage_limit_per_user' => 1,
                'expires_at' => Carbon::now()->addDays(60),
                'is_active' => true,
            ],
            [
                'code' => 'RAMADAN30',
                'discount_type' => 'percent',
                'discount_value' => 30,
                'min_order_amount' => 400,
                'max_discount_amount' => 200,
                'usage_limit' => 100,
                'used_count' => 0,
                'usage_limit_per_user' => 1,
                'expires_at' => Carbon::now()->addMonth(),
                'is_active' => true,
            ],
            [
                'code' => 'BLACKFRIDAY50',
                'discount_type' => 'percent',
                'discount_value' => 50,
                'min_order_amount' => 1000,
                'max_discount_amount' => 500, // 50% max 500 EGP
                'usage_limit' => 20,
                'used_count' => 0,
                'usage_limit_per_user' => 1,
                'expires_at' => Carbon::now()->addDays(7),
                'is_active' => true,
            ],
            [
                'code' => 'UNLIMITED10',
                'discount_type' => 'percent',
                'discount_value' => 10,
                'min_order_amount' => 0,
                'max_discount_amount' => 50,
                'usage_limit' => null, // unlimited
                'used_count' => 120,
                'usage_limit_per_user' => null,
                'expires_at' => null, // no expiry
                'is_active' => true,
            ],
            // For testing filters
            [
                'code' => 'EXPIRED20',
                'discount_type' => 'percent',
                'discount_value' => 20,
                'min_order_amount' => 0,
                'max_discount_amount' => 100,
                'usage_limit' => 10,
                'used_count' => 10,
                'usage_limit_per_user' => 1,
                'expires_at' => Carbon::now()->subDays(5),
                'is_active' => true,
            ],
            [
                'code' => 'INACTIVE50',
                'discount_type' => 'fixed',
                'discount_value' => 50,
                'min_order_amount' => 0,
                'max_discount_amount' => null,
                'usage_limit' => 100,
                'used_count' => 0,
                'usage_limit_per_user' => 1,
                'expires_at' => Carbon::now()->addDays(30),
                'is_active' => false,
            ],
        ];

        foreach ($coupons as $coupon) {
            Coupon::create($coupon);
        }
    }
}