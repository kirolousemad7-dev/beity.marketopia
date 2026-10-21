<?php

namespace App\Filament\Support;

use Astrotomic\Translatable\Contracts\Translatable;
use Illuminate\Database\Eloquent\Model;

final class LocalizedRecordLabel
{
    public static function get(Model&Translatable $record, string $attribute): string
    {
        $locales = array_unique([
            app()->getLocale(),
            config('app.fallback_locale'),
            'en',
            'ar',
        ]);

        foreach ($locales as $locale) {
            $value = $record->translate($locale, false)?->getAttribute($attribute);

            if (is_string($value) && filled($value)) {
                return $value;
            }
        }

        return __('Untitled record').' #'.$record->getKey();
    }
}
