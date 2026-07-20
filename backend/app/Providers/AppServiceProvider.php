<?php

namespace App\Providers;

use App\Bots\Observers\BotProposalObserver;
use App\Bots\Observers\BotQuestionObserver;
use App\Bots\Observers\BotRequestObserver;
use App\Models\AssetPet;
use App\Models\AssetProperty;
use App\Models\AssetVehicle;
use App\Models\Proposal;
use App\Models\RequestQuestion;
use App\Models\ServiceRequest;
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

        // TEMP (test bots) — remove this block together with app/Bots.
        // Gated on the plain config value, NOT BotGate::enabled(): this runs on
        // every boot, and BotGate also reads the cache (the `database` store in
        // production), which would mean a query per request and would blow up
        // during migrate before the cache table exists. The runtime kill switch
        // is checked inside each observer instead, where it costs nothing until
        // a bot-relevant model event actually fires.
        //
        // The observers run inline on real users' requests and production serves
        // the API single-threaded, so each one only reads config, does one
        // lookup, and dispatches.
        if (config('bots.enabled')) {
            ServiceRequest::observe(BotRequestObserver::class);
            Proposal::observe(BotProposalObserver::class);
            RequestQuestion::observe(BotQuestionObserver::class);
        }
    }
}
