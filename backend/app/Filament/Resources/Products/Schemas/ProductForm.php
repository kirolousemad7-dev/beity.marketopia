<?php

namespace App\Filament\Resources\Products\Schemas;

use App\Filament\Support\LocalizedRecordLabel;
use App\Filament\Support\LocalizedTabs;
use App\Models\Categories\Category;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\SpatieMediaLibraryFileUpload;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ProductForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                SpatieMediaLibraryFileUpload::make('images')
                    ->collection('product-images')
                    ->image()
                    ->multiple()
                    ->reorderable()
                    ->imageEditor()
                    ->disk('public')
                    ->visibility('public')
                    ->columnSpanFull(),
                LocalizedTabs::make(self::translationFields('en'), self::translationFields('ar'))
                    ->columnSpanFull(),
                Section::make(__('Catalog and pricing'))
                    ->columns(2)
                    ->columnSpanFull()
                    ->schema([
                        TextInput::make('sku')->required()->maxLength(255)->unique(ignoreRecord: true),
                        Select::make('category_id')
                            ->relationship('category')
                            ->required()
                            ->getOptionLabelFromRecordUsing(fn(Category $record): string => LocalizedRecordLabel::get($record, 'name'))
                            ->preload()
                            ->label(__('Category')),
                        TextInput::make('stock')->numeric()->minValue(0)->default(0),
                        TextInput::make('price')->label('Price (minor units)')->numeric()->minValue(0)->required(),
                        TextInput::make('price_after_discount')->label('Price after discount')->numeric()->minValue(0)->nullable(),
                        Toggle::make('is_active')->label(__('Active'))->columnSpanFull(),
                    ]),
            ]);
    }

    private static function translationFields(string $locale): array
    {
        $direction = LocalizedTabs::direction($locale);

        return [
            TextInput::make("{$locale}.name")->label(LocalizedTabs::label($locale, 'Name', 'الاسم'))->required()->maxLength(255)->extraInputAttributes($direction),
            Textarea::make("{$locale}.description")->label(LocalizedTabs::label($locale, 'Description', 'الوصف'))->rows(8)->columnSpanFull()->extraInputAttributes($direction),
        ];
    }
}
