<?php

namespace Database\Seeders;

use App\Enums\ProposalStatus;
use App\Enums\ReceptionType;
use App\Enums\RequestStatus;
use App\Enums\RequestUrgency;
use App\Models\Asset;
use App\Models\Proposal;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Database\Seeders\Concerns\SeedsNearbyLocations;
use Illuminate\Database\Seeder;

/**
 * Gives the dev client's property ("Apê 502") a real service history (the asset
 * "Carfax" — R6): a few completed jobs tied to the asset, so the asset detail
 * shows its consolidated history out of the box. Runs LAST so it never collides
 * with the per-category open requests from ServiceRequestSeeder/DevJobSeeder
 * (those carry no asset_id). Idempotent on (client, asset, category). Dev only.
 */
class AssetHistorySeeder extends Seeder
{
    use SeedsNearbyLocations;

    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $client = User::where('email', 'cliente@chamafacil.test')->first();
        $provider = User::where('email', 'prestador@chamafacil.test')->first();
        if (! $client || ! $provider) {
            return;
        }

        $property = $client->assets()->where('nickname', 'Apê 502')->first();
        if (! $property instanceof Asset) {
            return;
        }

        // Past services on the property, newest first when listed.
        $history = [
            ['slug' => 'pintor', 'price' => 950.0, 'days' => 8, 'desc' => 'Pintura da sala e dois quartos.'],
            ['slug' => 'pedreiro', 'price' => 420.0, 'days' => 45, 'desc' => 'Reparo de infiltração no banheiro.'],
            ['slug' => 'limpeza', 'price' => 180.0, 'days' => 120, 'desc' => 'Limpeza pós-obra completa.'],
        ];

        foreach ($history as $h) {
            $category = ServiceCategory::where('slug', $h['slug'])->first();
            if (! $category) {
                continue;
            }

            $request = ServiceRequest::firstOrNew([
                'client_id' => $client->id,
                'asset_id' => $property->id,
                'service_category_id' => $category->id,
            ]);
            $request->fill([
                'description' => $h['desc'],
                ...$this->randomNearbyLocation(),
                'address' => 'Rua das Flores, 100 - São José do Rio Preto, SP',
                'reception_type' => ReceptionType::AdultKey->value,
                'urgency' => RequestUrgency::Scheduled->value,
                'budget_max' => $h['price'],
                'status' => RequestStatus::Completed->value,
                'accepted_provider_id' => $provider->id,
                'accepted_at' => now()->subDays($h['days']),
                'started_at' => now()->subDays($h['days']),
                'completed_at' => now()->subDays($h['days'])->addHours(3),
            ])->save();

            $proposal = Proposal::updateOrCreate(
                ['service_request_id' => $request->id, 'provider_id' => $provider->id],
                ['price' => $h['price'], 'eta_minutes' => 60, 'status' => ProposalStatus::Accepted->value],
            );
            $request->update(['accepted_proposal_id' => $proposal->id]);
        }
    }
}
