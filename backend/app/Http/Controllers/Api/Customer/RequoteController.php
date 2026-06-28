<?php

namespace App\Http\Controllers\Api\Customer;

use App\Enums\RequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceRequestResource;
use App\Models\ServiceRequest;
use App\Services\RequoteService;
use Illuminate\Http\Request;

/** Client decides on a mandatory re-quote (C40): accept the new quote or reopen. */
class RequoteController extends Controller
{
    public function __construct(private readonly RequoteService $service) {}

    public function accept(Request $request, ServiceRequest $serviceRequest): ServiceRequestResource
    {
        $this->authorizeRequote($request, $serviceRequest);

        return new ServiceRequestResource(
            $this->service->accept($serviceRequest)->load(['category', 'provider', 'surcharges.provider'])
        );
    }

    public function reopen(Request $request, ServiceRequest $serviceRequest): ServiceRequestResource
    {
        $this->authorizeRequote($request, $serviceRequest);
        $data = $request->validate(['description' => ['nullable', 'string', 'max:1000']]);

        return new ServiceRequestResource(
            $this->service->reopen($serviceRequest, $data['description'] ?? null)->load(['category'])
        );
    }

    private function authorizeRequote(Request $request, ServiceRequest $serviceRequest): void
    {
        abort_unless($serviceRequest->client_id === $request->user()->id, 403);
        abort_unless($serviceRequest->status === RequestStatus::Requote, 422, __('messages.request_not_in_requote'));
    }
}
