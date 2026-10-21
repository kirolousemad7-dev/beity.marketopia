<?php

namespace App\Filament\Resources\Users\Schemas;

use App\Http\Requests\Admin\Users\SaveUserRequest;
use App\Models\User;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('name')->label(__('Name'))->required()->maxLength(255)
                ->rules(fn (?User $record): array => SaveUserRequest::rulesFor($record)['name']),
            TextInput::make('email')->label(__('Email'))->email()->required()->maxLength(255)
                ->extraInputAttributes(['dir' => 'ltr'])
                ->rules(fn (?User $record): array => SaveUserRequest::rulesFor($record)['email']),
            TextInput::make('password')->label(__('Password'))->password()->revealable()
                ->required(fn (string $operation): bool => $operation === 'create')
                ->afterStateHydrated(fn (TextInput $component) => $component->state(null))
                ->dehydrated(fn (?string $state): bool => filled($state))
                ->rules(fn (?User $record): array => SaveUserRequest::rulesFor($record)['password'])
                ->helperText(__('Leave the password blank to keep it unchanged.')),
            TextInput::make('password_confirmation')->label(__('Confirm password'))->password()->revealable()
                ->same('password')->dehydrated(fn (?string $state): bool => filled($state)),
        ])->columns(2);
    }
}
