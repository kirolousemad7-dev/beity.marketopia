<?php

namespace App\Filament\Support;

use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;

final class LocalizedTabs
{
    /**
     * @param  array<int, mixed>  $englishSchema
     * @param  array<int, mixed>  $arabicSchema
     */
    public static function make(array $englishSchema, array $arabicSchema): Tabs
    {
        return Tabs::make('Translations / الترجمات')
            ->tabs([
                self::tab('en', $englishSchema),
                self::tab('ar', $arabicSchema),
            ]);
    }

    /** @return array{dir: string} */
    public static function direction(string $locale): array
    {
        return ['dir' => $locale === 'ar' ? 'rtl' : 'ltr'];
    }

    public static function label(string $locale, string $english, string $arabic): string
    {
        return $locale === 'ar' ? $arabic : $english;
    }

    /** @param array<int, mixed> $schema */
    private static function tab(string $locale, array $schema): Tab
    {
        return Tab::make($locale === 'ar' ? 'العربية' : 'English')
            ->icon('heroicon-o-language')
            ->extraAttributes(self::direction($locale))
            ->schema($schema);
    }
}
