<?php

namespace App\Http\Controllers\Api\Provider;

use App\Enums\ReceptionType;
use App\Http\Controllers\Controller;
use App\Http\Resources\RescheduleResource;
use App\Models\RescheduleRequest;
use App\Models\ServiceRequest;
use App\Services\RescheduleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Provider requests a reschedule, or responds to the client's request. */
class RescheduleController extends Controller
{
    public function __construct(private readonly RescheduleService $service) {}

    public function store(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        abort_unless($serviceRequest->accepted_provider_id === $request->user()->id, 403);

        $data = $this->validateRequest($request);

        $reschedule = $this->service->request($serviceRequest, $request->user(), 'provider', $data);

        return (new RescheduleResource($reschedule))->response()->setStatusCode(201);
    }

    public function accept(Request $request, RescheduleRequest $rescheduleRequest): JsonResponse
    {
        abort_unless($rescheduleRequest->request->accepted_provider_id === $request->user()->id, 403);

        return response()->json(new RescheduleResource($this->service->accept($rescheduleRequest, $request->user())));
    }

    public function decline(Request $request, RescheduleRequest $rescheduleRequest): JsonResponse
    {
        abort_unless($rescheduleRequest->request->accepted_provider_id === $request->user()->id, 403);

        return response()->json(new RescheduleResource($this->service->decline($rescheduleRequest, $request->user())));
    }

    /** @return array<string,mixed> */
    private function validateRequest(Request $request): array
    {
        $data = $request->validate([
            'proposed_starts_at' => ['nullable', 'date'],
            'proposed_ends_at' => ['nullable', 'date', 'after_or_equal:proposed_starts_at'],
            'proposed_reception_type' => ['nullable', Rule::enum(ReceptionType::class)],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        abort_if(
            empty($data['proposed_starts_at']) && empty($data['proposed_reception_type']),
            422,
            __('messages.reschedule_needs_change'),
        );

        return $data;
    }
}
