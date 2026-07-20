<?php

namespace Tests\Feature\Bots;

use App\Bots\Jobs\AcceptProposalAsBot;
use App\Bots\Observers\BotProposalObserver;
use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Models\Market;
use App\Models\Proposal;
use App\Models\ProviderProfile;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\Surcharge;
use App\Models\User;
use App\Support\Geofence;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

/**
 * TEMPORARY — test bots. Delete with app/Bots.
 *
 * Covers the Provider Bot: fake clients posting requests, the geofence sampling
 * that keeps them inside a market, the caps, and the auto-advance that stops a
 * real provider getting stuck on a bot-owned job.
 */
class ProviderBotTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['bots.enabled' => true]);
        Proposal::observe(BotProposalObserver::class);
    }

    private function market(float $lat = -20.81, float $lng = -49.37, float $half = 0.2): Market
    {
        return Market::create([
            'name' => 'Bot Market',
            'is_active' => true,
            'geofence' => [
                ['latitude' => $lat - $half, 'longitude' => $lng - $half],
                ['latitude' => $lat - $half, 'longitude' => $lng + $half],
                ['latitude' => $lat + $half, 'longitude' => $lng + $half],
                ['latitude' => $lat + $half, 'longitude' => $lng - $half],
            ],
        ]);
    }

    private function category(): ServiceCategory
    {
        return ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'tow', 'name' => 'Guincho',
            'sort_order' => 1, 'is_active' => true,
        ]);
    }

    private function botClient(): User
    {
        return User::factory()->create(['is_client' => true, 'is_bot' => true, 'name' => 'TEST Customer 01']);
    }

    // ── Geofence sampling ────────────────────────────────────────

    public function test_every_sampled_point_falls_inside_the_polygon(): void
    {
        $polygon = $this->market()->geofence;

        for ($i = 0; $i < 100; $i++) {
            $point = Geofence::randomPointInside($polygon);

            $this->assertNotNull($point, 'sampling returned null');
            $this->assertTrue(
                Geofence::contains($point['latitude'], $point['longitude'], $polygon),
                "sampled point {$point['latitude']},{$point['longitude']} fell outside",
            );
        }
    }

    public function test_a_degenerate_polygon_samples_to_null_instead_of_throwing(): void
    {
        $this->assertNull(Geofence::randomPointInside([]));
        $this->assertNull(Geofence::randomPointInside([
            ['latitude' => 1, 'longitude' => 1],
            ['latitude' => 2, 'longitude' => 2],
        ]));
    }

    // ── Multi-market ─────────────────────────────────────────────

    /**
     * Bots spread across every active market rather than piling into the first
     * one. Sampled over enough runs that hitting only one market would be a
     * ~1-in-500 fluke rather than a plausible pass.
     */
    public function test_bot_requests_spread_across_all_active_markets(): void
    {
        config(['matching.territory_isolation' => true, 'bots.market_id' => null]);

        $a = $this->market(-20.81, -49.37);
        $b = Market::create([
            'name' => 'Segundo Market',
            'is_active' => true,
            'geofence' => [
                ['latitude' => -22.00, 'longitude' => -47.00],
                ['latitude' => -22.00, 'longitude' => -46.60],
                ['latitude' => -21.60, 'longitude' => -46.60],
                ['latitude' => -21.60, 'longitude' => -47.00],
            ],
        ]);

        $this->category();
        $client = $this->botClient();

        $seen = [];
        for ($i = 0; $i < 20; $i++) {
            $seen[] = app(\App\Bots\BotRequestFactory::class)->create($client)->market_id;
        }

        $this->assertContains($a->id, $seen, 'never posted in the first market');
        $this->assertContains($b->id, $seen, 'never posted in the second market');
    }

    /** BOTS_MARKET_ID pins them back to one territory. */
    public function test_bots_market_id_confines_requests_to_one_market(): void
    {
        config(['matching.territory_isolation' => true]);

        $a = $this->market(-20.81, -49.37);
        Market::create([
            'name' => 'Segundo Market',
            'is_active' => true,
            'geofence' => [
                ['latitude' => -22.00, 'longitude' => -47.00],
                ['latitude' => -22.00, 'longitude' => -46.60],
                ['latitude' => -21.60, 'longitude' => -46.60],
                ['latitude' => -21.60, 'longitude' => -47.00],
            ],
        ]);

        config(['bots.market_id' => $a->id]);

        $this->category();
        $client = $this->botClient();

        for ($i = 0; $i < 10; $i++) {
            $this->assertSame($a->id, app(\App\Bots\BotRequestFactory::class)->create($client)->market_id);
        }
    }

    // ── Asset linkage ────────────────────────────────────────────

    /**
     * The "qual bem" card renders nothing without asset_id — a screen that looks
     * broken when it is really just missing data.
     */
    public function test_a_roadside_bot_request_is_tied_to_a_vehicle(): void
    {
        config(['bots.market_id' => $this->market()->id]);
        $this->category(); // roadside
        $client = $this->botClient();
        \App\Bots\BotAssets::seedFor($client);

        $request = app(\App\Bots\BotRequestFactory::class)->create($client);

        $this->assertNotNull($request->asset_id, 'roadside request must name a vehicle');
        $this->assertSame(\App\Enums\AssetType::Vehicle, $request->asset->type);
    }

    /** Beauty operates on a person, so no asset — same as a real request. */
    public function test_a_beauty_bot_request_has_no_asset(): void
    {
        config(['bots.market_id' => $this->market()->id]);
        ServiceCategory::create([
            'type' => 'beauty', 'slug' => 'hair', 'name' => 'Cabelo',
            'sort_order' => 1, 'is_active' => true,
        ]);
        $client = $this->botClient();
        \App\Bots\BotAssets::seedFor($client);

        $this->assertNull(app(\App\Bots\BotRequestFactory::class)->create($client)->asset_id);
    }

    public function test_seeding_assets_twice_does_not_duplicate(): void
    {
        $client = $this->botClient();

        \App\Bots\BotAssets::seedFor($client);
        \App\Bots\BotAssets::seedFor($client);

        $this->assertSame(3, $client->assets()->count());
    }

    // ── Request creation ─────────────────────────────────────────

    /**
     * Under territory isolation an out-of-coverage point throws instead of
     * creating a request. The bot samples from a market's own geofence, so it
     * must always land inside one.
     */
    public function test_a_bot_request_lands_in_a_market_under_territory_isolation(): void
    {
        config(['matching.territory_isolation' => true]);

        $market = $this->market();
        config(['bots.market_id' => $market->id]);
        $this->category();

        $request = app(\App\Bots\BotRequestFactory::class)->create($this->botClient());

        $this->assertNotNull($request);
        $this->assertTrue((bool) $request->is_test);
        $this->assertSame($market->id, $request->market_id);
        $this->assertStringContainsString('[TESTE]', $request->description);
        $this->assertSame(RequestStatus::Open, $request->status);
    }

    public function test_urgency_and_max_wait_stay_consistent(): void
    {
        config(['matching.territory_isolation' => true]);
        config(['bots.market_id' => $this->market()->id]);
        $this->category();
        $client = $this->botClient();

        // Both urgency branches are random, so sample enough to hit each.
        for ($i = 0; $i < 20; $i++) {
            $request = app(\App\Bots\BotRequestFactory::class)->create($client);

            if ($request->urgency === \App\Enums\RequestUrgency::Urgent) {
                $this->assertContains($request->max_wait_minutes, [10, 20, 30]);
            } else {
                $this->assertNull($request->max_wait_minutes);
            }
        }
    }

    // ── Caps ─────────────────────────────────────────────────────

    public function test_the_open_request_cap_stops_creation(): void
    {
        config(['bots.market_id' => $this->market()->id]);
        $category = $this->category();
        $client = $this->botClient();

        config(['bots.max_open_requests' => 2]);

        foreach (range(1, 2) as $i) {
            ServiceRequest::create([
                'client_id' => $client->id,
                'service_category_id' => $category->id,
                'description' => 'x',
                'latitude' => -20.81, 'longitude' => -49.37,
                'status' => RequestStatus::Open->value,
                'is_test' => true,
            ]);
        }

        $this->artisan('bots:create-request')
            ->expectsOutputToContain('Skipped')
            ->assertSuccessful();

        $this->assertSame(2, ServiceRequest::where('is_test', true)->count());
    }

    public function test_the_command_is_inert_when_bots_are_disabled(): void
    {
        config(['bots.enabled' => false, 'bots.market_id' => $this->market()->id]);
        $this->category();
        $this->botClient();

        $this->artisan('bots:create-request')->assertSuccessful();

        $this->assertSame(0, ServiceRequest::count());
    }

    // ── Auto-advance ─────────────────────────────────────────────

    private function botRequest(User $client, int $categoryId): ServiceRequest
    {
        return ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $categoryId,
            'description' => 'x',
            'latitude' => -20.81, 'longitude' => -49.37,
            'status' => RequestStatus::Open->value,
            'urgency' => \App\Enums\RequestUrgency::Urgent->value,
            'is_test' => true,
        ]);
    }

    public function test_a_real_providers_bid_on_a_bot_request_schedules_an_accept(): void
    {
        $category = $this->category();
        $request = $this->botRequest($this->botClient(), $category->id);
        $provider = User::factory()->create(['is_provider' => true]);

        Bus::fake();

        Proposal::create([
            'service_request_id' => $request->id,
            'provider_id' => $provider->id,
            'price' => 100, 'eta_minutes' => 30,
        ]);

        Bus::assertDispatched(AcceptProposalAsBot::class);
    }

    public function test_a_bot_providers_bid_does_not_schedule_an_accept(): void
    {
        $category = $this->category();
        $request = $this->botRequest($this->botClient(), $category->id);
        $botProvider = User::factory()->create(['is_provider' => true, 'is_bot' => true]);

        Bus::fake();

        Proposal::create([
            'service_request_id' => $request->id,
            'provider_id' => $botProvider->id,
            'price' => 100, 'eta_minutes' => 30,
        ]);

        Bus::assertNotDispatched(AcceptProposalAsBot::class);
    }

    public function test_a_bid_on_a_real_clients_request_does_not_schedule_an_accept(): void
    {
        $category = $this->category();
        $realClient = User::factory()->create(['is_client' => true]);
        $request = $this->botRequest($realClient, $category->id);
        $provider = User::factory()->create(['is_provider' => true]);

        Bus::fake();

        Proposal::create([
            'service_request_id' => $request->id,
            'provider_id' => $provider->id,
            'price' => 100, 'eta_minutes' => 30,
        ]);

        Bus::assertNotDispatched(AcceptProposalAsBot::class);
    }

    public function test_the_accept_job_accepts_and_generates_a_start_code_for_urgent(): void
    {
        $category = $this->category();
        $request = $this->botRequest($this->botClient(), $category->id);
        $provider = User::factory()->create(['is_provider' => true]);
        ProviderProfile::create(['user_id' => $provider->id, 'is_online' => true, 'is_approved' => true]);

        $proposal = Proposal::create([
            'service_request_id' => $request->id,
            'provider_id' => $provider->id,
            'price' => 100, 'eta_minutes' => 30,
        ]);

        (new AcceptProposalAsBot($proposal->id))->handle(app(\App\Services\ProposalService::class));

        $request->refresh();

        $this->assertSame(RequestStatus::Accepted, $request->status);
        $this->assertSame($provider->id, $request->accepted_provider_id);
        $this->assertNotNull($request->start_code, 'urgent jobs must get a start code');
    }

    /**
     * The start_code is deliberately hidden from providers on real jobs. On a bot
     * job there is no human to read it aloud, so test_start_code exposes it —
     * but only to the accepted provider, and only on a test request.
     */
    public function test_test_start_code_is_visible_to_the_accepted_provider_only(): void
    {
        $category = $this->category();
        $request = $this->botRequest($this->botClient(), $category->id);
        $provider = User::factory()->create(['is_provider' => true]);
        ProviderProfile::create(['user_id' => $provider->id, 'is_online' => true, 'is_approved' => true]);
        $provider->categories()->sync([$category->id]);

        $proposal = Proposal::create([
            'service_request_id' => $request->id,
            'provider_id' => $provider->id,
            'price' => 100, 'eta_minutes' => 30,
        ]);
        (new AcceptProposalAsBot($proposal->id))->handle(app(\App\Services\ProposalService::class));

        $token = $provider->createToken('provider', ['provider'])->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/provider/v1/provider/requests/{$request->id}")
            ->assertOk()
            ->assertJsonPath('data.is_test', true)
            ->assertJsonPath('data.test_start_code', $request->fresh()->start_code);
    }

    public function test_test_start_code_is_absent_on_a_real_request(): void
    {
        $category = $this->category();
        $realClient = User::factory()->create(['is_client' => true]);

        $request = ServiceRequest::create([
            'client_id' => $realClient->id,
            'service_category_id' => $category->id,
            'description' => 'x',
            'latitude' => -20.81, 'longitude' => -49.37,
            'status' => RequestStatus::Open->value,
            'urgency' => \App\Enums\RequestUrgency::Urgent->value,
            'is_test' => false,
        ]);

        $provider = User::factory()->create(['is_provider' => true]);
        ProviderProfile::create(['user_id' => $provider->id, 'is_online' => true, 'is_approved' => true]);
        $provider->categories()->sync([$category->id]);

        $proposal = Proposal::create([
            'service_request_id' => $request->id,
            'provider_id' => $provider->id,
            'price' => 100, 'eta_minutes' => 30,
        ]);
        app(\App\Services\ProposalService::class)->accept($proposal);

        $token = $provider->createToken('provider', ['provider'])->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/provider/v1/provider/requests/{$request->id}")
            ->assertOk()
            ->assertJsonPath('data.is_test', false)
            ->assertJsonMissingPath('data.test_start_code')
            ->assertJsonMissingPath('data.start_code');
    }

    // ── Bot provider actually reaching the customer ──────────────

    /** A bot provider on a job, with a location N km away from it. */
    private function botOnJob(float $awayKm = 20): array
    {
        $category = $this->category();
        $realClient = User::factory()->create(['is_client' => true]);

        $request = ServiceRequest::create([
            'client_id' => $realClient->id,
            'service_category_id' => $category->id,
            'description' => 'x',
            'latitude' => -20.81, 'longitude' => -49.37,
            'status' => RequestStatus::Accepted->value,
            'urgency' => \App\Enums\RequestUrgency::Urgent->value,
            'is_test' => false, // a REAL customer's request
        ]);

        $bot = User::factory()->create(['is_provider' => true, 'is_bot' => true]);
        ProviderProfile::create(['user_id' => $bot->id, 'is_online' => true, 'is_approved' => true]);
        \App\Models\ProviderLocation::create([
            'user_id' => $bot->id,
            'latitude' => -20.81 + ($awayKm / 111.0),
            'longitude' => -49.37,
        ]);

        $request->update(['accepted_provider_id' => $bot->id]);

        return [$request->fresh(), $bot];
    }

    private function kmFromJob(ServiceRequest $request, User $bot): float
    {
        $bot->load('location');

        return app(\App\Services\MatchingService::class)->distanceKm(
            (float) $bot->location->latitude, (float) $bot->location->longitude,
            (float) $request->latitude, (float) $request->longitude,
        );
    }

    /**
     * The gap that stranded the tracking screen: a bot provider's location is
     * written once by bots:seed and never again, so the customer watched a
     * marker frozen tens of km away forever.
     */
    public function test_a_bot_provider_moves_closer_to_the_job_each_tick(): void
    {
        [$request, $bot] = $this->botOnJob(20);
        $driver = app(\App\Bots\BotDriver::class);

        $before = $this->kmFromJob($request, $bot);
        $this->assertTrue($driver->drive($request));
        $after = $this->kmFromJob($request->fresh(), $bot);

        $this->assertLessThan($before, $after, 'bot did not get closer');
    }

    public function test_a_bot_provider_eventually_arrives_and_starts_the_job(): void
    {
        [$request, $bot] = $this->botOnJob(20);
        $driver = app(\App\Bots\BotDriver::class);

        for ($i = 0; $i < 20; $i++) {
            $request = $request->fresh();
            if ($request->status === RequestStatus::InProgress) {
                break;
            }
            $driver->drive($request);
        }

        $this->assertSame(RequestStatus::InProgress, $request->fresh()->status);
        $this->assertLessThan(1.0, $this->kmFromJob($request->fresh(), $bot));
    }

    /**
     * On site the bot logs a part and asks for approval — the common real case,
     * and what the customer's on-site panel exists to show.
     */
    public function test_a_bot_provider_adds_a_part_and_asks_for_approval(): void
    {
        [$request] = $this->botOnJob(0.1);
        $driver = app(\App\Bots\BotDriver::class);

        $driver->drive($request);                        // arrives → in_progress
        $driver->drive($request->fresh());               // logs a part

        $request = $request->fresh();
        $this->assertSame(1, $request->jobParts()->count());
        $this->assertStringContainsString('[TESTE]', $request->jobParts()->first()->name);
        $this->assertNull($request->parts_approval_requested_at, 'approval should come on the next tick');

        $driver->drive($request);                        // requests approval

        $this->assertNotNull($request->fresh()->parts_approval_requested_at);
    }

    public function test_a_bot_provider_waits_for_the_customer_before_completing(): void
    {
        [$request] = $this->botOnJob(0.1);
        $driver = app(\App\Bots\BotDriver::class);

        $driver->drive($request);                        // arrives
        $driver->drive($request->fresh());               // part
        $driver->drive($request->fresh());               // asks approval

        // Long past the work window, but the customer hasn't answered — the bot
        // must not close the job over their head.
        $request->fresh()->update(['started_at' => now()->subMinutes(30)]);
        $driver->drive($request->fresh());
        $this->assertSame(RequestStatus::InProgress, $request->fresh()->status);

        $request->fresh()->update(['parts_approved_at' => now()]);
        $driver->drive($request->fresh());

        $this->assertSame(RequestStatus::Completed, $request->fresh()->status);
    }

    /**
     * The deadlock this guards against: with a real customer on the other side,
     * nobody approves the bot's part, and an in_progress job that can never
     * finish sits on their home screen for good. After the grace period the bot
     * takes the unapproved part back off the bill and completes with labour only
     * — what a provider does when the customer won't authorise the part.
     */
    public function test_an_unanswered_approval_does_not_strand_the_job(): void
    {
        [$request] = $this->botOnJob(0.1);
        $driver = app(\App\Bots\BotDriver::class);

        $driver->drive($request);                        // arrives
        $driver->drive($request->fresh());               // adds a part
        $driver->drive($request->fresh());               // asks for approval

        $request = $request->fresh();
        $this->assertNotNull($request->parts_approval_requested_at);
        $this->assertSame(1, $request->jobParts()->count());

        // The customer never answers.
        $request->update([
            'parts_approval_requested_at' => now()->subMinutes(10),
            'started_at' => now()->subMinutes(10),
        ]);

        $driver->drive($request->fresh());               // gives up on the part
        $driver->drive($request->fresh());               // completes

        $request = $request->fresh();
        $this->assertSame(RequestStatus::Completed, $request->status);
        $this->assertSame(0, $request->jobParts()->count(), 'unapproved part should be withdrawn');
    }

    /** A REAL provider's location must never be moved by the bots. */
    public function test_a_real_providers_job_is_left_alone(): void
    {
        [$request, $bot] = $this->botOnJob(20);
        $bot->update(['is_bot' => false]);

        $before = $this->kmFromJob($request, $bot);
        $this->assertFalse(app(\App\Bots\BotDriver::class)->drive($request->fresh()));

        $this->assertSame($before, $this->kmFromJob($request->fresh(), $bot));
        $this->assertSame(RequestStatus::Accepted, $request->fresh()->status);
    }

    public function test_advance_approves_a_pending_surcharge_on_a_bot_job(): void
    {
        $category = $this->category();
        $request = $this->botRequest($this->botClient(), $category->id);
        $provider = User::factory()->create(['is_provider' => true]);

        $request->update([
            'status' => RequestStatus::InProgress->value,
            'accepted_provider_id' => $provider->id,
        ]);

        $surcharge = Surcharge::create([
            'service_request_id' => $request->id,
            'provider_id' => $provider->id,
            'amount' => 50,
            'reason' => 'peça extra',
            'percent_accumulated' => 10,
            'tier' => \App\Enums\SurchargeTier::Simple->value,
            'status' => \App\Enums\SurchargeStatus::Pending->value,
        ]);

        $this->artisan('bots:advance')->assertSuccessful();

        $this->assertSame(\App\Enums\SurchargeStatus::Approved, $surcharge->fresh()->status);
    }
}
