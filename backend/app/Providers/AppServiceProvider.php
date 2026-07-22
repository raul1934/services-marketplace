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
use App\Support\Ops\MailOpsAlerter;
use App\Support\Ops\OpsAlerter;
use App\Support\Ops\StackOpsAlerter;
use App\Support\Ops\WhatsAppOpsAlerter;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Canal do alerta da operação, escolhido por config. Quem dispara o
        // alerta pede a interface e não sabe se aquilo virou e-mail, WhatsApp
        // ou os dois — trocar de canal é editar CONCIERGE_CHANNELS.
        $this->app->bind(OpsAlerter::class, function () {
            $canais = array_map(fn (string $nome) => match ($nome) {
                'whatsapp' => new WhatsAppOpsAlerter,
                default => new MailOpsAlerter,
            }, (array) config('concierge.channels', ['mail']));

            // Um canal só não precisa do overhead do stack.
            return count($canais) === 1 ? $canais[0] : new StackOpsAlerter($canais);
        });
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
