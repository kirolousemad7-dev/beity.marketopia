<?php

namespace App\Filament\Resources\Bundles\Pages;

use App\Filament\Resources\Bundles\BundleResource;
use Filament\Resources\Pages\EditRecord;

class EditBundle extends EditRecord
{
    protected static string $resource = BundleResource::class;

    protected function mutateFormDataBeforeFill(array $data): array
    {
        $record = $this->record->load('translations');

        $en = $record->translations
            ->firstWhere('locale', 'en');

        $ar = $record->translations
            ->firstWhere('locale', 'ar');

        $data['en'] = [
            'title' => $en?->title,
            'description' => $en?->description,
        ];

        $data['ar'] = [
            'title' => $ar?->title,
            'description' => $ar?->description,
        ];

        return $data;
    }

}