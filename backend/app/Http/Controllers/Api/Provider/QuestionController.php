<?php

namespace App\Http\Controllers\Api\Provider;

use App\Enums\RequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\QuestionSuggestionResource;
use App\Http\Resources\RequestQuestionResource;
use App\Models\QuestionSuggestion;
use App\Models\RequestQuestion;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Pre-bid Q&A from the provider's side: ask the client about an open request. */
class QuestionController extends Controller
{
    /** A provider may ask at most this many questions per request. */
    private const MAX_QUESTIONS = 3;

    /** All questions on a request (answers are shared with every bidding provider). */
    public function index(Request $request, ServiceRequest $serviceRequest): AnonymousResourceCollection
    {
        $this->authorizeInCategory($request, $serviceRequest);

        return RequestQuestionResource::collection(
            $serviceRequest->questions()->with('provider')->latest()->get()
        );
    }

    /** Suggested questions for this request's category, localized to the request locale. */
    public function suggestions(Request $request, ServiceRequest $serviceRequest): AnonymousResourceCollection
    {
        $this->authorizeInCategory($request, $serviceRequest);

        return QuestionSuggestionResource::collection(
            $this->suggestionsQuery($serviceRequest)->get()
        );
    }

    /** Provider asks the client a question before bidding. */
    public function store(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        $this->authorizeInCategory($request, $serviceRequest);
        abort_unless($serviceRequest->status === RequestStatus::Open, 422, __('messages.request_not_open'));

        $alreadyAsked = $serviceRequest->questions()->where('provider_id', $request->user()->id)->count();
        abort_if($alreadyAsked >= self::MAX_QUESTIONS, 422, __('messages.max_questions', ['max' => self::MAX_QUESTIONS]));

        $data = $request->validate([
            'suggestion_id' => ['nullable', 'integer', 'exists:question_suggestions,id'],
            'question' => ['required_without:suggestion_id', 'nullable', 'string', 'max:500'],
        ]);

        // A picked suggestion wins: copy its text + image_required (snapshot) and
        // keep the tracking link. Otherwise it's a free-typed question.
        $attributes = ['provider_id' => $request->user()->id, 'image_required' => false];
        if (! empty($data['suggestion_id'])) {
            // Only suggestions valid for this request's category may be used.
            $suggestion = $this->suggestionsQuery($serviceRequest)
                ->whereKey($data['suggestion_id'])
                ->firstOrFail();
            $attributes['suggestion_id'] = $suggestion->id;
            $attributes['question'] = $suggestion->text;
            $attributes['image_required'] = $suggestion->image_required;
        } else {
            $attributes['question'] = $data['question'];
        }

        $question = $serviceRequest->questions()->create($attributes);

        $serviceRequest->client->notify(
            new \App\Notifications\ProviderAskedQuestion($serviceRequest->id, $question->id, $question->question)
        );
        \App\Events\QuestionThreadUpdated::dispatch($serviceRequest->id, $question->id, 'asked');

        return (new RequestQuestionResource($question->load('provider')))
            ->response()->setStatusCode(201);
    }

    /** Provider removes a question they asked (e.g. added it by mistake). */
    public function destroy(Request $request, RequestQuestion $question): JsonResponse
    {
        abort_unless($question->provider_id === $request->user()->id, 403);

        $requestId = $question->service_request_id;
        $questionId = $question->id;
        $question->delete();

        \App\Events\QuestionThreadUpdated::dispatch($requestId, $questionId, 'removed');

        return response()->json(null, 204);
    }

    /**
     * Active suggestions for a request's category in the current locale: the
     * type-level set plus any specific to this exact category, ordered for display.
     */
    private function suggestionsQuery(ServiceRequest $serviceRequest)
    {
        return QuestionSuggestion::query()
            ->active()
            ->where('lang', app()->getLocale())
            ->where('category_type', $serviceRequest->category->type->value)
            ->where(function ($q) use ($serviceRequest) {
                $q->whereNull('service_category_id')
                    ->orWhere('service_category_id', $serviceRequest->service_category_id);
            })
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    /** A provider may only interact with open requests in a category they serve. */
    private function authorizeInCategory(Request $request, ServiceRequest $serviceRequest): void
    {
        $provider = $request->user();
        $allowed = $serviceRequest->accepted_provider_id === $provider->id
            || ($serviceRequest->status === RequestStatus::Open
                && $provider->categories()->where('service_categories.id', $serviceRequest->service_category_id)->exists());

        abort_unless($allowed, 403);
    }
}
