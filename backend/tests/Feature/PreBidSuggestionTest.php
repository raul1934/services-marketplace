<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\QuestionSuggestion;
use App\Models\RequestQuestion;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PreBidSuggestionTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: ServiceRequest, 1: User, 2: User, 3: ServiceCategory} */
    private function makeOpenRequest(): array
    {
        $client = User::factory()->create();
        $provider = User::factory()->create();
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.$client->id, 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);
        $provider->categories()->attach($category->id); // provider serves this category
        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
            'description' => 'test',
            'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Open->value,
        ]);

        return [$request->fresh(), $client, $provider, $category];
    }

    /** A real (tiny) PNG so the `image` validation rule passes without the GD extension. */
    private function pngFile(string $name = 'a.png'): UploadedFile
    {
        $chunk = static fn (string $type, string $data): string => pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));
        $size = 8;
        $ihdr = pack('N', $size).pack('N', $size)."\x08\x02\x00\x00\x00";
        $raw = str_repeat("\x00".str_repeat("\x33\x66\x99", $size), $size);
        $png = "\x89PNG\r\n\x1a\n".$chunk('IHDR', $ihdr).$chunk('IDAT', gzcompress($raw, 9)).$chunk('IEND', '');

        return UploadedFile::fake()->createWithContent($name, $png);
    }

    private function seedSuggestion(string $lang, string $text, bool $imageRequired = false, string $key = 'photo'): QuestionSuggestion
    {
        return QuestionSuggestion::create([
            'category_type' => 'roadside', 'service_category_id' => null,
            'key' => $key, 'lang' => $lang, 'text' => $text,
            'image_required' => $imageRequired, 'sort_order' => 10, 'is_active' => true,
        ]);
    }

    public function test_suggestions_are_returned_for_the_request_locale(): void
    {
        [$request, , $provider] = $this->makeOpenRequest();
        $this->seedSuggestion('pt', 'Qual o modelo?', false, 'model');
        $this->seedSuggestion('en', 'What model?', false, 'model');

        Sanctum::actingAs($provider, ['provider']);

        $res = $this->withHeader('X-Locale', 'pt')
            ->getJson("/api/provider/v1/requests/{$request->id}/question-suggestions");

        $res->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.text', 'Qual o modelo?');
    }

    public function test_store_copies_suggestion_text_and_image_required_and_links_for_tracking(): void
    {
        Notification::fake();
        [$request, , $provider] = $this->makeOpenRequest();
        $suggestion = $this->seedSuggestion('pt', 'Pode enviar uma foto?', true);

        Sanctum::actingAs($provider, ['provider']);

        $res = $this->withHeader('X-Locale', 'pt')
            ->postJson("/api/provider/v1/requests/{$request->id}/questions", ['suggestion_id' => $suggestion->id]);

        $res->assertCreated()
            ->assertJsonPath('data.question', 'Pode enviar uma foto?')
            ->assertJsonPath('data.image_required', true)
            ->assertJsonPath('data.suggestion_id', $suggestion->id);

        $this->assertDatabaseHas('request_questions', [
            'service_request_id' => $request->id,
            'suggestion_id' => $suggestion->id,
            'question' => 'Pode enviar uma foto?',
            'image_required' => true,
        ]);
    }

    public function test_store_accepts_a_custom_question_without_a_suggestion(): void
    {
        Notification::fake();
        [$request, , $provider] = $this->makeOpenRequest();

        Sanctum::actingAs($provider, ['provider']);

        $this->postJson("/api/provider/v1/requests/{$request->id}/questions", ['question' => 'Custom?'])
            ->assertCreated()
            ->assertJsonPath('data.question', 'Custom?')
            ->assertJsonPath('data.image_required', false)
            ->assertJsonPath('data.suggestion_id', null);
    }

    public function test_provider_is_limited_to_three_questions_per_request(): void
    {
        Notification::fake();
        [$request, , $provider] = $this->makeOpenRequest();

        Sanctum::actingAs($provider, ['provider']);

        for ($i = 1; $i <= 3; $i++) {
            $this->postJson("/api/provider/v1/requests/{$request->id}/questions", ['question' => "Q{$i}?"])
                ->assertCreated();
        }
        // The 4th is rejected.
        $this->postJson("/api/provider/v1/requests/{$request->id}/questions", ['question' => 'Q4?'])
            ->assertStatus(422);

        $this->assertSame(3, RequestQuestion::where('service_request_id', $request->id)->count());
    }

    public function test_provider_can_remove_own_question_but_not_anothers(): void
    {
        Notification::fake();
        [$request, , $provider] = $this->makeOpenRequest();
        $mine = RequestQuestion::create([
            'service_request_id' => $request->id, 'provider_id' => $provider->id, 'question' => 'Mine?',
        ]);
        $other = User::factory()->create();
        $theirs = RequestQuestion::create([
            'service_request_id' => $request->id, 'provider_id' => $other->id, 'question' => 'Theirs?',
        ]);

        Sanctum::actingAs($provider, ['provider']);

        $this->deleteJson("/api/provider/v1/questions/{$theirs->id}")->assertStatus(403);
        $this->deleteJson("/api/provider/v1/questions/{$mine->id}")->assertNoContent();

        $this->assertDatabaseMissing('request_questions', ['id' => $mine->id]);
        $this->assertDatabaseHas('request_questions', ['id' => $theirs->id]);
    }

    public function test_client_can_attach_a_photo_to_an_answer(): void
    {
        Notification::fake();
        Storage::fake('public');
        [$request, $client, $provider] = $this->makeOpenRequest();
        $question = RequestQuestion::create([
            'service_request_id' => $request->id,
            'provider_id' => $provider->id,
            'question' => 'Pode enviar uma foto?',
            'image_required' => true,
        ]);

        Sanctum::actingAs($client, ['client']);

        // Upload-first: upload the photo, then answer with its media id.
        $mediaId = $this->post('/api/customer/v1/uploads', ['photos' => [$this->pngFile('answer.png')]], ['Accept' => 'application/json'])
            ->assertOk()->json('data.0.id');

        $res = $this->postJson("/api/customer/v1/questions/{$question->id}/answer", [
            'answer' => 'Aqui',
            'media_ids' => [$mediaId],
        ]);

        $res->assertOk()->assertJsonPath('answer', 'Aqui')->assertJsonCount(1, 'answer_photos');
        $this->assertDatabaseHas('media', [
            'mediable_type' => RequestQuestion::class,
            'mediable_id' => $question->id,
            'tag' => 'answer',
        ]);
    }
}
