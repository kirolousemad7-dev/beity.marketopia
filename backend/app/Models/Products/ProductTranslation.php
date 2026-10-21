<?php

namespace App\Models\Products;

use Illuminate\Database\Eloquent\Model;

class ProductTranslation extends Model
{
    public $timestamps = false;

    protected $fillable = ['name', 'description'];
}