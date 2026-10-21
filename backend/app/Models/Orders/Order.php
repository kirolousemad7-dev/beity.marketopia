<?php

namespace App\Models\Orders;

use App\Enums\BostaSubmissionStatus;
use App\Models\Coupon;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'user_id',
        'total_amount',
        'status',
        'shipping_address',
        'customer_name',
        'customer_phone',
        'additional_phone',

        'coupon_id',
        'discount_amount',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'bosta_address' => 'array',
        'bosta_submission_status' => BostaSubmissionStatus::class,
        'bosta_submitted_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Order $order): void {
            $order->order_number = 'DC-'.now()->format('ymd').'-'.Str::upper(Str::random(8));
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function transaction(): HasOne
    {
        return $this->hasOne(PaymentTransaction::class);
    }

    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }
}
