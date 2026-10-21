<?php

namespace App\Filament\Resources\Coupons\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Schema;
use Illuminate\Support\Str;

class CouponForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Coupon Details')
                    ->columnSpanFull()
                    ->schema([
                        TextInput::make('code')
                            ->label('Coupon Code')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->placeholder('WELCOME50')
                            ->helperText('User will enter this code at checkout')
                            ->dehydrateStateUsing(fn ($state) => Str::upper($state))
                            ->maxLength(20),

                        Select::make('discount_type')
                            ->label('Discount Type')
                            ->options([
                                'fixed' => 'Fixed Amount',
                                'percent' => 'Percent',
                            ])
                            ->required()
                            ->live()
                            ->native(false),

                        TextInput::make('discount_value')
                            ->label('Discount Value')
                            ->required()
                            ->numeric()
                            ->minValue(1)
                            ->maxValue(fn (Get $get) => $get('discount_type') === 'percent' ? 100 : 999999)
                            ->suffix(fn (Get $get) => $get('discount_type') === 'percent' ? '%' : 'EGP')
                            ->helperText(fn (Get $get) => $get('discount_type') === 'percent' ? 'Ex: 20 for 20%' : 'Ex: 50 for 50 EGP'),
                    ])->columns(3),

                Section::make('Conditions & Limits')
                    ->columnSpanFull()
                    ->schema([
                        TextInput::make('min_order_amount')
                            ->label('Min. Order Amount')
                            ->numeric()
                            ->default(0)
                            ->prefix('EGP')
                            ->helperText('Coupon not applied if order < this amount'),

                        TextInput::make('max_discount_amount')
                            ->label('Max Discount Amount')
                            ->numeric()
                            ->prefix('EGP')
                            ->helperText('Only for Percent - Ex: 20% max 100 EGP')
                            ->visible(fn (Get $get) => $get('discount_type') === 'percent'),

                        TextInput::make('usage_limit')
                            ->label('Total Usage Limit')
                            ->numeric()
                            ->placeholder('Empty for unlimited'),

                        TextInput::make('usage_limit_per_user')
                            ->label('Limit Per User')
                            ->numeric()
                            ->default(1),

                        DateTimePicker::make('expires_at')
                            ->label('Expiry Date')
                            ->native(false),

                        Toggle::make('is_active')
                            ->label('Active')
                            ->default(true)
                            ->helperText('Inactive coupons cannot be used'),
                    ])->columns(2),
            ]);
    }
}