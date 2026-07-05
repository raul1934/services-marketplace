<?php

namespace Tests\Feature;

use App\Enums\AdminRole;
use App\Filament\Resources\WalletTransactionResource\Pages\ListWalletTransactions;
use App\Models\Market;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Livewire\Livewire;
use Tests\TestCase;

class PayoutReconciliationTest extends TestCase
{
    use RefreshDatabase;

    public function test_payout_request_defaults_to_pending(): void
    {
        $provider = User::factory()->create();
        $provider->providerProfile()->create(['is_online' => false]);
        WalletTransaction::create([
            'provider_id' => $provider->id, 'type' => WalletTransaction::TYPE_CREDIT, 'amount' => 200,
        ]);

        Sanctum::actingAs($provider, ['provider']);
        $this->postJson('/api/provider/v1/provider/wallet/payout', ['amount' => 100])->assertOk();

        $payout = WalletTransaction::where('provider_id', $provider->id)->where('type', WalletTransaction::TYPE_PAYOUT)->first();
        $this->assertSame(WalletTransaction::STATUS_PENDING, $payout->status);
    }

    public function test_admin_can_mark_a_pending_payout_as_paid(): void
    {
        $market = Market::create(['name' => 'A', 'geofence' => [['latitude' => 0, 'longitude' => 0], ['latitude' => 0, 'longitude' => 1], ['latitude' => 1, 'longitude' => 0]]]);
        $provider = User::factory()->create();
        $payout = WalletTransaction::create([
            'provider_id' => $provider->id, 'market_id' => $market->id, 'type' => WalletTransaction::TYPE_PAYOUT,
            'amount' => 100, 'status' => WalletTransaction::STATUS_PENDING,
        ]);

        $admin = User::factory()->create(['is_admin' => true, 'role' => AdminRole::SuperAdmin]);
        $this->actingAs($admin);

        Livewire::test(ListWalletTransactions::class)
            ->callTableAction('markPaid', $payout)
            ->assertHasNoTableActionErrors();

        $this->assertSame(WalletTransaction::STATUS_COMPLETED, $payout->fresh()->status);
    }

    public function test_market_admin_cannot_see_a_payout_outside_their_market(): void
    {
        $marketA = Market::create(['name' => 'A', 'geofence' => [['latitude' => 0, 'longitude' => 0], ['latitude' => 0, 'longitude' => 1], ['latitude' => 1, 'longitude' => 0]]]);
        $marketB = Market::create(['name' => 'B', 'geofence' => [['latitude' => 5, 'longitude' => 5], ['latitude' => 5, 'longitude' => 6], ['latitude' => 6, 'longitude' => 5]]]);
        $provider = User::factory()->create();
        $payout = WalletTransaction::create([
            'provider_id' => $provider->id, 'market_id' => $marketB->id, 'type' => WalletTransaction::TYPE_PAYOUT,
            'amount' => 100, 'status' => WalletTransaction::STATUS_PENDING,
        ]);

        $admin = User::factory()->create(['is_admin' => true, 'role' => AdminRole::MarketAdmin]);
        $admin->markets()->sync([$marketA->id]);
        $this->actingAs($admin);

        Livewire::test(ListWalletTransactions::class)->assertCanNotSeeTableRecords([$payout]);
    }
}
