<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\RequestQuestionResource;
use App\Models\RequestQuestion;
use App\Models\ServiceRequest;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Pre-bid Q&A from the client's side: read and answer providers' questions. */
class QuestionController extends Controller
{
    public function __construct(private readonly MediaService $media) {}

    public function index(Request $request, ServiceRequest $serviceRequest): AnonymousResourceCollection
    {
        abort_unless($serviceRequest->client_id === $request->user()->id, 403);

        return RequestQuestionResource::collection(
            $serviceRequest->questions()->with(['provider', 'answerPhotos'])->latest()->get()
        );
    }

    /** Client answers a provider's question, optionally with uploaded photo ids. */
    public function answer(Request $request, RequestQuestion $question): JsonResponse
    {
        abort_unless($question->request->client_id === $request->user()->id, 403);

        $data = $request->validate([
            'answer' => ['required', 'string', 'max:500'],
            'media_ids' => ['nullable', 'array', 'max:5'],
            'media_ids.*' => ['integer'],
        ]);

        $question->update([
            'answer' => $data['answer'],
            'answered_at' => now(),
        ]);

        if (! empty($data['media_ids'])) {
            $this->media->attach($data['media_ids'], $question, 'answer', $request->user()->id);
        }

        $question->provider->notify(
            new \App\Notifications\ClientAnsweredQuestion($question->service_request_id, $question->id, $data['answer'])
        );
        \App\Events\QuestionThreadUpdated::dispatch($question->service_request_id, $question->id, 'answered');

        return response()->json(new RequestQuestionResource($question->fresh()->load(['provider', 'answerPhotos'])));
    }
}
