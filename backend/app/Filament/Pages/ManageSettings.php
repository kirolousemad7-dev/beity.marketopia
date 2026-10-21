<?php

namespace App\Filament\Pages;

use App\Models\Setting;
use BackedEnum;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;

class ManageSettings extends Page
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCog6Tooth;
    protected static ?string $navigationLabel = 'Settings';
    protected static ?string $title = 'Settings';
    protected static ?int $navigationSort = 99;

    protected string $view = 'filament.pages.manage-settings';

    public ?array $data = [];

    public function mount(): void
    {
        $this->data = Setting::pluck('value','key')->toArray();
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('General')->schema([
                    TextInput::make('site_name')->required(),
                    TextInput::make('site_tagline'),
                ])->columns(2),

                Section::make('Contact')->schema([
                    TextInput::make('contact_email')->email()->required(),
                    TextInput::make('contact_phone')->required(),
                    TextInput::make('instapay_number')->label('Instapay Number'),
                ])->columns(3),

                Section::make('Shop')->schema([
                    TextInput::make('shipping_cost')->numeric()->prefix('EGP')->required(),
                    // TextInput::make('free_shipping_min')->numeric()->prefix('EGP')->helperText('Free shipping if order >= this'),
                ])->columns(2),
            ])
            ->statePath('data');
    }

    public function save(): void
    {
        foreach($this->data as $key => $value){
            Setting::set($key, $value);
        }
        Notification::make()->title('Settings saved')->success()->send();
    }

    public static function getNavigationGroup(): ?string
    {
        return __('System');
    }
}