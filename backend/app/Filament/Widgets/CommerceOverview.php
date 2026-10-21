<?php

namespace App\Filament\Widgets;

use App\Models\Orders\Order;
use App\Models\Orders\PaymentTransaction;
use App\Models\Products\Product;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Number;

class CommerceOverview extends StatsOverviewWidget
{
    protected ?string $pollingInterval = '60s';

    public static function canView(): bool
    {
        return true;
    }

    protected function getStats(): array
    {
        $paidTotal = PaymentTransaction::query()->where('status', 'completed')->sum('amount');

        return [
            Stat::make('Paid revenue', Number::currency($paidTotal, 'EGP'))
                ->description('Captured checkout revenue')
                ->color('success'),
            Stat::make('Active products', Product::query()->where('is_active', true)->count())
                ->description('Products visible in the catalog')
                ->color('info'),
            Stat::make('Failed payments', PaymentTransaction::query()->where('status', 'failed')->count())
                ->description('Transactions requiring review')
                ->color('danger'),
        ];
    }
}
