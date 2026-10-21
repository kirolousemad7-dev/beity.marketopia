<?php

namespace App\Models\Orders;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class PaymentTransaction extends Model implements HasMedia
{
    use InteractsWithMedia;
    
    protected $fillable = [
        'order_id',
        'amount',
        'status',
        'payment_method',
    ];
 
    protected $casts = [
        'amount' => 'decimal:2',
    ];
 
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
    
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('payment_screenshot')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg','image/png','image/jpg','image/webp']);
    }
}
