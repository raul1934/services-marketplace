<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\Asset;
use App\Models\AssetVehicle;
use App\Models\QuestionSuggestion;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Models\VehicleMake;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The provider's question picker should not offer a question the customer has
 * already answered by registering the asset.
 *
 * "Qual a marca e o modelo do veículo?" shipped in the picker for every
 * roadside request, including ones where the customer picked a saved car — so
 * the provider asked, the customer retyped what the app already knew, and both
 * waited on a round trip that bought nothing.
 */
class SuggestionsSkipAssetTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: ServiceRequest, 1: User, 2: ServiceCategory} */
    private function openRoadsideRequest(?Asset $asset = null): array
    {
        $client = User::factory()->create();
        $provider = User::factory()->create();
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.$client->id, 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);
        $provider->categories()->attach($category->id);

        QuestionSuggestion::create([
            'category_type' => 'roadside', 'key' => 'vehicle', 'lang' => 'pt',
            'text' => 'Qual a marca e o modelo do veículo?', 'sort_order' => 1, 'is_active' => true,
        ]);
        QuestionSuggestion::create([
            'category_type' => 'roadside', 'key' => 'safe_spot', 'lang' => 'pt',
            'text' => 'O veículo está em local seguro?', 'sort_order' => 2, 'is_active' => true,
        ]);

        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
            'asset_id' => $asset?->id,
            'description' => 'carro nao liga',
            'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Open->value,
        ]);

        return [$request->fresh(), $provider, $category];
    }

    private function vehicleAsset(User $owner, bool $withMake): Asset
    {
        $detail = AssetVehicle::create(
            $withMake ? ['vehicle_make_id' => VehicleMake::create(['name' => 'Alfa Romeo'])->id] : []
        );

        return Asset::create([
            'user_id' => $owner->id,
            'type' => 'vehicle',
            'nickname' => 'Carro Principal',
            'detailable_type' => AssetVehicle::class,
            'detailable_id' => $detail->id,
        ]);
    }

    private function keys(int $requestId): array
    {
        $res = $this->getJson("/api/provider/v1/requests/{$requestId}/question-suggestions", ['X-Locale' => 'pt'])->assertOk();

        return array_column($res->json('data'), 'key');
    }

    public function test_the_make_and_model_question_is_dropped_when_the_asset_answers_it(): void
    {
        $owner = User::factory()->create();
        $asset = $this->vehicleAsset($owner, withMake: true);
        [$request, $provider] = $this->openRoadsideRequest($asset);

        Sanctum::actingAs($provider, ['provider']);

        $keys = $this->keys($request->id);
        $this->assertNotContains('vehicle', $keys);
        // Everything else the provider might want to ask stays.
        $this->assertContains('safe_spot', $keys);
    }

    public function test_a_vehicle_saved_without_a_make_still_gets_asked(): void
    {
        $owner = User::factory()->create();
        $asset = $this->vehicleAsset($owner, withMake: false);
        [$request, $provider] = $this->openRoadsideRequest($asset);

        Sanctum::actingAs($provider, ['provider']);

        // The asset exists but does not answer the question, and pretending
        // otherwise would leave the provider unable to ask at all.
        $this->assertContains('vehicle', $this->keys($request->id));
    }

    public function test_a_request_with_no_asset_is_untouched(): void
    {
        [$request, $provider] = $this->openRoadsideRequest(null);

        Sanctum::actingAs($provider, ['provider']);

        $this->assertContains('vehicle', $this->keys($request->id));
    }
}
