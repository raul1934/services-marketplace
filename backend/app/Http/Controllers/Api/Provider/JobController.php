<?php

namespace App\Http\Controllers\Api\Provider;

use App\Enums\PhotoPhase;
use App\Enums\RequestStatus;
use App\Enums\RequestUrgency;
use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceRequestResource;
use App\Models\ServiceRequest;
use App\Services\MediaService;
use App\Services\RequestService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class JobController extends Controller
{
    public function __construct(
        private readonly RequestService $service,
        private readonly MediaService $media,
    ) {}

    /** Attach uploaded before/after photos (by media id) to the job. */
    public function jobMedia(Request $request, ServiceRequest $serviceRequest): ServiceRequestResource
    {
        abort_unless($serviceRequest->accepted_provider_id === $request->user()->id, 403);

        $data = $request->validate([
            'phase' => ['required', Rule::in([PhotoPhase::Before->value, PhotoPhase::After->value])],
            'media_ids' => ['required', 'array', 'min:1', 'max:10'],
            'media_ids.*' => ['integer'],
        ]);

        $this->media->attach($data['media_ids'], $serviceRequest, $data['phase'], $request->user()->id);

        return new ServiceRequestResource($serviceRequest->fresh()->load(['beforePhotos', 'afterPhotos']));
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        // `?status=active` returns only live jobs (accepted + in_progress) so
        // callers like the dashboard/agenda get the full set in one page,
        // instead of missing active jobs that paginate behind completed ones.
        $statuses = $request->query('status') === 'active'
            ? [RequestStatus::Accepted->value, RequestStatus::InProgress->value]
            : [RequestStatus::Accepted->value, RequestStatus::InProgress->value, RequestStatus::Completed->value];

        $jobs = ServiceRequest::where('accepted_provider_id', $request->user()->id)
            ->whereIn('status', $statuses)
            ->with(['category', 'client', 'acceptedProposal', 'availabilities'])
            ->latest('accepted_at')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return ServiceRequestResource::collection($jobs);
    }

    /** Provider views a single request: their job, or an open one in their categories. */
    public function show(Request $request, ServiceRequest $serviceRequest): ServiceRequestResource
    {
        $provider = $request->user();
        $isMine = $serviceRequest->accepted_provider_id === $provider->id;
        $isOpenInMyCategory = $serviceRequest->status === RequestStatus::Open
            && $provider->categories()->where('service_categories.id', $serviceRequest->service_category_id)->exists();

        abort_unless($isMine || $isOpenInMyCategory, 403);

        return new ServiceRequestResource(
            $serviceRequest->load([
                'category', 'asset', 'asset.detailable', 'client', 'photos', 'beforePhotos', 'afterPhotos',
                'acceptedProposal', 'availabilities', 'questions.provider', 'questions.suggestion', 'answers',
                'surcharges.provider', 'surcharges.media', 'rescheduleRequests', 'providerReview',
                // The provider's own bid, so `my_proposal` reflects the "já enviei" state.
                'proposals' => fn ($q) => $q->where('provider_id', $provider->id),
                'proposals.counterOffers',
            ])
        );
    }

    /** Provider asks the client to approve the running total (labor + parts). */
    public function requestApproval(Request $request, ServiceRequest $serviceRequest): ServiceRequestResource
    {
        abort_unless($serviceRequest->accepted_provider_id === $request->user()->id, 403);
        abort_unless($serviceRequest->status === RequestStatus::InProgress, 422, __('messages.request_not_active'));

        $labor = (float) ($serviceRequest->acceptedProposal?->price ?? 0);
        $parts = $serviceRequest->jobParts()->get()->sum(fn ($p) => (float) ($p->unit_price ?? 0) * $p->quantity);
        $total = $labor + $parts;

        $serviceRequest->update(['parts_approval_requested_at' => now(), 'parts_approved_at' => null]);
        $serviceRequest->client->notify(new \App\Notifications\PartsApprovalRequested($serviceRequest->id, $total));
        \App\Events\PartsApprovalRequested::dispatch($serviceRequest->id, $total);

        return new ServiceRequestResource($serviceRequest->fresh()->load(['category', 'client']));
    }

    /**
     * Start-of-service code verification (C17/P14). Optional: the provider may
     * also start via the plain status update. When a code is supplied it must
     * match the request's `start_code` before the job moves to in_progress.
     */
    public function start(Request $request, ServiceRequest $serviceRequest): ServiceRequestResource
    {
        abort_unless($serviceRequest->accepted_provider_id === $request->user()->id, 403);
        abort_unless($serviceRequest->status === RequestStatus::Accepted, 422, __('messages.invalid_status'));

        $data = $request->validate([
            'code' => ['required', 'string'],
        ]);

        if (! hash_equals((string) $serviceRequest->start_code, trim($data['code']))) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'code' => [__('messages.invalid_start_code')],
            ]);
        }

        $updated = $this->service->updateStatus($serviceRequest, RequestStatus::InProgress);

        return new ServiceRequestResource($updated->load(['category', 'client']));
    }

    public function updateStatus(Request $request, ServiceRequest $serviceRequest): ServiceRequestResource
    {
        abort_unless($serviceRequest->accepted_provider_id === $request->user()->id, 403);

        $data = $request->validate([
            'status' => ['required', 'in:in_progress,completed'],
        ]);

        $target = RequestStatus::from($data['status']);

        // Forward-only transition: accepted -> in_progress -> completed.
        $valid = match ($target) {
            RequestStatus::InProgress => $serviceRequest->status === RequestStatus::Accepted,
            RequestStatus::Completed => $serviceRequest->status === RequestStatus::InProgress,
            default => false,
        };
        abort_unless($valid, 422, __('messages.invalid_status'));

        // Urgent jobs must be started with the customer's code (via /start); the
        // plain status bump to in_progress is blocked so the code can't be skipped.
        abort_if(
            $target === RequestStatus::InProgress && $serviceRequest->urgency === RequestUrgency::Urgent,
            422,
            __('messages.start_code_required'),
        );

        $updated = $this->service->updateStatus($serviceRequest, $target);

        return new ServiceRequestResource($updated->load(['category', 'client']));
    }

    /** Provider reports the client wasn't at the agreed location (mirror of the customer's no-show report). */
    public function reportCustomerNoShow(Request $request, ServiceRequest $serviceRequest): ServiceRequestResource
    {
        abort_unless($serviceRequest->accepted_provider_id === $request->user()->id, 403);
        abort_unless(
            in_array($serviceRequest->status, [RequestStatus::Accepted, RequestStatus::InProgress], true),
            422,
            __('messages.request_not_active'),
        );

        $data = $request->validate(['reason' => ['nullable', 'string', 'max:255']]);
        $updated = $this->service->reportCustomerNoShow($serviceRequest, $data['reason'] ?? null);

        return new ServiceRequestResource($updated->load(['category', 'client']));
    }
}
