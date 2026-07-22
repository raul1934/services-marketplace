<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\QuestionSuggestion;
use App\Models\RequestQuestion;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * A question is read by someone other than the person who asked it, and the two
 * do not necessarily speak the same language.
 *
 * `question_suggestions` stores one row per language, and the provider's picker
 * filters by the provider's locale — so asking used to snapshot the provider's
 * language onto the request, and a customer running the app in Portuguese read
 * "Is the transmission automatic or manual?".
 */
class QuestionLocaleTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: ServiceRequest, 1: User, 2: User, 3: ServiceCategory} */
    private function scenario(): array
    {
        $client = User::factory()->create();
        $provider = User::factory()->create();
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.$client->id, 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);
        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
            'description' => 'carro nao liga',
            'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Open->value,
        ]);

        return [$request->fresh(), $client, $provider, $category];
    }

    /** The same question, seeded once per language, as the provider's picker has it. */
    private function seedSuggestionPair(): QuestionSuggestion
    {
        $en = QuestionSuggestion::create([
            'category_type' => 'roadside', 'key' => 'transmission', 'lang' => 'en',
            'text' => 'Is the transmission automatic or manual?', 'sort_order' => 1, 'is_active' => true,
        ]);
        QuestionSuggestion::create([
            'category_type' => 'roadside', 'key' => 'transmission', 'lang' => 'pt',
            'text' => 'O câmbio é automático ou manual?', 'sort_order' => 1, 'is_active' => true,
        ]);

        return $en;
    }

    public function test_a_question_asked_in_english_reads_in_portuguese_for_the_client(): void
    {
        [$request, $client, $provider] = $this->scenario();
        $en = $this->seedSuggestionPair();

        // The provider picked from an English picker, so the snapshot is English.
        RequestQuestion::create([
            'service_request_id' => $request->id,
            'provider_id' => $provider->id,
            'suggestion_id' => $en->id,
            'question' => $en->text,
        ]);

        Sanctum::actingAs($client, ['client']);

        $res = $this->getJson("/api/customer/v1/requests/{$request->id}", ['X-Locale' => 'pt'])->assertOk();

        $this->assertSame('O câmbio é automático ou manual?', $res->json('data.questions.0.question'));
    }

    public function test_the_same_question_still_reads_in_english_for_an_english_client(): void
    {
        [$request, $client, $provider] = $this->scenario();
        $en = $this->seedSuggestionPair();

        RequestQuestion::create([
            'service_request_id' => $request->id,
            'provider_id' => $provider->id,
            'suggestion_id' => $en->id,
            'question' => $en->text,
        ]);

        Sanctum::actingAs($client, ['client']);

        $res = $this->getJson("/api/customer/v1/requests/{$request->id}", ['X-Locale' => 'en'])->assertOk();

        $this->assertSame('Is the transmission automatic or manual?', $res->json('data.questions.0.question'));
    }

    public function test_a_free_typed_question_is_never_rewritten(): void
    {
        [$request, $client, $provider] = $this->scenario();

        RequestQuestion::create([
            'service_request_id' => $request->id,
            'provider_id' => $provider->id,
            'question' => 'O carro está em uma vaga apertada?',
        ]);

        Sanctum::actingAs($client, ['client']);

        // No suggestion behind it, so there is nothing to translate to — and
        // guessing would put words in the provider's mouth.
        $res = $this->getJson("/api/customer/v1/requests/{$request->id}", ['X-Locale' => 'en'])->assertOk();

        $this->assertSame('O carro está em uma vaga apertada?', $res->json('data.questions.0.question'));
    }

    public function test_it_falls_back_to_the_snapshot_when_the_sibling_is_missing(): void
    {
        [$request, $client, $provider] = $this->scenario();
        $only = QuestionSuggestion::create([
            'category_type' => 'roadside', 'key' => 'winch', 'lang' => 'en',
            'text' => 'Do you need a winch?', 'sort_order' => 1, 'is_active' => true,
        ]);

        RequestQuestion::create([
            'service_request_id' => $request->id,
            'provider_id' => $provider->id,
            'suggestion_id' => $only->id,
            'question' => $only->text,
        ]);

        Sanctum::actingAs($client, ['client']);

        $res = $this->getJson("/api/customer/v1/requests/{$request->id}", ['X-Locale' => 'pt'])->assertOk();

        $this->assertSame('Do you need a winch?', $res->json('data.questions.0.question'));
    }
}
