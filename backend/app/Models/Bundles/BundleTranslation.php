<?php

namespace App\Models\Bundles;

use Illuminate\Database\Eloquent\Model;

class BundleTranslation extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'title',
        'description',
    ];
}
