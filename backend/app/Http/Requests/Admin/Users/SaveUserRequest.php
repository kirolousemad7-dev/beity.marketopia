<?php

namespace App\Http\Requests\Admin\Users;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class SaveUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $record = $this->route('user');

        return $record instanceof User
            ? ($this->user()?->can('update', $record) ?? false)
            : ($this->user()?->can('create', User::class) ?? false);
    }

    public function rules(): array
    {
        $record = $this->route('user');

        return self::rulesFor($record instanceof User ? $record : null);
    }

    public static function rulesFor(?User $record = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($record)],
            'password' => [$record ? 'nullable' : 'required', 'string', Password::min(8), 'confirmed'],
            'password_confirmation' => ['nullable', 'string'],
        ];
    }
}
