<?php

namespace App\Enums;

use Filament\Support\Contracts\HasLabel;

enum PaymentMethod: string implements HasLabel
{
    case Wallet = 'wallet';
    case InstaPay = 'instapay';
    case Cash = 'cash_on_delivery';

    public function getLabel(): string
    {
        return __(match ($this) {
            self::Wallet => 'Wallet',
            self::Cash => 'Cash',
        });
    }
}
