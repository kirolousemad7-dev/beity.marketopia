<?php

namespace App\Services\Users;

use App\Http\Requests\Admin\Users\SaveUserRequest;
use App\Models\User;
use App\Models\Users\UserAuditLog;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ManageUsers
{
    public function create(User $actor, array $data): User
    {
        Gate::forUser($actor)->authorize('create', User::class);
        $validated = Validator::make($data, SaveUserRequest::rulesFor())->validate();

        return DB::transaction(function () use ($actor, $validated): User {
            $record = User::create(Arr::only($validated, ['name', 'email', 'password']) + ['is_admin' => false]);
            $this->audit($actor, $record, 'user.created', ['name', 'email', 'password']);

            return $record;
        });
    }

    public function update(User $actor, User $record, array $data): User
    {
        return DB::transaction(function () use ($actor, $record, $data): User {
            $record = User::withTrashed()->lockForUpdate()->findOrFail($record->id);
            Gate::forUser($actor)->authorize('update', $record);
            $validated = Validator::make($data, SaveUserRequest::rulesFor($record))->validate();
            $attributes = Arr::only($validated, ['name', 'email']);
            if (filled($validated['password'] ?? null)) {
                $attributes['password'] = $validated['password'];
                $attributes['remember_token'] = Str::random(60);
                $record->tokens()->delete();
            }
            if ($attributes['email'] !== $record->email) {
                $attributes['email_verified_at'] = null;
            }
            $record->fill(Arr::only($attributes, ['name', 'email', 'password']));
            $record->forceFill(Arr::only($attributes, ['remember_token', 'email_verified_at']));
            $changed = array_keys($record->getDirty());
            $record->save();
            $this->audit($actor, $record, 'user.updated', $changed);

            return $record;
        });
    }

    public function delete(User $actor, User $record): bool
    {
        return $this->changeLifecycle($actor, $record, 'delete');
    }

    public function restore(User $actor, User $record): bool
    {
        return $this->changeLifecycle($actor, $record, 'restore');
    }

    public function forceDelete(User $actor, User $record): bool
    {
        return $this->changeLifecycle($actor, $record, 'forceDelete');
    }

    private function changeLifecycle(User $actor, User $record, string $operation): bool
    {
        return DB::transaction(function () use ($actor, $record, $operation): bool {
            $record = User::withTrashed()->lockForUpdate()->findOrFail($record->id);
            Gate::forUser($actor)->authorize($operation, $record);
            if ($operation !== 'restore') {
                $record->tokens()->delete();
                $record->forceFill(['remember_token' => Str::random(60)])->save();
            }
            $result = (bool) $record->{$operation}();
            if ($result) {
                $this->audit($actor, $record, 'user.'.$operation, []);
            }

            return $result;
        });
    }

    private function audit(User $actor, User $record, string $action, array $changed): void
    {
        UserAuditLog::create([
            'action' => $action,
            'user_id' => (string) $actor->id,
            'ip_address' => request()->ip() ?? 'unknown',
            'details' => ['target_user_id' => $record->id, 'changed_fields' => $changed],
        ]);
    }
}
