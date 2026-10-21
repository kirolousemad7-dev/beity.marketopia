<?php

namespace App\Filament\Resources\Orders\Actions;

use App\Exceptions\Shipping\BostaException;
use App\Http\Requests\Admin\Orders\AcceptOrderRequest;
use App\Models\Orders\Order;
use App\Services\Orders\AcceptOrder;
use App\Services\Shipping\BostaService;
use Filament\Actions\Action;
use Filament\Facades\Filament;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Throwable;

class AcceptOrderAction
{
    public static function make(bool $retry = false): Action
    {
        $ability = $retry ? 'retryBosta' : 'accept';

        return Action::make($retry ? 'retry_bosta' : 'accept_order')
            ->label(__($retry ? 'Retry Bosta submission' : 'Accept Order'))
            ->icon('heroicon-m-truck')->color($retry ? 'warning' : 'success')
            ->authorize($ability)
            ->visible(fn (Order $record): bool => Filament::auth()->user()?->can($ability, $record) ?? false)
            ->requiresConfirmation()
            ->modalDescription(__('Confirm customer details and delivery location. The shipment will be submitted to Bosta in the background.'))
            ->fillForm(fn (Order $record): array => [
                'pickup_location_id' => $record->bosta_pickup_location_id,
                'city_id' => $record->bosta_address['cityId'] ?? null,
                'district_id' => $record->bosta_address['districtId'] ?? null,
                'customer_name' => $record->customer_name, 'customer_phone' => $record->customer_phone,
                'additional_phone' => $record->additional_phone, 'shipping_address' => $record->shipping_address,
            ])
            ->schema(self::schema())
            ->action(function (Order $record, array $data, Action $action, AcceptOrder $service) use ($retry): void {
                try {
                    $service->handle(Filament::auth()->user(), $record, $data, $retry);
                } catch (ValidationException|AuthorizationException $exception) {
                    throw $exception;
                } catch (Throwable $exception) {
                    if (! $exception instanceof BostaException) {
                        report($exception);
                    }
                    Notification::make()->title(__('Unable to queue the shipment'))
                        ->body($exception instanceof BostaException ? __($exception->getMessage()) : __('Please try again or contact the administrator.'))
                        ->danger()->send();
                    $action->halt();
                }
                Notification::make()->title(__('Order accepted and queued for Bosta'))->success()->send();
            });
    }

    private static function schema(): array
    {
        $rules = AcceptOrderRequest::acceptanceRules();

        return [
            Select::make('pickup_location_id')->label(__('Bosta pickup location'))
                ->required()->searchable()
                ->helperText(__('Select where Bosta will collect this order.'))
                ->options(fn (BostaService $service): array => self::locationOptions(fn (): array => $service->pickupLocations(), 'locationName', 'locationName')),
            Select::make('city_id')->label(__('Bosta city'))->required()->searchable()->live()
                ->options(fn (BostaService $service): array => self::locationOptions(fn (): array => $service->cities(), 'name', 'nameAr'))
                ->afterStateUpdated(fn (Set $set) => $set('district_id', null)),
            Select::make('district_id')->label(__('Bosta district'))
                ->required()->searchable()
                ->disabled(fn (Get $get): bool => blank($get('city_id')))
                ->options(fn (Get $get, BostaService $service): array => filled($get('city_id'))
                    ? self::locationOptions(fn (): array => $service->districts($get('city_id')), 'districtName', 'districtOtherName') : []),
            TextInput::make('customer_name')->label(__('Customer name'))->required()->maxLength(100)->rules($rules['customer_name']),
            TextInput::make('customer_phone')->label(__('Phone number'))->required()->tel()->maxLength(30)->rules($rules['customer_phone'])->extraInputAttributes(['dir' => 'ltr']),
            TextInput::make('additional_phone')->label(__('Additional phone number'))->tel()->maxLength(30)->rules($rules['additional_phone'])->extraInputAttributes(['dir' => 'ltr']),
            Textarea::make('shipping_address')->label(__('Shipping address'))->required()->minLength(6)->maxLength(255),
        ];
    }

    private static function locationOptions(callable $load, string $name, string $arabicName): array
    {
        try {
            $records = $load();
        } catch (BostaException $exception) {
            Notification::make()->title(__($exception->getMessage()))->danger()->send();

            return [];
        }

        return collect($records)->mapWithKeys(fn (array $record, string $id): array => [
            $id => app()->getLocale() === 'ar' ? ($record[$arabicName] ?? $record[$name]) : $record[$name],
        ])->all();
    }
}
