<?php

namespace App\Providers;

use App\Models\AssetPet;
use App\Models\AssetProperty;
use App\Models\AssetVehicle;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Clean aliases for the asset detail morph so `detailable_type` stores
        // 'vehicle'/'property'/'pet' (matching AssetType). Additive map — it does
        // NOT enforce, so existing full-class-name morphs (Media) keep working.
        Relation::morphMap([
            'vehicle' => AssetVehicle::class,
            'property' => AssetProperty::class,
            'pet' => AssetPet::class,
        ]);
    }
}
