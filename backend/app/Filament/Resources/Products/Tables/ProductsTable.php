<?php

namespace App\Filament\Resources\Products\Tables;

use App\Models\Products\Product;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\SpatieMediaLibraryImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ToggleColumn;
use Filament\Tables\Table;

class ProductsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                SpatieMediaLibraryImageColumn::make('image')->collection('product-images')->circular(),
                TextColumn::make('name')->label('Product')->searchable(),
                TextColumn::make('sku')->searchable()->copyable(),
                TextColumn::make('price')->money("EGP")->sortable(),
                TextColumn::make('price_after_discount')->money("EGP")->sortable(),
                TextColumn::make('stock')->label('Stock')->numeric()->sortable(),
                ToggleColumn::make('is_active')->label('Active'),
            ])
            // ->filters([
            //     TrashedFilter::make(),
            // ])
            ->recordActions([
                EditAction::make()
                    ->mutateRecordDataUsing(fn (array $data, Product $record): array => self::withTranslations(
                        $data,
                        $record,
                        ['name', 'description'],
                    )),
                DeleteAction::make()->authorizationNotification(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make()
                        ->authorizeIndividualRecords('delete')
                        ->failureNotificationTitle(__('A product included in an order cannot be deleted.')),
                ]),
            ]);
    }

    /** @param list<string> $attributes */
    private static function withTranslations(array $data, Product $record, array $attributes): array
    {
        foreach (['en', 'ar'] as $locale) {
            $data[$locale] = $record->translate($locale)?->only($attributes) ?? [];
        }

        return $data;
    }
}
