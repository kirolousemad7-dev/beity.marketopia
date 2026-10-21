<?php

namespace App\Filament\Resources\Orders\Schemas;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use Filament\Forms\Components\Select;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class OrderForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make(__('Order workflow'))
                    ->columns(2)
                    ->columnSpanFull()
                    ->schema([
                        // Parent model attribute
                        Select::make('status')
                            ->options(OrderStatus::class)
                            ->required(),
                        
                        // Relationship section wrapper
                        Group::make()
                            ->relationship('transaction') // 1. Pass the name of your Eloquent relationship
                            ->schema([
                                Select::make('status')    // 2. Map directly to the column on the transaction table
                                    ->label('Payment Status')
                                    ->options(PaymentStatus::class)
                                    ->required(),
                            ]),
                    ]),
            ]);
    }
}
