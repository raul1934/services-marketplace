<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ProposalNotAccepted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationListTest extends TestCase
{
    use RefreshDatabase;

    /** Delivers a real notification through the database channel. */
    private function notify(User $user, int $requestId = 7): void
    {
        $user->notifyNow(new ProposalNotAccepted($requestId));
    }

    public function test_lists_the_users_notifications(): void
    {
        $user = User::factory()->create();
        $this->notify($user);
        Sanctum::actingAs($user, ['client']);

        $res = $this->getJson('/api/customer/v1/notifications')->assertOk();

        $res->assertJsonCount(1, 'data');
        $res->assertJsonPath('data.0.title', 'Outro profissional foi escolhido');
        $res->assertJsonPath('data.0.read_at', null);
        // The app-facing type, not the PHP class name — this is what the client
        // switches on to deep-link, and getting it wrong breaks every link.
        $res->assertJsonPath('data.0.type', 'proposal_not_accepted');
        // payload() survives, minus the keys we surface on their own.
        $res->assertJsonPath('data.0.payload.request_id', '7');
        $this->assertArrayNotHasKey('title', $res->json('data.0.payload'));
    }

    public function test_unread_count_and_marking_one_read(): void
    {
        $user = User::factory()->create();
        $this->notify($user);
        $this->notify($user, 8);
        Sanctum::actingAs($user, ['client']);

        $this->getJson('/api/customer/v1/notifications/unread-count')->assertOk()->assertJsonPath('count', 2);

        $id = $user->notifications()->first()->id;
        $this->postJson("/api/customer/v1/notifications/{$id}/read")->assertOk()->assertJsonPath('ok', true);

        $this->getJson('/api/customer/v1/notifications/unread-count')->assertOk()->assertJsonPath('count', 1);
    }

    public function test_marking_all_read(): void
    {
        $user = User::factory()->create();
        $this->notify($user);
        $this->notify($user, 8);
        Sanctum::actingAs($user, ['client']);

        $this->postJson('/api/customer/v1/notifications/read-all')->assertOk();

        $this->getJson('/api/customer/v1/notifications/unread-count')->assertOk()->assertJsonPath('count', 0);
    }

    public function test_cannot_read_someone_elses_notification(): void
    {
        $mine = User::factory()->create();
        $theirs = User::factory()->create();
        $this->notify($theirs);
        Sanctum::actingAs($mine, ['client']);

        $id = $theirs->notifications()->first()->id;
        $this->postJson("/api/customer/v1/notifications/{$id}/read")->assertNotFound();

        $this->assertNull($theirs->notifications()->first()->read_at);
    }

    public function test_list_is_scoped_to_the_user(): void
    {
        $mine = User::factory()->create();
        $theirs = User::factory()->create();
        $this->notify($theirs);
        Sanctum::actingAs($mine, ['client']);

        $this->getJson('/api/customer/v1/notifications')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_the_provider_app_reaches_the_same_bell(): void
    {
        $user = User::factory()->create(['is_provider' => true]);
        $this->notify($user);
        Sanctum::actingAs($user, ['provider']);

        $this->getJson('/api/provider/v1/notifications')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_requires_authentication(): void
    {
        $this->getJson('/api/customer/v1/notifications')->assertUnauthorized();
    }
}
