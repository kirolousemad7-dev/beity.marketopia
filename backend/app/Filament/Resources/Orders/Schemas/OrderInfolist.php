<?php

namespace App\Filament\Resources\Orders\Schemas;

use Filament\Actions\Action;
use Filament\Infolists\Components\RepeatableEntry;
use Filament\Infolists\Components\SpatieMediaLibraryImageEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\HtmlString;

class OrderInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make(__('Customer'))
                    ->columns(3)
                    ->schema([
                        TextEntry::make('user.name')->label(__('Account name'))->badge()->color('info'),
                        TextEntry::make('user.email')->badge()->color('info')->copyable(),
                        TextEntry::make('customer_name')->label(__('Customer name'))->placeholder('—'),
                        TextEntry::make('customer_phone')->label(__('Phone number'))->placeholder('—')->copyable()->extraAttributes(['dir' => 'ltr']),
                        TextEntry::make('additional_phone')->label(__('Additional phone number'))->placeholder('—')->copyable()->extraAttributes(['dir' => 'ltr']),
                        TextEntry::make('shipping_address')->badge()->color('info'),
                        TextEntry::make('status')->badge()->color('info'),
                    ])->columnSpanFull(),
                Section::make(__('Bosta shipment'))
                    ->columns(2)->schema([
                        TextEntry::make('bosta_submission_status')->label(__('Bosta submission'))->badge()->placeholder('—'),
                        TextEntry::make('bosta_tracking_number')->label(__('Bosta tracking number'))->copyable()->placeholder('—'),
                        TextEntry::make('bosta_delivery_id')->label(__('Bosta delivery ID'))->copyable()->placeholder('—'),
                        TextEntry::make('bosta_pickup_location_name')->label(__('Bosta pickup location'))->placeholder('—'),
                        TextEntry::make('bosta_address.city')->label(__('Bosta city'))->placeholder('—'),
                        TextEntry::make('bosta_submitted_at')->label(__('Submitted at'))->dateTime()->placeholder('—'),
                        TextEntry::make('bosta_error')->label(__('Bosta error'))->placeholder('—')->columnSpanFull(),
                    ])->columnSpanFull(),
                Section::make(__('Payment Method'))
                    ->columns(2)
                    ->schema([
                        TextEntry::make('transaction.payment_method')->badge()->color('info'),
                        SpatieMediaLibraryImageEntry::make('transaction.payment_screenshot')
                            ->collection('payment_screenshot')
                            ->hidden(fn ($record) => ! $record->transaction->hasMedia('payment_screenshot'))
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
                    ])->columnSpanFull(),
                RepeatableEntry::make('items')
                    ->schema([
                        TextEntry::make('product.name'),
                        TextEntry::make('product.sku'),
                        TextEntry::make('quantity')->numeric(),
                        TextEntry::make('line_total')->label(__('Price'))->state(function ($record): string {
                            return $record->line_total ?? number_format($record->quantity * $record->price, 2, '.', '');
                        })->money('EGP'),
                    ])
                    ->columns(4)
                    ->columnSpanFull(),
            ]);
    }
}
