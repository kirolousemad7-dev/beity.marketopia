<?php

namespace App\Filament\Resources\Users\Tables;

use App\Filament\Resources\Users\Actions\UserActions;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TrashedFilter;
use Filament\Tables\Table;

class UsersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')->label(__('Name'))->searchable()->sortable()->wrap(),
                TextColumn::make('email')->label(__('Email'))->searchable()->sortable()->copyable()->extraAttributes(['dir' => 'ltr']),
                TextColumn::make('orders_count')->label(__('Orders'))->numeric()->sortable(),
                TextColumn::make('created_at')->label(__('Created at'))->dateTime()->sortable()->toggleable(),
                TextColumn::make('deleted_at')->label(__('Deleted at'))->dateTime()->placeholder('—')->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([TrashedFilter::make()->label(__('Deleted users'))])
            ->recordActions([EditAction::make(), ...UserActions::make()])
            ->defaultSort('created_at', 'desc');
    }
}
