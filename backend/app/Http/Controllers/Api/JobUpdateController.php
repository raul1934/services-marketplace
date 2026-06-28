<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\JobUpdateResource;
use App\Models\ServiceRequest;
use App\Services\JobUpdateService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class JobUpdateController extends Controller
{
    public function __construct(private readonly JobUpdateService $service) {}

    /** Client or provider of the request can view the timeline. */
    public function index(Request $request, ServiceRequest $serviceRequest): AnonymousResourceCollection
    {
        $this->authorizeParticipant($request, $serviceRequest);

        return JobUpdateResource::collection(
            $serviceRequest->jobUpdates()->with('media')->latest()->get()
        );
    }

    /** Only the assigned provider adds updates, during the job. */
    public function store(Request $request, ServiceRequest $serviceRequest): JobUpdateResource
    {
        abort_unless($serviceRequest->accepted_provider_id === $request->user()->id, 403);

        $request->validate([
            'body' => ['nullable', 'string', 'max:1000'],
            'photo' => ['nullable', 'image', 'max:5120'],
        ]);

        $update = $this->service->add(
            $serviceRequest,
            $request->user(),
            $request->input('body'),
            $request->file('photo'),
        );

        return new JobUpdateResource($update);
    }

    private function authorizeParticipant(Request $request, ServiceRequest $serviceRequest): void
    {
        $uid = $request->user()->id;
        abort_unless(
            $serviceRequest->client_id === $uid || $serviceRequest->accepted_provider_id === $uid,
            403,
        );
    }
}
