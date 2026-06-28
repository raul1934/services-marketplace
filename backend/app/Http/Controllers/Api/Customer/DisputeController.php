<?php

namespace App\Http\Controllers\Api\Customer;

use App\Enums\RequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\DisputeResource;
use App\Models\ServiceRequest;
use App\Services\DisputeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Client opens a dispute and reads its status. */
class DisputeController extends Controller
{
    public function __construct(private readonly DisputeService $service) {}

    public function store(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        abort_unless($serviceRequest->client_id === $request->user()->id, 403);
        // Disputes apply once a provider was engaged.
        abort_if(
            in_array($serviceRequest->status, [RequestStatus::Open, RequestStatus::Cancelled, RequestStatus::Expired], true),
            422,
            __('messages.dispute_not_allowed'),
        );
        abort_if(
            $serviceRequest->disputes()->whereIn('status', ['open', 'under_review'])->exists(),
            422,
            __('messages.dispute_already_open'),
        );

        $data = $request->validate([
            'claim' => ['required', 'string', 'max:2000'],
            'photos' => ['nullable', 'array', 'max:5'],
            'photos.*' => ['image', 'max:5120'],
        ]);

        $paths = [];
        foreach ((array) $request->file('photos') as $file) {
            $paths[] = $file->store("requests/{$serviceRequest->id}/disputes", 'public');
        }

        $dispute = $this->service->open($serviceRequest, $request->user(), $data['claim'], $paths);

        return (new DisputeResource($dispute->load('evidence.media')))->response()->setStatusCode(201);
    }

    public function show(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        abort_unless($serviceRequest->client_id === $request->user()->id, 403);
        $dispute = $serviceRequest->dispute()->with('evidence.media')->first();
        abort_unless($dispute, 404);

        return response()->json(new DisputeResource($dispute));
    }
}
