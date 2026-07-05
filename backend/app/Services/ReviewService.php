<?php

namespace App\Services;

use App\Models\Review;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Notifications\YouWereRated;
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

            // A tip is a real payout, not just a review field — credit it like
            // settleEarnings() credits the job itself. The review's own unique
            // constraint on (service_request_id, author_role) already keeps
            // this from ever firing twice for the same request.
            if ($tip !== null && $tip > 0) {
                WalletTransaction::create([
                    'provider_id' => $request->accepted_provider_id,
                    'market_id' => $request->market_id,
                    'type' => WalletTransaction::TYPE_CREDIT,
                    'amount' => $tip,
                    'description' => 'Gorjeta',
                    'service_request_id' => $request->id,
                ]);
            }

            return $review;
        });

        // Mutual rating (R-AVALIAÇÃO): tell the provider they were rated.
        $request->provider?->notify(new YouWereRated($request->id, $rating, 'client'));

        return $review;
    }

    /**
     * Record the provider's rating of the client (the other direction).
     * Surfaced to providers only (Uber-passenger-style) — the client never
     * sees their own rating, matching the existing preferred-clients asymmetry.
     *
     * @param  array<int,string>  $tags
     */
    public function createClientReview(
        ServiceRequest $request,
        User $provider,
        int $rating,
        ?string $comment,
        array $tags = [],
        ?bool $preferred = null,
    ): Review {
        $review = DB::transaction(function () use ($request, $rating, $comment, $tags) {
            $review = Review::create([
                'service_request_id' => $request->id,
                'client_id' => $request->client_id,
                'provider_id' => $request->accepted_provider_id,
                'author_role' => 'provider',
                'rating' => $rating,
                'comment' => $comment,
                'tags' => $tags ?: null,
            ]);

            $client = $request->client;
            $newCount = $client->rating_count + 1;
            $newAvg = (($client->rating_avg * $client->rating_count) + $rating) / $newCount;

            $client->update([
                'rating_avg' => round($newAvg, 2),
                'rating_count' => $newCount,
            ]);

            return $review;
        });

        // The rate-client screen lets the provider keep this client as preferred.
        if ($preferred !== null) {
            $relation = $provider->preferredClients();
            $preferred
                ? $relation->syncWithoutDetaching([$request->client_id])
                : $relation->detach($request->client_id);
        }

        // Mutual rating (R-AVALIAÇÃO): tell the client they were rated.
        $request->client->notify(new YouWereRated($request->id, $rating, 'provider'));

        return $review;
    }
}
