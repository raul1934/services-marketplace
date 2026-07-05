<?php

namespace App\Http\Controllers\Api\Provider;

use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProposalResource;
use App\Http\Resources\ServiceRequestResource;
use App\Models\Proposal;
use App\Models\ServiceRequest;
use App\Services\ProposalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProposalController extends Controller
{
    public function __construct(private readonly ProposalService $service) {}

    /** Provider submits a bid on an open request. */
    public function store(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        abort_unless($serviceRequest->status === RequestStatus::Open, 422, __('messages.request_not_open'));

        $data = $request->validate([
            'price' => ['required', 'numeric', 'min:0.01'],
            'eta_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'comment' => ['nullable', 'string', 'max:500'],
            'deposit_required' => ['nullable', 'boolean'],
            'deposit_percentage' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $proposal = $this->service->submit($serviceRequest, $request->user(), $data);

        return (new ProposalResource($proposal->load('provider.providerProfile')))
            ->response()->setStatusCode(201);
    }

    /** Open requests the provider has bid on, awaiting the client's decision. */
    public function bids(Request $request): AnonymousResourceCollection
    {
        $providerId = $request->user()->id;
        // Withdrawn/Declined bids are no longer "awaiting a decision" — drop them.
        $liveStatuses = [ProposalStatus::Withdrawn->value, ProposalStatus::Declined->value];

        $requests = ServiceRequest::where('status', RequestStatus::Open->value)
            ->whereHas('proposals', fn ($q) => $q->where('provider_id', $providerId)->whereNotIn('status', $liveStatuses))
            ->with([
                'category',
                'availabilities',
                'proposals' => fn ($q) => $q->where('provider_id', $providerId),
            ])
            ->latest()
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return ServiceRequestResource::collection($requests);
    }

    /** Provider withdraws their own pending bid. */
    public function withdraw(Request $request, Proposal $proposal): JsonResponse
    {
        abort_unless($proposal->provider_id === $request->user()->id, 403);
        abort_unless($proposal->status === ProposalStatus::Pending, 422, __('messages.proposal_not_pending'));

        $this->service->withdraw($proposal);

        return response()->json(['ok' => true]);
    }
}
