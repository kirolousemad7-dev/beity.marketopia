<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasLabel;

enum BostaSubmissionStatus: string implements HasColor, HasLabel
{
    case Queued = 'queued';
    case Submitting = 'submitting';
    case Submitted = 'submitted';
    case Failed = 'failed';
    case NeedsReview = 'needs_review';

    public function getLabel(): string
    {
        return __(match ($this) {
            self::Queued => 'Queued for Bosta',
            self::Submitting => 'Sending to Bosta',
            self::Submitted => 'Submitted to Bosta',
            self::Failed => 'Bosta submission failed',
            self::NeedsReview => 'Check shipment in Bosta',
        });
    }

    public function getColor(): string
    {
        return match ($this) {
            self::Queued, self::Submitting => 'info',
            self::Submitted => 'success',
            self::Failed => 'danger',
            self::NeedsReview => 'warning',
        };
    }
}
