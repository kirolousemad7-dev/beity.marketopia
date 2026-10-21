<?php

namespace App\Filament\Resources\Bundles\Schemas;

use App\Filament\Support\LocalizedTabs;
use App\Models\Products\Product;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\SpatieMediaLibraryFileUpload;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Str;

class BundleForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([

                Section::make('Bundle Information')
                    ->columnSpanFull()
                    ->schema([
                        SpatieMediaLibraryFileUpload::make('image')
                            ->image()
                            ->multiple()
                            ->reorderable()
                            ->disk('public') 
                            ->visibility('public')
                            ->imageEditor()
                            ->columnSpanFull(),

                        LocalizedTabs::make(self::translationFields('en'), self::translationFields('ar'))
                            ->columnSpanFull(),

                        TextInput::make('bundle_price')
                            ->required()
                            ->numeric()
                            ->prefix('EGP')
                            ->minValue(0),

                        Toggle::make('is_active')
                            ->label('Available on Store')
                            ->default(true)
                            ->required(),

                    ])
                    ->columns(2),

                Section::make('Included Products')
                    ->columnSpanFull()
                    ->description(
                        'Select the products that make up this bundle and specify their quantities.'
                    )
                    ->schema([

                        Repeater::make('bundleItems')
                            ->relationship('bundleItems')
                            ->schema([

                                Select::make('product_id')
                                    ->label('Product')
                                    ->options(
                                        Product::all()->pluck('name', 'id')
                                    )
                                    ->searchable()
                                    ->preload()
                                    ->required()
                                    ->columnSpan(2),

                                TextInput::make('quantity')
                                    ->numeric()
                                    ->default(1)
                                    ->minValue(1)
                                    ->required()
                                    ->columnSpan(1),

                            ])
                            ->columns(3)
                            ->defaultItems(1)
                            ->addActionLabel('Add Product to Bundle')
                            ->reorderable(false)
                            ->columnSpanFull(),

                    ]),

            ]);
    }

    private static function translationFields(string $locale): array
    {
        $direction = LocalizedTabs::direction($locale);

        return [
            TextInput::make("{$locale}.title")->label(LocalizedTabs::label($locale, 'Title', 'الاسم'))->required()->maxLength(255)->extraInputAttributes($direction),
            RichEditor::make("{$locale}.description")->label(LocalizedTabs::label($locale, 'Description', 'الوصف'))->columnSpanFull()->extraInputAttributes($direction),
        ];
    }
}
