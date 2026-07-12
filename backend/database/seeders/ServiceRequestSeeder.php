<?php

namespace Database\Seeders;

use App\Enums\PaymentMethod;
use App\Enums\ReceptionType;
use App\Enums\RequestStatus;
use App\Enums\RequestUrgency;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Database\Seeders\Concerns\SeedsNearbyLocations;
use Illuminate\Database\Seeder;

/**
 * One open service request per active category for the dev customer, so the
 * provider feed has an example of every service out of the box. Idempotent:
 * keyed on (client, category), so re-seeding updates instead of duplicating.
 */
class ServiceRequestSeeder extends Seeder
{
    use SeedsNearbyLocations;

    public function run(): void
    {
        $client = User::where('email', 'cliente@chamafacil.test')->first();

        if (! $client) {
            return; // dev customer not present (e.g. production) — nothing to do
        }

        $payments = [PaymentMethod::Cash, PaymentMethod::Pix, PaymentMethod::Card];

        $categories = ServiceCategory::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $offset = 0;

        foreach ($categories as $category) {
            $offset++;

            // Roadside is help-now; everything else is schedulable. On-site
            // residential/condo jobs need a way in, so they get a reception type.
            // `type` is cast to the CategoryType enum, so compare on its value.
            $isRoadside = $category->type->value === 'roadside';
            $needsReception = in_array($category->type->value, ['residential', 'condo'], true);

            ServiceRequest::updateOrCreate(
                [
                    'client_id' => $client->id,
                    'service_category_id' => $category->id,
                ],
                [
                    'description' => 'Preciso de '.$category->name.' o quanto antes. Solicitação de teste.',
                    ...$this->randomNearbyLocation(),
                    'address' => 'Av. Bady Bassitt, '.(1000 + $offset * 20).' - São José do Rio Preto, SP',
                    'budget_max' => 100 + ($offset % 5) * 50,
                    'payment_method' => $payments[$offset % count($payments)],
                    'reception_type' => $needsReception ? ReceptionType::AdultKey : null,
                    'urgency' => $isRoadside ? RequestUrgency::Urgent : RequestUrgency::Scheduled,
                    'status' => RequestStatus::Open,
                ],
            );
        }
    }
}
