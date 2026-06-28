<?php

namespace App\Http\Controllers\Api\Customer;

use App\Enums\RequestStatus;
use App\Enums\WarrantyType;
use App\Http\Controllers\Controller;
use App\Http\Resources\WarrantyResource;
use App\Models\ServiceRequest;
use App\Services\WarrantyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/** Client opens and lists warranty claims on a completed service. */
class WarrantyController extends Controller
{
    public function __construct(private readonly WarrantyService $service) {}

    public function index(Request $request, ServiceRequest $serviceRequest): AnonymousResourceCollection
    {
        abort_unless($serviceRequest->client_id === $request->user()->id, 403);

        return WarrantyResource::collection($serviceRequest->warrantyClaims()->latest()->get());
    }

    public function store(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        abort_unless($serviceRequest->client_id === $request->user()->id, 403);
        abort_unless($serviceRequest->status === RequestStatus::Completed, 422, __('messages.warranty_only_completed'));
        abort_if(
            $serviceRequest->completed_at !== null
                && $serviceRequest->completed_at->copy()->addDays(WarrantyService::WINDOW_DAYS)->isPast(),
            422,
            __('messages.warranty_window_closed'),
        );

        $data = $request->validate([
            'type' => ['required', Rule::enum(WarrantyType::class)],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $claim = $this->service->open(
            $serviceRequest,
            $request->user(),
            WarrantyType::from($data['type']),
            $data['description'] ?? null,
        );

        return (new WarrantyResource($claim))->response()->setStatusCode(201);
    }
}
