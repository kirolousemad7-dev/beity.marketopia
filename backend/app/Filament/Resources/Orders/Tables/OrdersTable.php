<?php

namespace App\Filament\Resources\Orders\Tables;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Filament\Resources\Orders\Actions\AcceptOrderAction;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\SpatieMediaLibraryImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Support\HtmlString;

class OrdersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('order_number')->searchable()->copyable()->sortable(),
                TextColumn::make('user.name')->label(__('Account name')),
                TextColumn::make('customer_name')->label(__('Customer name'))->searchable()->placeholder('—'),
                TextColumn::make('customer_phone')->label(__('Phone number'))->searchable()->copyable()->placeholder('—')->extraAttributes(['dir' => 'ltr']),
                TextColumn::make('total_amount')->money('EGP')->sortable(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'processing' => 'gray',
                        'delivered' => 'success',
                        'failed' => 'danger',
                        default => 'warning',
                    }),
                TextColumn::make('transaction.status')->label('Payment Status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'completed' => 'success',
                        'failed' => 'danger',
                        default => 'warning',
                    }),
                TextColumn::make('transaction.payment_method')->badge()->color('info'),
                SpatieMediaLibraryImageColumn::make('transaction.payment_screenshot')
                    ->collection('payment_screenshot')
                    ->label('Screenshot')
                    ->square()
                    ->defaultImageUrl(null)
                    ->placeholder('—')
                    ->action(
                        Action::make('view_large_image')
                            ->modalHeading('Image Preview')
                            ->modalWidth('2xl')
                            ->modalContent(fn ($record) => new HtmlString("
                                    <div class='flex justify-center p-2'>
                                        <img src='{$record->transaction->getFirstMediaUrl('payment_screenshot')}' class='w-full h-auto max-h-[75vh] object-contain rounded-lg shadow-md' alt='Preview' />
                                    </div>
                                "))
                            ->modalSubmitAction(false)
                            ->modalCancelActionLabel('Close')
                    ),
                TextColumn::make('bosta_submission_status')->label(__('Bosta submission'))->badge()->placeholder('—'),
                TextColumn::make('bosta_tracking_number')->label(__('Bosta tracking number'))->copyable()->searchable()->placeholder('—'),
                TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')->options(OrderStatus::class),
                SelectFilter::make('transaction_status')
                    ->relationship('transaction', 'status')
                    ->options(PaymentStatus::class)
                    ->label('Payment Status'),
                SelectFilter::make('transaction_payment_method')
                    ->relationship('transaction', 'payment_method')
                    ->options(PaymentMethod::class)
                    ->label('Payment Method'),
            ])
            ->recordActions([
                AcceptOrderAction::make(),
                AcceptOrderAction::make(retry: true),

                ViewAction::make(),
                // EditAction::make(),
                DeleteAction::make(),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
