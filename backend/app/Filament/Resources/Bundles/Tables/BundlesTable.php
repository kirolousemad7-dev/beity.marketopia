<?php

namespace App\Filament\Resources\Bundles\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\SpatieMediaLibraryImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class BundlesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                SpatieMediaLibraryImageColumn::make('image')
                    ->circular(),
                
                TextColumn::make('title')
                    ->searchable(isIndividual: true, query: function (Builder $query, string $search): Builder {
                        return $query->whereHas('translations', function ($q) use ($search) {
                            $q->where('locale', app()->getLocale())
                              ->where('title', 'like', "%{$search}%");
                        });
                    })
                    ->sortable(query: function (Builder $query, string $direction): Builder {
                        $locale = app()->getLocale();
                        return $query
                            ->leftJoin('bundle_translations', function ($join) use ($locale) {
                                $join->on('bundles.id', '=', 'bundle_translations.bundle_id')
                                     ->where('bundle_translations.locale', '=', $locale);
                            })
                            ->orderBy('bundle_translations.title', $direction)
                            ->select('bundles.*'); // Prevent column collision
                    }),

                TextColumn::make('bundle_price')
                    ->money('EGP')
                    ->sortable(),

                IconColumn::make('is_active')
                    ->boolean()
                    ->label('Active'),

                TextColumn::make('products_count')
                    ->counts('products')
                    ->label('Items Count'),
            ])
            ->filters([
                TernaryFilter::make('is_active'),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
