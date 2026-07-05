<?php

namespace App\Http\Controllers\Api\Provider;

use App\Enums\RequestStatus;
use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** The provider's review of the client (the other direction of a review). */
class ReviewController extends Controller
{
    public function __construct(private readonly ReviewService $service) {}

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

        $review = $this->service->createClientReview(
            $serviceRequest,
            $request->user(),
            $data['rating'],
            $data['comment'] ?? null,
            $data['tags'] ?? [],
            array_key_exists('preferred', $data) ? (bool) $data['preferred'] : null,
        );

        return response()->json([
            'id' => $review->id,
            'rating' => $review->rating,
            'comment' => $review->comment,
            'tags' => $review->tags ?? [],
        ], 201);
    }
}
