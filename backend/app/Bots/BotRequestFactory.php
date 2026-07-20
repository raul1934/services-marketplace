<?php

namespace App\Bots;

use App\Enums\PaymentMethod;
use App\Enums\RequestUrgency;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Services\RequestService;

/**
 * TEMPORARY — test bots. Builds and creates one plausible request as a bot client.
 *
 * Goes through RequestService::create() rather than writing the row directly,
 * so the request inherits market resolution, territory isolation and the
 * provider fan-out exactly as a real one would — the provider app must not be
 * able to tell the difference apart from the [TESTE] marking.
 */
class BotRequestFactory
{
    public function __construct(private RequestService $requests) {}

    /**
     * @throws \App\Exceptions\OutOfCoverageException when the sampled point falls
     *         outside every active market (should not happen — the point is
     *         sampled from a market's own geofence — but is not swallowed here
     *         because it means the bot market is misconfigured).
     */
    public function create(User $client): ?ServiceRequest
    {
        $category = ServiceCategory::where('is_active', true)->inRandomOrder()->first();

        // A different territory each run, so coverage spreads over every active
        // market instead of piling into one. Sampling the point from the market
        // we just picked keeps the two consistent — RequestService resolves the
        // market from the coordinates, so a mismatch would silently relocate the
        // request (or throw out-of-coverage).
        $market = BotPersona::randomMarket();
        $point = $market ? BotPersona::randomPoint($market) : null;

        if (! $category || ! $point) {
            return null;
        }

        $urgency = random_int(0, 1) === 0 ? RequestUrgency::Urgent : RequestUrgency::Scheduled;

        // The "bem" the job is about — a vehicle for roadside, a property for
        // residential/condo, a pet for pet. Null for beauty, which operates on a
        // person, exactly as a real request would leave it.
        $asset = BotAssets::pickFor($client, $category->type->value);

        $request = $this->requests->create($client, [
            'service_category_id' => $category->id,
            'asset_id' => $asset?->id,
            // Let the provider see the asset's note, so the card is fully populated.
            'share_asset_note' => $asset !== null,
            'description' => BotGate::label($this->description()),
            'latitude' => $point['latitude'],
            'longitude' => $point['longitude'],
            'address' => BotGate::label('Endereço de teste'),
            'budget_max' => (float) random_int(50, 500),
            'payment_method' => collect(PaymentMethod::cases())->random()->value,
            'urgency' => $urgency->value,
            // Only urgent requests carry a max wait; the column is the client's
            // stated patience and ExpireStaleRequests only looks at urgent ones.
            'max_wait_minutes' => $urgency === RequestUrgency::Urgent
                ? collect([10, 20, 30])->random()
                : null,
        ]);

        // Stamped after create() because RequestService doesn't accept the flag.
        // Note this is also AFTER BotRequestObserver has fired — which is why
        // that observer guards on client->is_bot rather than on is_test.
        $request->forceFill(['is_test' => true])->save();

        return $request;
    }

    private function description(): string
    {
        return collect([
            'Preciso de ajuda, o serviço parou de funcionar hoje de manhã.',
            'Problema apareceu ontem e piorou durante a noite.',
            'Gostaria de um orçamento antes de decidir.',
            'Já tentei resolver sozinho e não consegui.',
            'Preciso resolver ainda hoje, se possível.',
            'É a segunda vez que isso acontece este mês.',
            'Situação simples, mas não tenho as ferramentas.',
            'Prefiro alguém que possa vir no período da tarde.',
        ])->random();
    }
}
