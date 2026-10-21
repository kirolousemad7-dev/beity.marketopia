<?php

namespace App\Models\Bundles;

use App\Models\Products\Product;
use Astrotomic\Translatable\Contracts\Translatable as TranslatableContract;
use Astrotomic\Translatable\Translatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Bundle extends Model implements HasMedia, TranslatableContract
{
    use InteractsWithMedia, Translatable;

    protected $fillable = [
        'slug',
        'bundle_price',
        'is_active',
    ];

    public $translatedAttributes = [
        'title',
        'description',
    ];

    protected $casts = [
        'bundle_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'bundle_items')
            ->withPivot('quantity')
            ->withTimestamps();
    }

    public function bundleItems(): HasMany
    {
        return $this->hasMany(BundleItem::class);
    }

    public function getOriginalTotalAttribute(): float
    {
        return $this->products->sum(function ($product) {
            return $product->price * $product->pivot->quantity;
        });
    }

    public static function scopeActive(Builder $query)
    {
        $query->where('is_active', true);
    }

    protected static function booted(): void
    {
        static::saving(function (Bundle $bundle) {
            $title = $bundle->getTranslation('en')->title;

            if ($title && (empty($bundle->slug) || $bundle->isDirty())) {
                $bundle->slug = generateSlug($title);
            }
        });
    }


    /*
    |--------------------------------------------------------------------------
    | English translation
    |--------------------------------------------------------------------------
    */

    public function getEnAttribute(): array
    {
        $translation = $this->translate('en');

        return [
            'title' => $translation?->title,
            'description' => $translation?->description,
        ];
    }

    public function setEnAttribute($value): void
    {
        if (! is_array($value)) {
            return;
        }

        $this->setTranslation('en', [
            'title' => $value['title'] ?? null,
            'description' => $value['description'] ?? null,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Arabic translation
    |--------------------------------------------------------------------------
    */

    public function getArAttribute(): array
    {
        $translation = $this->translate('ar');

        return [
            'title' => $translation?->title,
            'description' => $translation?->description,
        ];
    }

    public function setArAttribute($value): void
    {
        if (! is_array($value)) {
            return;
        }

        $this->setTranslation('ar', [
            'title' => $value['title'] ?? null,
            'description' => $value['description'] ?? null,
        ]);
    }
}
