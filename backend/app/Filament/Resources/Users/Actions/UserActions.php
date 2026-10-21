<?php

namespace App\Filament\Resources\Users\Actions;

use App\Models\User;
use App\Services\Users\ManageUsers;
use Filament\Actions\DeleteAction;
use Filament\Actions\ForceDeleteAction;
use Filament\Actions\RestoreAction;
use Filament\Facades\Filament;
use Illuminate\Auth\Access\AuthorizationException;
use Throwable;

class UserActions
{
    public static function make(): array
    {
        return [
            DeleteAction::make()->label(__('Delete user'))->requiresConfirmation()
                ->modalDescription(__('The user will be moved to deleted users. Their orders will be kept.'))
                ->using(fn (User $record): bool => self::perform('delete', $record))
                ->failureNotificationTitle(__('Unable to delete the user.')),
            RestoreAction::make()->label(__('Restore user'))->requiresConfirmation()
                ->using(fn (User $record): bool => self::perform('restore', $record))
                ->failureNotificationTitle(__('Unable to restore the user.')),
            ForceDeleteAction::make()->label(__('Permanently delete user'))->requiresConfirmation()
                ->modalDescription(__('This permanently removes the user and cannot be undone. Users with orders cannot be permanently deleted.'))
                ->using(fn (User $record): bool => self::perform('forceDelete', $record))
                ->failureNotificationTitle(__('Unable to permanently delete the user.')),
        ];
    }

    private static function perform(string $operation, User $record): bool
    {
        try {
            return app(ManageUsers::class)->{$operation}(Filament::auth()->user(), $record);
        } catch (AuthorizationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            report($exception);

            return false;
        }
    }
}
