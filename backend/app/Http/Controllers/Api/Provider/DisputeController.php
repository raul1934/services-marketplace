<?php

namespace App\Http\Controllers\Api\Provider;

use App\Http\Controllers\Controller;
use App\Http\Resources\DisputeResource;
use App\Models\Dispute;
use App\Models\ServiceRequest;
use App\Services\DisputeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Provider reads a dispute and files their defense (R5). */
class DisputeController extends Controller
{
    public function __construct(private readonly DisputeService $service) {}

    public function show(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        abort_unless($serviceRequest->accepted_provider_id === $request->user()->id, 403);
        $dispute = $serviceRequest->dispute()->with('evidence.media')->first();
        abort_unless($dispute, 404);

        return response()->json(new DisputeResource($dispute));
    }

    public function defense(Request $request, Dispute $dispute): JsonResponse
    {
        abort_unless($dispute->request->accepted_provider_id === $request->user()->id, 403);
        abort_if($dispute->status === \App\Enums\DisputeStatus::Resolved, 422, __('messages.dispute_closed'));

        $data = $request->validate([
            'text' => ['nullable', 'string', 'max:2000'],
            'photos' => ['nullable', 'array', 'max:5'],
            'photos.*' => ['image', 'max:5120'],
        ]);

        $paths = [];
        foreach ((array) $request->file('photos') as $file) {
            $paths[] = $file->store("requests/{$dispute->service_request_id}/disputes", 'public');
        }

        $dispute = $this->service->fileDefense($dispute, $request->user(), $data['text'] ?? null, $paths);

        return response()->json(new DisputeResource($dispute->load('evidence.media')));
    }
}
