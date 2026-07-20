<?php

namespace Tests\Feature\Bots;

use App\Bots\Jobs\AskBotQuestion;
use App\Bots\Jobs\ReactToBotAnswer;
use App\Bots\Jobs\ScheduleBotBids;
use App\Bots\Jobs\SubmitBotBid;
use App\Bots\Observers\BotQuestionObserver;
use App\Bots\Observers\BotRequestObserver;
use App\Enums\RequestStatus;
use App\Enums\RequestUrgency;
use App\Models\Proposal;
use App\Models\ProviderProfile;
use App\Models\RequestQuestion;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Notifications\NewProposalForClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * TEMPORARY — test bots. Delete with app/Bots.
 *
 * Covers the Customer Bot: fake providers bidding on real customers' requests,
 * and the pre-bid Q&A loop around it.
 */
class CustomerBotTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['bots.enabled' => true]);

        // The observers are registered in AppServiceProvider only when the config
        // flag is on at boot — which it isn't under phpunit.xml. Register them
        // here so the tests exercise the real wiring.
        ServiceRequest::observe(BotRequestObserver::class);
        RequestQuestion::observe(BotQuestionObserver::class);
    }

    private function category(): ServiceCategory
    {
        return ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'tow', 'name' => 'Guincho',
            'sort_order' => 1, 'is_active' => true,
        ]);
    }

    private function botProvider(int $n, int $categoryId): User
    {
        $u = User::factory()->create(['is_provider' => true, 'is_bot' => true, 'name' => "TEST Provider 0{$n}"]);
        ProviderProfile::create(['user_id' => $u->id, 'is_online' => true, 'is_approved' => true]);
        $u->categories()->sync([$categoryId]);

        return $u;
    }

    private function openRequest(User $client, int $categoryId, bool $isTest = false): ServiceRequest
    {
        return ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $categoryId,
            'description' => 'x',
            'latitude' => -20.81,
            'longitude' => -49.37,
            'budget_max' => 200,
            'status' => RequestStatus::Open->value,
            'urgency' => RequestUrgency::Urgent->value,
            'is_test' => $isTest,
        ]);
    }

    public function test_a_real_clients_request_schedules_bot_bids(): void
    {
        Bus::fake();
        $category = $this->category();
        $client = User::factory()->create(['is_client' => true]);

        $this->openRequest($client, $category->id);

        Bus::assertDispatched(ScheduleBotBids::class);
    }

    /**
     * The ordering trap, and the single most important assertion here.
     *
     * is_test is stamped onto the request AFTER RequestService::create() returns,
     * i.e. after the observer has already run — so the observer cannot guard on
     * it and must guard on the client instead. If that guard regresses, bot
     * providers start bidding on bot clients' requests and the provider app's
     * feed fills with closed-loop noise.
     */
    public function test_a_bot_clients_request_does_not_schedule_bot_bids(): void
    {
        Bus::fake();
        $category = $this->category();
        $botClient = User::factory()->create(['is_client' => true, 'is_bot' => true]);

        // Deliberately created with is_test still false, exactly as the real
        // creation path leaves it at the moment the observer fires.
        $this->openRequest($botClient, $category->id, isTest: false);

        Bus::assertNotDispatched(ScheduleBotBids::class);
    }

    public function test_nothing_is_dispatched_when_bots_are_disabled(): void
    {
        Bus::fake();
        config(['bots.enabled' => false]);

        $category = $this->category();
        $client = User::factory()->create(['is_client' => true]);

        $this->openRequest($client, $category->id);

        Bus::assertNotDispatched(ScheduleBotBids::class);
    }

    public function test_schedule_fans_out_one_bid_per_bot_provider_up_to_the_cap(): void
    {
        $category = $this->category();
        $client = User::factory()->create(['is_client' => true]);
        $request = $this->openRequest($client, $category->id);

        foreach (range(1, 5) as $n) {
            $this->botProvider($n, $category->id);
        }

        config(['bots.max_bids_per_request' => 3]);

        Bus::fake();
        (new ScheduleBotBids($request->id))->handle();

        Bus::assertDispatchedTimes(SubmitBotBid::class, 3);
    }

    /**
     * ProposalService::submit() notifies the client on every call — it makes no
     * distinction between a new bid and an edit. So a queue retry of SubmitBotBid
     * would push a second "novo lance" push to a REAL customer unless the job
     * bails on an existing proposal.
     */
    public function test_running_a_bid_twice_notifies_the_client_only_once(): void
    {
        Notification::fake();

        $category = $this->category();
        $client = User::factory()->create(['is_client' => true]);
        $request = $this->openRequest($client, $category->id);
        $provider = $this->botProvider(1, $category->id);

        $job = new SubmitBotBid($request->id, $provider->id);
        $job->handle(app(\App\Services\ProposalService::class), app(\App\Services\MatchingService::class));
        $job->handle(app(\App\Services\ProposalService::class), app(\App\Services\MatchingService::class));

        Notification::assertSentToTimes($client, NewProposalForClient::class, 1);
        $this->assertSame(1, Proposal::where('service_request_id', $request->id)->count());
    }

    public function test_a_bot_bid_is_marked_as_test(): void
    {
        $category = $this->category();
        $client = User::factory()->create(['is_client' => true]);
        $request = $this->openRequest($client, $category->id);
        $provider = $this->botProvider(1, $category->id);

        (new SubmitBotBid($request->id, $provider->id))
            ->handle(app(\App\Services\ProposalService::class), app(\App\Services\MatchingService::class));

        $proposal = Proposal::where('service_request_id', $request->id)->first();

        $this->assertTrue((bool) $proposal->is_test);
        $this->assertStringContainsString('[TESTE]', $proposal->comment);
    }

    /**
     * The customer API hides — and refuses to answer — questions from a provider
     * without a live bid, so the bot must bid first and ask second. If that order
     * ever flips, the question is created but is a silent dead end.
     */
    public function test_the_bots_question_is_visible_to_the_client_after_it_bids(): void
    {
        $category = $this->category();
        $client = User::factory()->create(['is_client' => true]);
        $request = $this->openRequest($client, $category->id);
        $provider = $this->botProvider(1, $category->id);

        // SubmitBotBid chains AskBotQuestion itself; the test queue is sync, so
        // the question already exists by the time handle() returns.
        (new SubmitBotBid($request->id, $provider->id))
            ->handle(app(\App\Services\ProposalService::class), app(\App\Services\MatchingService::class));

        $this->assertSame(1, RequestQuestion::count());

        $token = $client->createToken('client', ['client'])->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/customer/v1/requests/{$request->id}/questions")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_answering_a_bot_question_schedules_a_reaction(): void
    {
        $category = $this->category();
        $client = User::factory()->create(['is_client' => true]);
        $request = $this->openRequest($client, $category->id);
        $provider = $this->botProvider(1, $category->id);

        (new SubmitBotBid($request->id, $provider->id))
            ->handle(app(\App\Services\ProposalService::class), app(\App\Services\MatchingService::class));

        Bus::fake();

        RequestQuestion::first()->update(['answer' => 'Sim', 'answered_at' => now()]);

        Bus::assertDispatched(ReactToBotAnswer::class);
    }

    public function test_answering_a_real_providers_question_schedules_nothing(): void
    {
        $category = $this->category();
        $client = User::factory()->create(['is_client' => true]);
        $request = $this->openRequest($client, $category->id);
        $realProvider = User::factory()->create(['is_provider' => true]); // is_bot false

        $question = $request->questions()->create([
            'provider_id' => $realProvider->id,
            'question' => 'Pergunta real',
        ]);

        Bus::fake();

        $question->update(['answer' => 'Sim', 'answered_at' => now()]);

        Bus::assertNotDispatched(ReactToBotAnswer::class);
    }
}
