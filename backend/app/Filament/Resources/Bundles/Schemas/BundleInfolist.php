<?php
namespace App\Filament\Resources\Bundles\Schemas;

use Filament\Infolists;
use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\RepeatableEntry;
use Filament\Infolists\Components\SpatieMediaLibraryImageEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class BundleInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Bundle Information')
                    ->schema([
                        SpatieMediaLibraryImageEntry::make('image')
                            ->columnSpanFull(),

                        TextEntry::make('title')
                            ->label('Title'),

                        TextEntry::make('slug')
                            ->label('Slug'),

                        TextEntry::make('bundle_price')
                            ->money('USD')
                            ->label('Bundle Price'),

                        IconEntry::make('is_active')
                            ->boolean()
                            ->label('Active Status'),

                        TextEntry::make('description')
                            ->html()
                            ->columnSpanFull(),
                    ])->columns(2),

                Section::make('Included Products')
                    ->schema([
                        RepeatableEntry::make('products')
                            ->schema([
                                TextEntry::make('name')
                                    ->label('Product Name'),

                                TextEntry::make('price')
                                    ->money('USD')
                                    ->label('Unit Price'),

                                TextEntry::make('pivot.quantity')
                                    ->label('Quantity in Bundle'),
                            ])
                            ->columns(3)
                            ->columnSpanFull(),
                    ]),
            ]);
    }
}