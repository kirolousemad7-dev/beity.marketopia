<?php

namespace App\Filament\Resources\Coupons\Schemas;

use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class CouponInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Coupon Info')
                    ->columnSpanFull()
                    ->schema([
                        TextEntry::make('code')->badge()->copyable(),
                        TextEntry::make('discount_type')->badge()->formatStateUsing(fn($state) => strtoupper($state)),
                        TextEntry::make('discount_value')
                            ->label('Discount')
                            ->formatStateUsing(fn ($record) => $record->discount_type === 'fixed' ? $record->discount_value . ' EGP' : $record->discount_value . '%'),
                        TextEntry::make('min_order_amount')->money('EGP'),
                        TextEntry::make('max_discount_amount')->money('EGP')->placeholder('No limit'),
                        TextEntry::make('used_count')->label('Used / Limit')->formatStateUsing(fn($record) => $record->used_count . ' / ' . ($record->usage_limit ?? '∞')),
                        TextEntry::make('expires_at')->dateTime(),
                        IconEntry::make('is_active')->boolean(),
                    ])->columns(3)
            ]);
    }
}