<?php

namespace App\Filament\Resources\Categories\Schemas;

use App\Filament\Support\LocalizedTabs;
use Filament\Forms\Components\SpatieMediaLibraryFileUpload;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class CategoryForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                SpatieMediaLibraryFileUpload::make('image')
                    ->collection('category-images')
                    ->image()
                    ->imageEditor()
                    ->disk('public')
                    ->visibility('public')
                    ->columnSpanFull(),
                LocalizedTabs::make(self::translationFields('en'), self::translationFields('ar'))
                    ->columnSpanFull(),
            ]);
    }

    /** @return array<int, TextInput|Textarea> */
    private static function translationFields(string $locale): array
    {
        $direction = LocalizedTabs::direction($locale);

        return [
            TextInput::make("{$locale}.name")->label(LocalizedTabs::label($locale, 'Name', 'الاسم'))->required()->maxLength(255)->extraInputAttributes($direction),
        ];
    }
}
