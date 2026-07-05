<?php

namespace Tests\Feature;

use App\Enums\AdminRole;
use App\Filament\Resources\ServiceRequestResource\Pages\CreateServiceRequest;
use App\Jobs\DispatchNewRequestToProviders;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Livewire\Livewire;
use Tests\TestCase;

class AdminRequestDispatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_created_request_dispatches_to_providers(): void
    {
        Bus::fake();

        $admin = User::factory()->create(['is_admin' => true, 'role' => AdminRole::SuperAdmin]);
        $client = User::factory()->create();
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'admin-cat', 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);

        $this->actingAs($admin);

        Livewire::test(CreateServiceRequest::class)
            ->fillForm([
                'client_id' => $client->id,
                'service_category_id' => $category->id,
                'description' => 'Created from the admin panel',
                'latitude' => -20.8197,
                'longitude' => -49.3794,
                'status' => 'open',
                'urgency' => 'urgent',
            ])
            ->call('create')
            ->assertHasNoFormErrors();

        Bus::assertDispatched(DispatchNewRequestToProviders::class);
    }
}
