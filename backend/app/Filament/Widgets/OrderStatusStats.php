<?php

namespace App\Filament\Widgets;

use App\Models\Orders\Order;
use App\Enums\OrderStatus;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class OrderStatusStats extends BaseWidget
{
    protected ?string $pollingInterval = '15s';

    protected function getStats(): array
    {
        return collect(OrderStatus::cases())
            ->map(function (OrderStatus $status) {
                // Fetch the count from your database for each specific case
                $count = Order::where('status', $status->value)->count();

                return Stat::make("{$status->getLabel()} orders", $count)
                    ->description("Total orders marked as {$status->getLabel()}")
                    ->descriptionIcon($status->getIcon())
                    ->color($status->getColor());
            })
            ->toArray();
    }
}
