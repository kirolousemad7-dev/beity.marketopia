<?php

namespace App\Models\Bundles; // Adjust to your namespace structure

use App\Models\Products\Product;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BundleItem extends Pivot
{
    protected $table = 'bundle_items';

    public $incrementing = true;

    protected $fillable = [
        'bundle_id',
        'product_id',
        'quantity',
    ];

    public function bundle(): BelongsTo
    {
        return $this->belongsTo(Bundle::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}