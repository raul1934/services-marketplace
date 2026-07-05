<?php

namespace App\Http\Controllers\Api;

use App\Enums\PartAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\JobPartResource;
use App\Models\JobPart;
use App\Models\ServiceRequest;
use App\Services\JobPartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class JobPartController extends Controller
{
    public function __construct(private readonly JobPartService $service) {}

    public function index(Request $request, ServiceRequest $serviceRequest): AnonymousResourceCollection
    {
        $uid = $request->user()->id;
        abort_unless($serviceRequest->client_id === $uid || $serviceRequest->accepted_provider_id === $uid, 403);

        return JobPartResource::collection($serviceRequest->jobParts()->latest()->get());
    }

    public function store(Request $request, ServiceRequest $serviceRequest): JobPartResource
    {
        abort_unless($serviceRequest->accepted_provider_id === $request->user()->id, 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'action' => ['required', Rule::enum(PartAction::class)],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        return new JobPartResource($this->service->add($serviceRequest, $data));
    }

    public function destroy(Request $request, JobPart $jobPart): JsonResponse
    {
        abort_unless($jobPart->request->accepted_provider_id === $request->user()->id, 403);
        $this->service->remove($jobPart);

        return response()->json(['ok' => true]);
    }

    /** Client approves a single part (in addition to the request-level "approve all"). */
    public function approve(Request $request, JobPart $jobPart): JobPartResource
    {
        abort_unless($jobPart->request->client_id === $request->user()->id, 403);

        if ($jobPart->approved_at === null) {
            $jobPart->update(['approved_at' => now()]);
        }

        return new JobPartResource($jobPart);
    }
}
