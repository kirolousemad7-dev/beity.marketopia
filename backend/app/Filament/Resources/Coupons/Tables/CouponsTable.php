<?php

namespace App\Filament\Resources\Coupons\Tables;

use App\Models\Coupon;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class CouponsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('code')
                    ->searchable()
                    ->copyable()
                    ->badge()
                    ->color('primary')
                    ->weight('bold'),

                TextColumn::make('discount_type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'fixed' => 'success',
                        'percent' => 'warning',
                    })
                    ->formatStateUsing(fn (string $state) => strtoupper($state)),

                TextColumn::make('discount_value')
                    ->label('Discount')
                    ->formatStateUsing(fn (Coupon $record) => 
                        $record->discount_type === 'fixed' 
                            ? number_format($record->discount_value, 2) . ' EGP' 
                            : $record->discount_value . '%'
                    )
                    ->weight('bold'),

                TextColumn::make('used_count')
                    ->label('Usage')
                    ->formatStateUsing(fn (Coupon $record) => $record->used_count . ' / ' . ($record->usage_limit ?? '∞'))
                    ->badge(),

                IconColumn::make('is_active')
                    ->boolean()
                    ->label('Active'),

                TextColumn::make('expires_at')
                    ->dateTime('d M Y, h:i A')
                    ->sortable()
                    ->color(fn (Coupon $record) => $record->expires_at?->isPast() ? 'danger' : 'success')
                    ->description(fn (Coupon $record) => $record->expires_at?->isPast() ? 'Expired' : 'Valid'),

                TextColumn::make('created_at')
                    ->dateTime()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('discount_type')
                    ->options(['fixed' => 'Fixed', 'percent' => 'Percent']),
                TernaryFilter::make('is_active')->label('Active'),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}