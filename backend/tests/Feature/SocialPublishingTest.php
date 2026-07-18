<?php

namespace Tests\Feature;

use App\Enums\AdminRole;
use App\Enums\SocialPostStatus;
use App\Enums\SocialProvider;
use App\Enums\SocialTargetStatus;
use App\Filament\Resources\SocialConnectionResource;
use App\Filament\Resources\SocialPostResource;
use App\Jobs\PublishSocialPost;
use App\Models\Media;
use App\Models\SocialConnection;
use App\Models\SocialPost;
use App\Models\SocialPostTarget;
use App\Models\User;
use App\Services\Social\DriverRegistry;
use App\Services\Social\Drivers\FacebookDriver;
use App\Services\Social\Drivers\InstagramDriver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SocialPublishingTest extends TestCase
{
    use RefreshDatabase;

    private function fbConnection(): SocialConnection
    {
        return SocialConnection::create([
            'provider' => SocialProvider::Facebook->value,
            'external_id' => 'PAGE123',
            'name' => 'My Page',
            'access_token' => 'secret-fb-token',
            'is_active' => true,
        ]);
    }

    private function igConnection(): SocialConnection
    {
        return SocialConnection::create([
            'provider' => SocialProvider::Instagram->value,
            'external_id' => 'IG456',
            'name' => 'My IG',
            'access_token' => 'secret-ig-token',
            'is_active' => true,
        ]);
    }

    private function makePost(string $caption = 'Hello world', ?string $imagePath = null): SocialPost
    {
        $post = SocialPost::create([
            'caption' => $caption,
            'status' => SocialPostStatus::Draft->value,
        ]);

        if ($imagePath) {
            $post->media()->create(['disk' => 'public', 'path' => $imagePath, 'tag' => 'social']);
        }

        return $post;
    }

    // ── Drivers build the correct Graph request + parse the id ──

    public function test_facebook_driver_posts_text_to_feed_and_parses_id(): void
    {
        Http::fake([
            'graph.facebook.com/*/feed' => Http::response(['id' => 'PAGE123_999']),
        ]);

        $connection = $this->fbConnection();
        $post = $this->makePost('A text post');

        $result = app(FacebookDriver::class)->publish($post, $connection);

        $this->assertSame('PAGE123_999', $result['external_id']);
        Http::assertSent(function ($request) {
            return str_contains($request->url(), '/PAGE123/feed')
                && $request['message'] === 'A text post'
                && $request->hasHeader('Authorization', 'Bearer secret-fb-token');
        });
    }

    public function test_facebook_driver_posts_image_to_photos_when_present(): void
    {
        Http::fake([
            'graph.facebook.com/*/photos' => Http::response(['id' => 'PHOTO1', 'post_id' => 'PAGE123_777']),
        ]);

        $connection = $this->fbConnection();
        $post = $this->makePost('With image', 'uploads/social/pic.png');

        $result = app(FacebookDriver::class)->publish($post, $connection);

        $this->assertSame('PAGE123_777', $result['external_id']);
        Http::assertSent(fn ($request) => str_contains($request->url(), '/PAGE123/photos')
            && str_contains((string) $request['url'], 'pic.png')
            && $request['caption'] === 'With image');
    }

    public function test_instagram_driver_creates_container_then_publishes(): void
    {
        Http::fake([
            'graph.facebook.com/*/IG456/media_publish' => Http::response(['id' => 'IGMEDIA9']),
            'graph.facebook.com/*/IG456/media' => Http::response(['id' => 'CONTAINER1']),
        ]);

        $connection = $this->igConnection();
        $post = $this->makePost('IG caption', 'uploads/social/ig.png');

        $result = app(InstagramDriver::class)->publish($post, $connection);

        $this->assertSame('IGMEDIA9', $result['external_id']);
        Http::assertSent(fn ($request) => str_contains($request->url(), '/IG456/media')
            && isset($request['image_url']));
        Http::assertSent(fn ($request) => str_contains($request->url(), '/IG456/media_publish')
            && $request['creation_id'] === 'CONTAINER1');
    }

    // ── Interactions parsing ──

    public function test_facebook_interactions_parse_counts_and_comments(): void
    {
        Http::fake([
            'graph.facebook.com/*/PAGE123_999/comments*' => Http::response([
                'data' => [
                    ['id' => 'c1', 'from' => ['name' => 'Alice'], 'message' => 'Nice!', 'created_time' => '2026-07-10T12:00:00+0000'],
                ],
            ]),
            'graph.facebook.com/*/PAGE123_999*' => Http::response([
                'reactions' => ['summary' => ['total_count' => 12]],
                'comments' => ['summary' => ['total_count' => 3]],
            ]),
        ]);

        $connection = $this->fbConnection();
        $target = SocialPostTarget::create([
            'social_post_id' => $this->makePost()->id,
            'provider' => SocialProvider::Facebook->value,
            'social_connection_id' => $connection->id,
            'status' => SocialTargetStatus::Published->value,
            'external_id' => 'PAGE123_999',
        ]);

        $data = app(FacebookDriver::class)->fetchInteractions($target->fresh('connection'));

        $this->assertSame(12, $data['likes_count']);
        $this->assertSame(3, $data['comments_count']);
        $this->assertCount(1, $data['comments']);
        $this->assertSame('Alice', $data['comments'][0]['author_name']);
        $this->assertSame('Nice!', $data['comments'][0]['text']);
    }

    public function test_instagram_interactions_parse_counts_and_comments(): void
    {
        Http::fake([
            'graph.facebook.com/*/IGMEDIA9/comments*' => Http::response([
                'data' => [
                    ['id' => 'ic1', 'username' => 'bob', 'text' => 'Great', 'timestamp' => '2026-07-10T12:00:00+0000'],
                ],
            ]),
            'graph.facebook.com/*/IGMEDIA9*' => Http::response([
                'like_count' => 20,
                'comments_count' => 5,
            ]),
        ]);

        $connection = $this->igConnection();
        $target = SocialPostTarget::create([
            'social_post_id' => $this->makePost()->id,
            'provider' => SocialProvider::Instagram->value,
            'social_connection_id' => $connection->id,
            'status' => SocialTargetStatus::Published->value,
            'external_id' => 'IGMEDIA9',
        ]);

        $data = app(InstagramDriver::class)->fetchInteractions($target->fresh('connection'));

        $this->assertSame(20, $data['likes_count']);
        $this->assertSame(5, $data['comments_count']);
        $this->assertSame('bob', $data['comments'][0]['author_name']);
    }

    // ── PublishSocialPost job: success + failure ──

    public function test_publish_job_marks_target_and_post_published_on_success(): void
    {
        Http::fake([
            'graph.facebook.com/*/feed' => Http::response(['id' => 'PAGE123_555']),
        ]);

        $connection = $this->fbConnection();
        $post = $this->makePost('Publish me');
        $target = SocialPostTarget::create([
            'social_post_id' => $post->id,
            'provider' => SocialProvider::Facebook->value,
            'social_connection_id' => $connection->id,
            'status' => SocialTargetStatus::Pending->value,
        ]);

        app(PublishSocialPost::class, ['postId' => $post->id])->handle(app(DriverRegistry::class));

        $target->refresh();
        $this->assertSame(SocialTargetStatus::Published, $target->status);
        $this->assertSame('PAGE123_555', $target->external_id);
        $this->assertNotNull($target->published_at);
        $this->assertSame(SocialPostStatus::Published, $post->fresh()->status);
    }

    public function test_publish_job_marks_failed_when_graph_returns_no_id(): void
    {
        Http::fake([
            'graph.facebook.com/*/feed' => Http::response(['error' => ['message' => 'bad token']], 400),
        ]);

        $connection = $this->fbConnection();
        $post = $this->makePost('Will fail');
        $target = SocialPostTarget::create([
            'social_post_id' => $post->id,
            'provider' => SocialProvider::Facebook->value,
            'social_connection_id' => $connection->id,
            'status' => SocialTargetStatus::Pending->value,
        ]);

        app(PublishSocialPost::class, ['postId' => $post->id])->handle(app(DriverRegistry::class));

        $target->refresh();
        $this->assertSame(SocialTargetStatus::Failed, $target->status);
        $this->assertNotNull($target->error);
        $this->assertSame(SocialPostStatus::Failed, $post->fresh()->status);
    }

    public function test_publish_job_rolls_up_to_partial_when_one_target_fails(): void
    {
        Http::fake([
            'graph.facebook.com/*/PAGE123/feed' => Http::response(['id' => 'PAGE123_1']),
            'graph.facebook.com/*/IG456/media' => Http::response(['error' => ['message' => 'no image']], 400),
        ]);

        $fb = $this->fbConnection();
        $ig = $this->igConnection();
        $post = $this->makePost('Mixed');
        SocialPostTarget::create([
            'social_post_id' => $post->id, 'provider' => SocialProvider::Facebook->value,
            'social_connection_id' => $fb->id, 'status' => SocialTargetStatus::Pending->value,
        ]);
        SocialPostTarget::create([
            'social_post_id' => $post->id, 'provider' => SocialProvider::Instagram->value,
            'social_connection_id' => $ig->id, 'status' => SocialTargetStatus::Pending->value,
        ]);

        app(PublishSocialPost::class, ['postId' => $post->id])->handle(app(DriverRegistry::class));

        $this->assertSame(SocialPostStatus::Partial, $post->fresh()->status);
    }

    // ── Scheduled dispatch command ──

    public function test_publish_due_command_dispatches_only_due_posts(): void
    {
        Bus::fake();

        $due = SocialPost::create([
            'caption' => 'due', 'status' => SocialPostStatus::Scheduled->value,
            'scheduled_at' => now()->subMinute(),
        ]);
        $future = SocialPost::create([
            'caption' => 'future', 'status' => SocialPostStatus::Scheduled->value,
            'scheduled_at' => now()->addHour(),
        ]);
        $draft = SocialPost::create([
            'caption' => 'draft', 'status' => SocialPostStatus::Draft->value,
        ]);

        $this->artisan('social:publish-due')->assertSuccessful();

        Bus::assertDispatched(PublishSocialPost::class, fn ($job) => $job->postId === $due->id);
        Bus::assertNotDispatched(PublishSocialPost::class, fn ($job) => $job->postId === $future->id);
        Bus::assertNotDispatched(PublishSocialPost::class, fn ($job) => $job->postId === $draft->id);
        $this->assertSame(SocialPostStatus::Publishing, $due->fresh()->status);
    }

    // ── Token encrypted at rest ──

    public function test_access_token_is_encrypted_at_rest(): void
    {
        $connection = $this->fbConnection();

        $raw = DB::table('social_connections')->where('id', $connection->id)->value('access_token');

        $this->assertNotSame('secret-fb-token', $raw);
        $this->assertStringNotContainsString('secret-fb-token', $raw);
        // The model transparently decrypts it back.
        $this->assertSame('secret-fb-token', $connection->fresh()->access_token);
    }

    // ── Super-admin gate on both resources ──

    public function test_resources_are_super_admin_only(): void
    {
        $superAdmin = User::factory()->create(['is_admin' => true, 'role' => AdminRole::SuperAdmin]);
        $marketAdmin = User::factory()->create(['is_admin' => true, 'role' => AdminRole::MarketAdmin]);

        $this->actingAs($marketAdmin);
        $this->assertFalse(SocialPostResource::canViewAny());
        $this->assertFalse(SocialConnectionResource::canViewAny());

        $this->actingAs($superAdmin);
        $this->assertTrue(SocialPostResource::canViewAny());
        $this->assertTrue(SocialConnectionResource::canViewAny());
    }

    public function test_media_image_url_is_used_for_publishing(): void
    {
        // Guards the SocialPost::imageUrl() wiring the drivers rely on.
        $post = $this->makePost('x', 'uploads/social/pic.png');

        $this->assertInstanceOf(Media::class, $post->image);
        $this->assertStringContainsString('pic.png', $post->imageUrl());
    }
}
