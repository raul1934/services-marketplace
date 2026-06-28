<?php

namespace Tests\Feature;

use App\Enums\ProviderPlan;
use App\Http\Resources\ProviderProfileResource;
use App\Models\ProviderProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlanCommissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_plan_commission_rates(): void
    {
        $this->assertSame(0.05, ProviderPlan::Free->commissionRate());
        $this->assertSame(0.025, ProviderPlan::Pro->commissionRate());
        $this->assertSame(0.01, ProviderPlan::Enterprise->commissionRate());
    }

    public function test_profile_defaults_to_free_and_resource_exposes_rate(): void
    {
        $user = User::factory()->create();
        $profile = ProviderProfile::create(['user_id' => $user->id]);

        // Default plan is Free.
        $this->assertSame(0.05, $profile->fresh()->commissionRate());

        $profile->update(['plan' => ProviderPlan::Pro->value]);
        $arr = (new ProviderProfileResource($profile->fresh()))->toArray(request());

        $this->assertSame('pro', $arr['plan']);
        $this->assertSame(0.025, $arr['commission_rate']);
    }
}
