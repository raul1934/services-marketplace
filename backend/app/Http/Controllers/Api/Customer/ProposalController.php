<?php

namespace App\Http\Controllers\Api\Customer;

use App\Enums\RequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProposalResource;
use App\Http\Resources\ServiceRequestResource;
use App\Models\Proposal;
use App\Models\ServiceRequest;
use App\Services\ProposalService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProposalController extends Controller
{
    public function __construct(private readonly ProposalService $service) {}

    /** Client lists the proposals on their request. */
    public function index(Request $request, ServiceRequest $serviceRequest): AnonymousResourceCollection
    {
        abort_unless($serviceRequest->client_id === $request->user()->id, 403);

        $query = $serviceRequest->proposals()->with('provider.providerProfile');

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
}
