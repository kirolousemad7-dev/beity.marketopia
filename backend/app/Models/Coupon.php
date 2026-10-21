<?php

namespace App\Models;

use App\Models\Orders\Order;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Coupon extends Model
{
    protected $fillable = [
        'code', 'discount_type', 'discount_value', 'min_order_amount',
        'max_discount_amount', 'usage_limit', 'used_count',
        'usage_limit_per_user', 'expires_at', 'is_active'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function isValid($orderAmount = 0): bool
    {
        if (!$this->is_active) return false;
        if ($this->expires_at && Carbon::now()->greaterThan($this->expires_at)) return false;
        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) return false;
        if ($orderAmount < $this->min_order_amount) return false;
        return true;
    }

    public function calculateDiscount(float $orderAmount): float
    {
        if ($this->discount_type === 'fixed') {
            return min($this->discount_value, $orderAmount);
        }

        if ($this->discount_type === 'percent') {
            $discount = ($orderAmount * $this->discount_value) / 100;
            if ($this->max_discount_amount !== null) {
                $discount = min($discount, $this->max_discount_amount);
            }
            return min($discount, $orderAmount);
        }

        return 0;
    }
}