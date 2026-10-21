<?php

namespace App\Filament\Resources\Users\Pages;

use App\Filament\Resources\Users\Actions\UserActions;
use App\Filament\Resources\Users\UserResource;
use App\Services\Users\ManageUsers;
use Filament\Facades\Filament;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Database\Eloquent\Model;

class EditUser extends EditRecord
{
    protected static string $resource = UserResource::class;

    protected function handleRecordUpdate(Model $record, array $data): Model
    {
        return app(ManageUsers::class)->update(Filament::auth()->user(), $record, $data);
    }

    protected function getHeaderActions(): array
    {
        return UserActions::make();
    }
}
