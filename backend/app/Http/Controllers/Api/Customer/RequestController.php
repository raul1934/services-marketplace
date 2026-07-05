<?php

namespace App\Http\Controllers\Api\Customer;

use App\Enums\PaymentMethod;
use App\Enums\ReceptionType;
use App\Enums\RequestStatus;
use App\Enums\RequestUrgency;
use App\Http\Controllers\Controller;
use App\Http\Resources\RequestEventResource;
use App\Http\Resources\ServiceRequestResource;
use App\Models\AssetVehicle;
use App\Models\ServiceRequest;
use App\Services\RequestEventService;
use App\Services\RequestService;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class RequestController extends Controller
{
    public function __construct(private readonly RequestService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $requests = $request->user()->requests()
            ->with(['category', 'photos', 'availabilities'])
            ->withCount('proposals')
            ->latest()
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return ServiceRequestResource::collection($requests);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'service_category_id' => ['required', 'integer', 'exists:service_categories,id'],
            'asset_id' => ['nullable', 'integer', Rule::exists('assets', 'id')->where('user_id', $request->user()->id)],
            'description' => ['required', 'string', 'max:1000'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'address' => ['nullable', 'string', 'max:255'],
            'reception_type' => ['nullable', Rule::enum(ReceptionType::class)],
            'entry_code' => ['nullable', 'string', 'max:50'],
            'budget_max' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            // Answers to the category's intake questions.
            'answers' => ['nullable', 'array'],
            'answers.*.question_id' => ['required', 'integer', 'exists:questions,id'],
            'answers.*.answer' => ['required', 'string', 'max:500'],
            'urgency' => ['nullable', Rule::enum(RequestUrgency::class)],
            'max_wait_minutes' => ['nullable', 'integer', Rule::in([10, 20, 30])],
            'availabilities' => ['array'],
            'availabilities.*.starts_at' => ['required', 'date'],
            'availabilities.*.ends_at' => ['required', 'date'],
            // Photos uploaded during the wizard (upload-first); re-parented on create.
            'media_ids' => ['nullable', 'array', 'max:10'],
            'media_ids.*' => ['integer'],
        ]);

        $serviceRequest = $this->service->create($request->user(), $data);

        return (new ServiceRequestResource($serviceRequest->load(['category', 'photos'])))
            ->response()->setStatusCode(201);
    }

    public function show(Request $request, ServiceRequest $serviceRequest): ServiceRequestResource
    {
        $this->authorizeOwner($request, $serviceRequest);

        return new ServiceRequestResource(
            $serviceRequest->load([
                'category', 'asset',
                // Resolve the vehicle make/model (+ logo) for the asset card on the request screen.
                'asset.detailable' => fn (MorphTo $m) => $m->morphWith([AssetVehicle::class => ['make', 'model']]),
                'photos', 'beforePhotos', 'afterPhotos', 'acceptedProposal',
                'provider.providerProfile', 'availabilities', 'review', 'questions.provider', 'questions.answerPhotos', 'answers',
                'surcharges.provider', 'surcharges.media', 'rescheduleRequests', 'jobParts',
            ])->loadCount('proposals')
        );
    }

    /**
     * Chronological feed of the request's events, derived on read (owner-only).
     *
     * Not paginated: the feed is a derived, bounded, oldest→newest timeline for a
     * single request. Paginating it ascending would put the oldest events on page
     * one (so a collapsed "latest" view would be wrong), and flipping to
     * descending would break the documented feed order — for negligible payload
     * gain. The per-request growing list that warrants paging is the proposals.
     */
    public function events(Request $request, ServiceRequest $serviceRequest, RequestEventService $events): AnonymousResourceCollection
    {
        $this->authorizeOwner($request, $serviceRequest);

        return RequestEventResource::collection($events->for($serviceRequest));
    }

    public function cancel(Request $request, ServiceRequest $serviceRequest): ServiceRequestResource
    {
        $this->authorizeOwner($request, $serviceRequest);
        $this->service->cancel($serviceRequest, $request->input('reason'));

        return new ServiceRequestResource($serviceRequest->fresh()->load('category'));
    }

    /** Client approves the provider's requested total (labor + parts). */
    public function approveParts(Request $request, ServiceRequest $serviceRequest): ServiceRequestResource
    {
        $this->authorizeOwner($request, $serviceRequest);
        abort_if($serviceRequest->parts_approval_requested_at === null, 422, __('messages.request_not_active'));

        $serviceRequest->update(['parts_approved_at' => now()]);
        // Keep per-line state consistent with the aggregate approval — a part
        // approved individually or via "approve all" ends up the same way.
        $serviceRequest->jobParts()->whereNull('approved_at')->update(['approved_at' => now()]);
        if ($serviceRequest->provider) {
            $serviceRequest->provider->notify(new \App\Notifications\PartsApproved($serviceRequest->id));
        }
        \App\Events\PartsApproved::dispatch($serviceRequest->id);

        return new ServiceRequestResource($serviceRequest->fresh()->load(['category', 'jobParts']));
    }

    /** Client reports the provider as a no-show; reopens the request (C35). */
    public function reportNoShow(Request $request, ServiceRequest $serviceRequest): ServiceRequestResource
    {
        $this->authorizeOwner($request, $serviceRequest);
        abort_unless(
            in_array($serviceRequest->status, [RequestStatus::Accepted, RequestStatus::InProgress], true),
            422,
            __('messages.request_not_active'),
        );

        $data = $request->validate(['reason' => ['nullable', 'string', 'max:255']]);
        $updated = $this->service->reportNoShow($serviceRequest, $data['reason'] ?? null);

        return new ServiceRequestResource($updated->load('category'));
    }


    private function authorizeOwner(Request $request, ServiceRequest $serviceRequest): void
    {
        abort_unless($serviceRequest->client_id === $request->user()->id, 403);
    }
}
