<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->is_admin && ! $actor->trashed();
    }

    public function create(User $actor): bool
    {
        return $this->viewAny($actor);
    }

    public function view(User $actor, User $record): bool
    {
        return $this->viewAny($actor) && ! $record->is_admin;
    }

    public function update(User $actor, User $record): bool
    {
        return $this->view($actor, $record) && ! $record->trashed();
    }

    public function delete(User $actor, User $record): bool
    {
        return $this->update($actor, $record);
    }

    public function restore(User $actor, User $record): bool
    {
        return $this->view($actor, $record) && $record->trashed();
    }

    public function forceDelete(User $actor, User $record): bool
    {
        return $this->restore($actor, $record)
            && ($record->orders_count ?? $record->orders()->count()) === 0;
    }

    public function deleteAny(User $actor): bool
    {
        return false;
    }

    public function restoreAny(User $actor): bool
    {
        return false;
    }

    public function forceDeleteAny(User $actor): bool
    {
        return false;
    }
}
