<?php

namespace Tests\Feature;

use App\Enums\AdminRole;
use App\Filament\Resources\ProviderProfileResource\Pages\EditProviderProfile;
use App\Filament\Resources\ProviderProfileResource\Pages\ListProviderProfiles;
use App\Models\ProviderProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class ProviderProfileResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_and_view_provider_reputation(): void
    {
        $admin = User::factory()->create(['is_admin' => true, 'role' => AdminRole::SuperAdmin]);
        $provider = User::factory()->create();
        $profile = ProviderProfile::create([
            'user_id' => $provider->id,
            'is_online' => true,
            'is_approved' => true,
            'rating_avg' => 4.2,
            'rating_count' => 10,
            'jobs_completed' => 10,
            'no_show_count' => 2,
        ]);

        $this->actingAs($admin);

        Livewire::test(ListProviderProfiles::class)->assertCanSeeTableRecords([$profile]);

        Livewire::test(EditProviderProfile::class, ['record' => $profile->getRouteKey()])
            ->assertFormSet(['is_approved' => true, 'no_show_count' => 2]);
    }

    public function test_admin_can_suspend_a_provider(): void
    {
        $admin = User::factory()->create(['is_admin' => true, 'role' => AdminRole::SuperAdmin]);
        $provider = User::factory()->create();
        $profile = ProviderProfile::create([
            'user_id' => $provider->id, 'is_online' => true, 'is_approved' => true,
        ]);

        $this->actingAs($admin);

        Livewire::test(EditProviderProfile::class, ['record' => $profile->getRouteKey()])
            ->fillForm(['is_approved' => false])
            ->call('save')
            ->assertHasNoFormErrors();

        $this->assertFalse($profile->fresh()->is_approved);
    }
}
