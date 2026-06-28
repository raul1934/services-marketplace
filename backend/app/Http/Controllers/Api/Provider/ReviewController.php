<?php

namespace App\Http\Controllers\Api\Provider;

use App\Enums\RequestStatus;
use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** The provider's review of the client (the other direction of a review). */
class ReviewController extends Controller
{
    public function store(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        abort_unless($serviceRequest->accepted_provider_id === $request->user()->id, 403);
        abort_unless($serviceRequest->status === RequestStatus::Completed, 422, __('messages.review_only_completed'));
        abort_if($serviceRequest->providerReview()->exists(), 422, __('messages.client_already_reviewed'));

        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:500'],
            'tags' => ['array'],
            'tags.*' => ['string', 'max:40'],
            'preferred' => ['nullable', 'boolean'],
        ]);

        $review = Review::create([
            'service_request_id' => $serviceRequest->id,
            'client_id' => $serviceRequest->client_id,
            'provider_id' => $serviceRequest->accepted_provider_id,
            'author_role' => 'provider',
            'rating' => $data['rating'],
            'comment' => $data['comment'] ?? null,
            'tags' => $data['tags'] ?? null,
        ]);

        // The rate-client screen lets the provider keep this client as preferred.
        if (array_key_exists('preferred', $data)) {
            $relation = $request->user()->preferredClients();
            $data['preferred']
                ? $relation->syncWithoutDetaching([$serviceRequest->client_id])
                : $relation->detach($serviceRequest->client_id);
        }

        // Mutual rating (R-AVALIAÇÃO): tell the client they were rated.
        $serviceRequest->client->notify(new \App\Notifications\YouWereRated($serviceRequest->id, $review->rating, 'provider'));

        return response()->json([
            'id' => $review->id,
            'rating' => $review->rating,
            'comment' => $review->comment,
            'tags' => $review->tags ?? [],
        ], 201);
    }
}
