<?php

namespace App\Filament\Resources\Categories\Tables;

use App\Models\Categories\Category;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\SpatieMediaLibraryImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class CategoriesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                SpatieMediaLibraryImageColumn::make('image')->collection('category-images')->circular(),
                TextColumn::make('name')->label('Category')->wrap(),
                TextColumn::make('products_count')->counts('products')->label('Products')->numeric()->sortable(),
            ])
            // ->filters([
            //     TrashedFilter::make(),
            // ])
            ->recordActions([
                EditAction::make()
                    ->mutateRecordDataUsing(fn (array $data, Category $record): array => self::withTranslations(
                        $data,
                        $record,
                        ['name', 'description', 'meta_title', 'meta_description'],
                    )),
                DeleteAction::make()->authorizationNotification(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make()
                        ->authorizeIndividualRecords('delete')
                        ->failureNotificationTitle(__('A category containing products cannot be deleted.')),
                ]),
            ]);
    }

    /** @param list<string> $attributes */
    private static function withTranslations(array $data, Category $record, array $attributes): array
    {
        foreach (['en', 'ar'] as $locale) {
            $data[$locale] = $record->translate($locale)?->only($attributes) ?? [];
        }

        return $data;
    }
}
