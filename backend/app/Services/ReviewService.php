<?php

namespace App\Services;

use App\Models\Review;
use App\Models\ServiceRequest;
use Illuminate\Support\Facades\DB;

class ReviewService
{
    /**
     * Record the client's rating (with optional highlight tags and tip) and
     * roll it into the provider's aggregate.
     *
     * @param  array<int,string>  $tags
     */
    public function create(ServiceRequest $request, int $rating, ?string $comment, array $tags = [], ?float $tip = null): Review
    {
        $review = DB::transaction(function () use ($request, $rating, $comment, $tags, $tip) {
            $review = Review::create([
                'service_request_id' => $request->id,
                'client_id' => $request->client_id,
                'provider_id' => $request->accepted_provider_id,
                'author_role' => 'client',
                'rating' => $rating,
                'comment' => $comment,
                'tags' => $tags ?: null,
                'tip_amount' => $tip,
            ]);

            $profile = $request->provider->providerProfile;
            $newCount = $profile->rating_count + 1;
            $newAvg = (($profile->rating_avg * $profile->rating_count) + $rating) / $newCount;

            $profile->update([
                'rating_avg' => round($newAvg, 2),
                'rating_count' => $newCount,
                'jobs_completed' => $profile->jobs_completed + 1,
            ]);

            return $review;
        });

        // Mutual rating (R-AVALIAÇÃO): tell the provider they were rated.
        $request->provider?->notify(new \App\Notifications\YouWereRated($request->id, $rating, 'client'));

        return $review;
    }
}
