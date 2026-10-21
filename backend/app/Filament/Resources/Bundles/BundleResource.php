<?php

namespace App\Filament\Resources\Bundles;

use App\Filament\Resources\Bundles\Pages\EditBundle;
use App\Filament\Resources\Bundles\Pages\ListBundles;
use App\Filament\Resources\Bundles\RelationManagers\ProductsRelationManager;
use App\Filament\Resources\Bundles\Schemas\BundleForm;
use App\Filament\Resources\Bundles\Schemas\BundleInfolist;
use App\Filament\Resources\Bundles\Tables\BundlesTable;
use App\Models\Bundles\Bundle;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use UnitEnum;

class BundleResource extends Resource
{
    protected static ?string $model = Bundle::class;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-square-3-stack-3d';

    protected static ?string $recordTitleAttribute = 'title';

    public static function getNavigationGroup(): ?string
    {
        return __('Catalog');
    }

    public static function getModelLabel(): string
    {
        return __('Bundle');
    }

    public static function getPluralModelLabel(): string
    {
        return __('Bundles');
    }

    public static function form(Schema $schema): Schema
    {
        return BundleForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return BundleInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return BundlesTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            // 
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListBundles::route('/'),
            'edit' => EditBundle::route('/{record}/edit'),
        ];
    }
}
