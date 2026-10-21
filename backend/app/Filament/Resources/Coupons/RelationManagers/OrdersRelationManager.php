<?php

namespace App\Filament\Resources\Coupons\RelationManagers;

use App\Filament\Resources\Orders\OrderResource;
use Filament\Actions\ViewAction;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class OrdersRelationManager extends RelationManager
{
    protected static string $relationship = 'orders';

    protected static ?string $title = 'Orders Used This Coupon';

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('id')
            ->columns([
                TextColumn::make('id')
                    ->label('#')
                    ->sortable()
                    ->searchable(),

                TextColumn::make('user.name')
                    ->label('Customer')
                    ->searchable()
                    ->placeholder('Guest')
                    ->default('—'),

                TextColumn::make('total_amount')
                    ->label('Order Total')
                    ->money('EGP')
                    ->weight('bold')
                    ->sortable(),

                TextColumn::make('discount_amount')
                    ->label('Discount Given')
                    ->money('EGP')
                    ->badge()
                    ->color('success')
                    ->sortable(),

                TextColumn::make('created_at')
                    ->label('Used At')
                    ->dateTime('d M Y, h:i A')
                    ->sortable(),

                TextColumn::make('status')
                    ->badge()
                    ->placeholder('—')
                    ->toggleable(),
            ])
            ->headerActions([]) // read only, no attach/create
            ->recordActions([
                ViewAction::make()->url(fn ($record) => OrderResource::getUrl('view', ['record' => $record]) ?? '#'),
            ])
            ->toolbarActions([])
            ->emptyStateHeading('No orders used this coupon yet')
            ->emptyStateDescription('When a customer uses this coupon at checkout, it will appear here.')
            ->defaultSort('created_at', 'desc')
            ->paginated([10, 25, 50]);
    }
}