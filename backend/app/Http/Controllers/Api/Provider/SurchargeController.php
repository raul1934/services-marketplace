<?php

namespace App\Http\Controllers\Api\Provider;

use App\Enums\RequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\SurchargeResource;
use App\Models\ServiceRequest;
use App\Services\SurchargeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Provider composes a surcharge (acréscimo) on their active job. */
class SurchargeController extends Controller
{
    public function __construct(private readonly SurchargeService $service) {}

    public function store(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        abort_unless($serviceRequest->accepted_provider_id === $request->user()->id, 403);
        abort_unless(
            in_array($serviceRequest->status, [RequestStatus::Accepted, RequestStatus::InProgress], true),
            422,
            __('messages.request_not_active'),
        );

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['required', 'string', 'max:1000'],
            // A reason photo is mandatory (R-ACRÉSCIMO).
            'photos' => ['required', 'array', 'min:1', 'max:5'],
            'photos.*' => ['image', 'max:5120'],
        ]);

        $paths = [];
        foreach ($request->file('photos') as $file) {
            $paths[] = $file->store("requests/{$serviceRequest->id}/surcharges", 'public');
        }

        $surcharge = $this->service->propose($serviceRequest, $request->user(), [
            'amount' => (float) $data['amount'],
            'reason' => $data['reason'],
            'photos' => $paths,
        ]);

        return (new SurchargeResource($surcharge->load('provider')))
            ->response()->setStatusCode(201);
    }
}
