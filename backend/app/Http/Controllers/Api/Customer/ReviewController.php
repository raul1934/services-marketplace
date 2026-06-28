<?php

namespace App\Http\Controllers\Api\Customer;

use App\Enums\RequestStatus;
use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function __construct(private readonly ReviewService $service) {}

    public function store(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        abort_unless($serviceRequest->client_id === $request->user()->id, 403);
        abort_unless($serviceRequest->status === RequestStatus::Completed, 422, __('messages.review_only_completed'));
        abort_if($serviceRequest->review()->exists(), 422, __('messages.review_already'));

        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:500'],
            'tags' => ['array'],
            'tags.*' => ['string', 'max:40'],
            'tip_amount' => ['nullable', 'numeric', 'min:0', 'max:9999'],
        ]);

        $review = $this->service->create(
            $serviceRequest,
            $data['rating'],
            $data['comment'] ?? null,
            $data['tags'] ?? [],
            isset($data['tip_amount']) ? (float) $data['tip_amount'] : null,
        );

        return response()->json([
            'id' => $review->id,
            'rating' => $review->rating,
            'comment' => $review->comment,
            'tags' => $review->tags ?? [],
            'tip_amount' => $review->tip_amount !== null ? (float) $review->tip_amount : null,
        ], 201);
    }
}
