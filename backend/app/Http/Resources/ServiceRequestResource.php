<?php

namespace App\Http\Resources;

use App\Enums\CounterOfferStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id' => $this->id,
            'status' => $this->status,
            'description' => $this->description,
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
            'address' => $this->address,
            'reception_type' => $this->reception_type,
            'entry_code' => $this->when(
                $user && ($user->id === $this->client_id || $user->id === $this->accepted_provider_id),
                fn () => $this->entry_code,
            ),
            // Start-of-service code (C17/P14): only the owner-customer sees it, only
            // while accepted (en route) — never the provider (that would defeat it).
            'start_code' => $this->when(
                $user && $user->id === $this->client_id
                    && $this->status === \App\Enums\RequestStatus::Accepted,
                fn () => $this->start_code,
            ),
            'budget_max' => $this->budget_max !== null ? (float) $this->budget_max : null,
            'payment_method' => $this->payment_method,
            // Derived payment receipt (C20): mirrors RequestService::settleEarnings.
            'settlement' => $this->when(
                $this->accepted_proposal_id !== null,
                fn () => $this->buildSettlement(),
            ),
            'answers' => $this->whenLoaded('answers', fn () => $this->answers->map(fn ($a) => [
                'question_id' => $a->question_id,
                'text' => $a->text,
                'answer' => $a->answer,
            ])->values()),
            'urgency' => $this->urgency,
            'max_wait_minutes' => $this->max_wait_minutes,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'asset' => new AssetResource($this->whenLoaded('asset')),
            'photos' => MediaResource::collection($this->whenLoaded('photos')),
            'before_photos' => MediaResource::collection($this->whenLoaded('beforePhotos')),
            'after_photos' => MediaResource::collection($this->whenLoaded('afterPhotos')),
            'questions' => RequestQuestionResource::collection($this->whenLoaded('questions')),
            'area_avg_price' => $this->when(isset($this->area_avg_price), fn () => round((float) $this->area_avg_price, 2)),
            'proposals_count' => $this->whenCounted('proposals'),
            'accepted_proposal_id' => $this->accepted_proposal_id,
            'accepted_provider_id' => $this->accepted_provider_id,
            'accepted_proposal' => new ProposalResource($this->whenLoaded('acceptedProposal')),
            'my_proposal' => $this->whenLoaded('proposals', function () {
                $p = $this->proposals->first();
                if (! $p) {
                    return null;
                }
                $pendingCounter = $p->relationLoaded('counterOffers')
                    ? $p->counterOffers->firstWhere('status', CounterOfferStatus::Pending)
                    : null;

                return [
                    'id' => $p->id,
                    'price' => (float) $p->price,
                    'eta_minutes' => $p->eta_minutes,
                    'status' => $p->status,
                    'pending_counter_offer' => $pendingCounter ? [
                        'id' => $pendingCounter->id,
                        'price' => (float) $pendingCounter->price,
                        'message' => $pendingCounter->message,
                    ] : null,
                ];
            }),
            'client' => $this->whenLoaded('client', fn () => [
                'id' => $this->client->id,
                'name' => $this->client->name,
                'phone' => $this->client->phone,
                // Uber-passenger-style: shown to providers only, never to the client themselves.
                'rating_avg' => (float) $this->client->rating_avg,
                'rating_count' => (int) $this->client->rating_count,
            ]),
            'provider' => $this->whenLoaded('provider', fn () => [
                'id' => $this->provider->id,
                'name' => $this->provider->name,
                'rating_avg' => (float) optional($this->provider->providerProfile)->rating_avg,
            ]),
            'availabilities' => $this->whenLoaded('availabilities', fn () => $this->availabilities->map(fn ($a) => [
                'starts_at' => $a->starts_at,
                'ends_at' => $a->ends_at,
            ])->values()),
            'job_updates' => JobUpdateResource::collection($this->whenLoaded('jobUpdates')),
            'job_parts' => JobPartResource::collection($this->whenLoaded('jobParts')),
            'surcharges' => SurchargeResource::collection($this->whenLoaded('surcharges')),
            'reschedule_requests' => RescheduleResource::collection($this->whenLoaded('rescheduleRequests')),
            'review' => $this->whenLoaded('review', fn () => $this->review ? [
                'id' => $this->review->id,
                'rating' => $this->review->rating,
                'comment' => $this->review->comment,
                'tags' => $this->review->tags ?? [],
                'tip_amount' => $this->review->tip_amount !== null ? (float) $this->review->tip_amount : null,
            ] : null),
            // The provider's review of the client (the other direction).
            'provider_review' => $this->whenLoaded('providerReview', fn () => $this->providerReview ? [
                'id' => $this->providerReview->id,
                'rating' => $this->providerReview->rating,
                'comment' => $this->providerReview->comment,
                'tags' => $this->providerReview->tags ?? [],
            ] : null),
            // Present only when the haversine query selected a distance_km column.
            'distance_km' => $this->when(isset($this->distance_km), fn () => round((float) $this->distance_km, 2)),
            'parts_approval_requested' => $this->parts_approval_requested_at !== null,
            'parts_approved' => $this->parts_approved_at !== null,
            'created_at' => $this->created_at,
            'accepted_at' => $this->accepted_at,
            'started_at' => $this->started_at,
            'completed_at' => $this->completed_at,
        ];
    }

    /**
     * What the customer owes: labor + provider-supplied parts + approved
     * surcharges. Uses loaded relations when present (no extra queries in lists;
     * the detail endpoint eager-loads jobParts + surcharges for a full receipt).
     * The 3% platform fee is provider-side and intentionally not shown here.
     */
    private function buildSettlement(): array
    {
        $labor = (float) ($this->acceptedProposal?->price ?? 0);
        $parts = $this->relationLoaded('jobParts')
            ? (float) $this->jobParts->sum(fn ($p) => (float) ($p->unit_price ?? 0) * $p->quantity)
            : 0.0;
        $approved = \App\Enums\SurchargeStatus::Approved->value;
        $surcharges = $this->relationLoaded('surcharges')
            ? (float) $this->surcharges->filter(function ($s) use ($approved) {
                $st = $s->status instanceof \BackedEnum ? $s->status->value : $s->status;

                return $st === $approved;
            })->sum('amount')
            : 0.0;

        return [
            'labor' => round($labor, 2),
            'parts_total' => round($parts, 2),
            'surcharges_total' => round($surcharges, 2),
            'total' => round($labor + $parts + $surcharges, 2),
            'payment_method' => $this->payment_method,
            'settled_at' => $this->completed_at,
            'receipt_no' => 'WV-'.str_pad((string) $this->id, 6, '0', STR_PAD_LEFT),
        ];
    }
}
