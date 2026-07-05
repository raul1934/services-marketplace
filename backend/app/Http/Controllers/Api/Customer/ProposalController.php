<?php

namespace App\Http\Controllers\Api\Customer;

use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProposalResource;
use App\Http\Resources\ServiceRequestResource;
use App\Models\Proposal;
use App\Models\ServiceRequest;
use App\Services\CounterOfferService;
use App\Services\ProposalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProposalController extends Controller
{
    public function __construct(
        private readonly ProposalService $service,
        private readonly CounterOfferService $counterOffers,
    ) {}

    /** Client lists the proposals on their request. */
    public function index(Request $request, ServiceRequest $serviceRequest): AnonymousResourceCollection
    {
        abort_unless($serviceRequest->client_id === $request->user()->id, 403);

        // Withdrawn (provider pulled it) and Declined (client dismissed it) bids
        // are no longer "active" — keep them out of the picker.
        $query = $serviceRequest->proposals()
            ->whereNotIn('status', [ProposalStatus::Withdrawn->value, ProposalStatus::Declined->value])
            ->with(['provider.providerProfile', 'counterOffers']);

        $query = match ($request->query('sort', 'price')) {
            'eta' => $query->orderBy('eta_minutes'),
            'rating' => $query
                ->leftJoin('provider_profiles', 'provider_profiles.user_id', '=', 'proposals.provider_id')
                ->orderByDesc('provider_profiles.rating_avg')
                ->select('proposals.*'),
            default => $query->orderBy('price'),
        };

        return ProposalResource::collection($query->paginate($this->perPage($request)));
    }

    /** Client accepts a proposal. */
    public function accept(Request $request, Proposal $proposal): ServiceRequestResource
    {
        $serviceRequest = $proposal->request;
        abort_unless($serviceRequest->client_id === $request->user()->id, 403);
        abort_unless($serviceRequest->status === RequestStatus::Open, 422, __('messages.request_not_open'));

        $updated = $this->service->accept($proposal);

        return new ServiceRequestResource(
            $updated->load(['category', 'provider.providerProfile', 'acceptedProposal'])
        );
    }

    /** Client dismisses a single proposal without accepting another. */
    public function decline(Request $request, Proposal $proposal): JsonResponse
    {
        $serviceRequest = $proposal->request;
        abort_unless($serviceRequest->client_id === $request->user()->id, 403);
        abort_unless($proposal->status === ProposalStatus::Pending, 422, __('messages.proposal_not_pending'));

        $this->service->decline($proposal);

        return response()->json(['ok' => true]);
    }

    /** Client proposes a different price back to the provider. */
    public function counter(Request $request, Proposal $proposal): JsonResponse
    {
        $serviceRequest = $proposal->request;
        abort_unless($serviceRequest->client_id === $request->user()->id, 403);
        abort_unless($proposal->status === ProposalStatus::Pending, 422, __('messages.proposal_not_pending'));

        $data = $request->validate([
            'price' => ['required', 'numeric', 'min:0.01'],
            'message' => ['nullable', 'string', 'max:255'],
        ]);

        $counter = $this->counterOffers->propose($proposal, (float) $data['price'], $data['message'] ?? null);

        return response()->json(['id' => $counter->id, 'price' => (float) $counter->price], 201);
    }
}
