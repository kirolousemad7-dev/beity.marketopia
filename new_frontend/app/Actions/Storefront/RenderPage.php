<?php

namespace App\Actions\Storefront;

use Illuminate\Contracts\View\View;

class RenderPage
{
    public function handle(string $locale, string $page, ?string $slug = null): View
    {
        abort_unless(in_array($locale, config('storefront.locales'), true), 404);
        app()->setLocale($locale);
        $dictionary = json_decode(file_get_contents(resource_path("dictionaries/{$locale}.json")), true, flags: JSON_THROW_ON_ERROR);

        return view("pages.{$page}", [
            'locale' => $locale,
            'page' => $page,
            'slug' => $slug,
            'dict' => $dictionary,
        ]);
    }
}
