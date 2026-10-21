<?php

namespace App\Enums;

use Filament\Support\Contracts\HasLabel;

enum PaymentStatus: string implements HasLabel
{
    case Pending = 'pending';
    case Completed = 'completed';
    case Failed = 'failed';

    public function getLabel(): string
    {
        return __(match ($this) {
            self::Pending => 'Pending',
            self::Completed => 'Completed',
            self::Failed => 'Failed',
        });
    }
}
