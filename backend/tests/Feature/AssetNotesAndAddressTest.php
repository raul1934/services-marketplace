<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\Asset;
use App\Models\AssetProperty;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AssetNotesAndAddressTest extends TestCase
{
    use RefreshDatabase;

    private function propertyAsset(User $user, array $attributes = []): Asset
    {
        $detail = AssetProperty::create([]);

        return $user->assets()->create(array_merge([
            'type' => 'property',
            'nickname' => 'Minha casa',
            'detailable_type' => 'property',
            'detailable_id' => $detail->id,
        ], $attributes));
    }

    private function category(string $slug = 'cat'): ServiceCategory
    {
        return ServiceCategory::create([
            'type' => 'roadside', 'slug' => $slug, 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);
    }

    // === FEATURE 1: structured address ===

    public function test_creating_a_property_asset_persists_structured_address(): void
    {
        $client = User::factory()->create();
        Sanctum::actingAs($client, ['client']);

        $res = $this->postJson('/api/customer/v1/assets', [
            'type' => 'property',
            'nickname' => 'Apartamento',
            'detail' => [
                'unit' => '42', 'floor' => '4',
                'cep' => '15010-000', 'street' => 'Rua das Flores', 'number' => '123',
                'neighborhood' => 'Centro', 'city' => 'São José do Rio Preto', 'state' => 'SP',
            ],
        ])->assertStatus(201);

        $res->assertJsonPath('data.detail.cep', '15010-000')
            ->assertJsonPath('data.detail.street', 'Rua das Flores')
            ->assertJsonPath('data.detail.number', '123')
            ->assertJsonPath('data.detail.neighborhood', 'Centro')
            ->assertJsonPath('data.detail.city', 'São José do Rio Preto')
            ->assertJsonPath('data.detail.state', 'SP')
            // The legacy free-text fields still work.
            ->assertJsonPath('data.detail.unit', '42');

        $this->assertDatabaseHas('asset_properties', [
            'cep' => '15010-000', 'street' => 'Rua das Flores', 'city' => 'São José do Rio Preto', 'state' => 'SP',
        ]);
    }

    public function test_updating_a_property_asset_changes_structured_address(): void
    {
        $client = User::factory()->create();
        $asset = $this->propertyAsset($client);
        Sanctum::actingAs($client, ['client']);

        $this->putJson("/api/customer/v1/assets/{$asset->id}", [
            'detail' => ['cep' => '01001-000', 'city' => 'São Paulo', 'state' => 'SP', 'neighborhood' => 'Sé'],
        ])->assertOk()
            ->assertJsonPath('data.detail.cep', '01001-000')
            ->assertJsonPath('data.detail.city', 'São Paulo')
            ->assertJsonPath('data.detail.neighborhood', 'Sé');

        $this->assertDatabaseHas('asset_properties', [
            'id' => $asset->detailable_id, 'cep' => '01001-000', 'city' => 'São Paulo',
        ]);
    }

    // === FEATURE 2: owner-only notes on the asset ===

    public function test_owner_sees_both_notes_on_their_asset(): void
    {
        $client = User::factory()->create();
        Sanctum::actingAs($client, ['client']);

        $res = $this->postJson('/api/customer/v1/assets', [
            'type' => 'property',
            'nickname' => 'Casa',
            'private_note' => 'Chave reserva com a vizinha',
            'provider_note' => 'Portão emperra, empurre firme',
            'detail' => ['city' => 'Rio Preto'],
        ])->assertStatus(201);

        $res->assertJsonPath('data.private_note', 'Chave reserva com a vizinha')
            ->assertJsonPath('data.provider_note', 'Portão emperra, empurre firme');

        $id = $res->json('data.id');
        $this->assertDatabaseHas('assets', [
            'id' => $id,
            'private_note' => 'Chave reserva com a vizinha',
            'provider_note' => 'Portão emperra, empurre firme',
        ]);

        // And on show for the owner.
        $this->getJson("/api/customer/v1/assets/{$id}")
            ->assertOk()
            ->assertJsonPath('data.private_note', 'Chave reserva com a vizinha')
            ->assertJsonPath('data.provider_note', 'Portão emperra, empurre firme');
    }

    public function test_provider_viewing_asset_through_a_request_sees_neither_note(): void
    {
        $client = User::factory()->create();
        $provider = User::factory()->create();
        $asset = $this->propertyAsset($client, [
            'private_note' => 'segredo do dono',
            'provider_note' => 'nota compartilhavel',
        ]);
        $category = $this->category('c-notes');
        $request = ServiceRequest::create([
            'client_id' => $client->id, 'service_category_id' => $category->id, 'asset_id' => $asset->id,
            'description' => 'x', 'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::InProgress->value, 'accepted_provider_id' => $provider->id,
        ]);

        Sanctum::actingAs($provider, ['provider']);
        $res = $this->getJson("/api/provider/v1/provider/requests/{$request->id}")->assertOk();

        // Neither note leaks into the asset payload the provider sees.
        $res->assertJsonMissingPath('data.asset.private_note')
            ->assertJsonMissingPath('data.asset.provider_note');
    }

    // === FEATURE 3: per-request sharing of the provider note ===

    public function test_store_persists_share_asset_note_flag(): void
    {
        // The store flow fans out to nearby providers; isolate persistence here.
        Bus::fake();
        $client = User::factory()->create();
        $asset = $this->propertyAsset($client, ['provider_note' => 'nota']);
        $category = $this->category('c-share');
        Sanctum::actingAs($client, ['client']);

        $res = $this->postJson('/api/customer/v1/requests', [
            'service_category_id' => $category->id,
            'asset_id' => $asset->id,
            'description' => 'preciso de ajuda',
            'latitude' => -20.8, 'longitude' => -49.4,
            'share_asset_note' => true,
        ])->assertStatus(201);

        $this->assertDatabaseHas('service_requests', [
            'id' => $res->json('data.id'), 'share_asset_note' => true,
        ]);

        // Defaults to false when omitted.
        $res2 = $this->postJson('/api/customer/v1/requests', [
            'service_category_id' => $category->id,
            'asset_id' => $asset->id,
            'description' => 'outra',
            'latitude' => -20.8, 'longitude' => -49.4,
        ])->assertStatus(201);

        $this->assertDatabaseHas('service_requests', [
            'id' => $res2->json('data.id'), 'share_asset_note' => false,
        ]);
    }

    public function test_provider_note_is_shared_only_when_flag_is_true(): void
    {
        $client = User::factory()->create();
        $provider = User::factory()->create();
        $asset = $this->propertyAsset($client, [
            'private_note' => 'segredo do dono',
            'provider_note' => 'Cachorro bravo no quintal',
        ]);
        $category = $this->category('c-share2');

        $make = fn (bool $share) => ServiceRequest::create([
            'client_id' => $client->id, 'service_category_id' => $category->id, 'asset_id' => $asset->id,
            'description' => 'x', 'latitude' => 0, 'longitude' => 0, 'share_asset_note' => $share,
            'status' => RequestStatus::InProgress->value, 'accepted_provider_id' => $provider->id,
        ]);
        $shared = $make(true);
        $private = $make(false);

        // Provider: sees the note only on the shared request.
        Sanctum::actingAs($provider, ['provider']);
        $this->getJson("/api/provider/v1/provider/requests/{$shared->id}")
            ->assertOk()
            ->assertJsonPath('data.asset_provider_note', 'Cachorro bravo no quintal')
            // The private note must never surface in the request/provider flow.
            ->assertJsonMissingPath('data.asset.private_note');

        $this->getJson("/api/provider/v1/provider/requests/{$private->id}")
            ->assertOk()
            ->assertJsonPath('data.asset_provider_note', null);

        // Owner: sees the provider_note either way.
        Sanctum::actingAs($client, ['client']);
        $this->getJson("/api/customer/v1/requests/{$shared->id}")
            ->assertOk()
            ->assertJsonPath('data.asset_provider_note', 'Cachorro bravo no quintal');
        $this->getJson("/api/customer/v1/requests/{$private->id}")
            ->assertOk()
            ->assertJsonPath('data.asset_provider_note', 'Cachorro bravo no quintal');
    }
}
