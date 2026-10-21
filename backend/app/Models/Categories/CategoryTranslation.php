<?php

namespace App\Models\Categories;

use Illuminate\Database\Eloquent\Model;

class CategoryTranslation extends Model
{
    public $timestamps = false;

    protected $fillable = ['name', 'slug', 'locale'];

    protected static function booted(): void
    {
        static::saving(function (CategoryTranslation $translation) {
            $translation->slug = generateSlug($translation->name);
        });
    }
}