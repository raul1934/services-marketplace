<?php

namespace App\Http\Controllers\Api\Provider;

use App\Enums\CounterOfferStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProposalResource;
use App\Models\ProposalCounterOffer;
use App\Services\CounterOfferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CounterOfferController extends Controller
{
    public function __construct(private readonly CounterOfferService $service) {}

    public function accept(Request $request, ProposalCounterOffer $counterOffer): ProposalResource
    {
        $this->authorizeOwner($request, $counterOffer);

        $proposal = $this->service->accept($counterOffer);

        return new ProposalResource($proposal->load('provider.providerProfile'));
    }

    public function decline(Request $request, ProposalCounterOffer $counterOffer): JsonResponse
    {
        $this->authorizeOwner($request, $counterOffer);

        $this->service->decline($counterOffer);

        return response()->json(['ok' => true]);
    }

    private function authorizeOwner(Request $request, ProposalCounterOffer $counterOffer): void
    {
        abort_unless($counterOffer->proposal->provider_id === $request->user()->id, 403);
        abort_unless($counterOffer->status === CounterOfferStatus::Pending, 422, __('messages.counter_offer_not_pending'));
    }
}
