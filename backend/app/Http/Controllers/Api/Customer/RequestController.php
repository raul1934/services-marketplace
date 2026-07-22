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
use App\Notifications\PartsApproved;
use App\Services\RequestEventService;
use App\Services\RequestService;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class RequestController extends Controller
{
    /** Status buckets the My-requests list can be filtered by (mirrors the app's filter sheet). */
    private const STATUS_FILTERS = ['open', 'active', 'completed', 'cancelled'];

    public function __construct(private readonly RequestService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        // `?status=<bucket>` filters in SQL rather than in the app. The list is
        // paginated, so a client-side filter only ever sees the pages already
        // fetched: with 40 requests and 20 loaded it would render (and count)
        // at most those 20, making the result count under-report the real
        // number. Filtering here also makes `meta.total` the honest count.
        $data = $request->validate([
            'status' => ['nullable', Rule::in(self::STATUS_FILTERS)],
        ]);

        $requests = $request->user()->requests()
            ->when(
                $data['status'] ?? null,
                fn ($query, string $bucket) => $query->whereIn('status', self::bucketStatuses($bucket)),
            )
            ->with(['category', 'photos', 'availabilities'])
            ->withCount('proposals')
            ->latest()
            ->orderByDesc('id')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return ServiceRequestResource::collection($requests);
    }

    /**
     * Statuses each filter bucket covers. Kept in one place so the app and the
     * API can't drift on what "active" or "cancelled" means.
     *
     * @return list<string>
     */
    private static function bucketStatuses(string $bucket): array
    {
        $statuses = match ($bucket) {
            'open' => [RequestStatus::Open],
            'active' => [RequestStatus::Accepted, RequestStatus::InProgress, RequestStatus::Requote],
            'completed' => [RequestStatus::Completed],
            'cancelled' => [RequestStatus::Cancelled, RequestStatus::Expired],
        };

        return array_map(fn (RequestStatus $status) => $status->value, $statuses);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'service_category_id' => ['required', 'integer', 'exists:service_categories,id'],
            'asset_id' => ['nullable', 'integer', Rule::exists('assets', 'id')->where('user_id', $request->user()->id)],
            // Opt-in to share the asset's provider_note with the provider (private by default).
            'share_asset_note' => ['nullable', 'boolean'],
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
                'provider.providerProfile', 'availabilities', 'review', 'questions.provider', 'questions.suggestion', 'questions.answerPhotos', 'answers',
                'surcharges.provider', 'surcharges.media', 'rescheduleRequests', 'jobParts',
                // Feeds the "what's being done" panel that replaces the map once
                // the provider is on site.
                'jobUpdates.media',
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

    /**
     * Add what the express flow did not ask for up front: photos, the
     * category's intake answers, and the budget.
     *
     * The three are not equivalent, which is why the budget is guarded on its
     * own. Photos and answers are additive — the provider simply learns more.
     * A budget is what providers bid *against*, so changing it after a bid
     * exists rewrites the terms of an offer already on the table. Editable
     * while nobody has bid; frozen the moment someone has.
     */
    public function addDetails(Request $request, ServiceRequest $serviceRequest): ServiceRequestResource
    {
        $this->authorizeOwner($request, $serviceRequest);
        abort_unless($serviceRequest->status === RequestStatus::Open, 422, __('messages.request_not_open'));

        $data = $request->validate([
            'budget_max' => ['nullable', 'numeric', 'min:0'],
            'media_ids' => ['nullable', 'array', 'max:10'],
            'media_ids.*' => ['integer'],
            'answers' => ['nullable', 'array'],
            'answers.*.question_id' => ['required', 'integer', 'exists:questions,id'],
            'answers.*.answer' => ['required', 'string', 'max:500'],
        ]);

        abort_if(
            array_key_exists('budget_max', $data) && $data['budget_max'] !== null && $serviceRequest->proposals()->exists(),
            422,
            __('messages.budget_locked'),
        );

        $this->service->addDetails($serviceRequest, $data, $request->user());

        return new ServiceRequestResource($serviceRequest->fresh()->load(['category', 'photos', 'answers']));
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
            $serviceRequest->provider->notify(new PartsApproved($serviceRequest->id));
        }
        \App\Events\PartsApproved::dispatch($serviceRequest->id);

        return new ServiceRequestResource($serviceRequest->fresh()->load(['category', 'jobParts']));
    }

    /** Client reports the provider as a no-show; reopens the request (C35). */
    public function reportNoShow(Request $request, ServiceRequest $serviceRequest): ServiceRequestResource
    {
        $this->authorizeOwner($request, $serviceRequest);
        // Was: any active status, no clock. That let a client report a no-show
        // for a provider standing in front of them (in_progress), or two minutes
        // after acceptance. Both are now the model's business, so the rule holds
        // wherever it's asked.
        abort_unless($serviceRequest->canReportNoShow(), 422, __('messages.request_not_active'));

        $data = $request->validate(['reason' => ['nullable', 'string', 'max:255']]);
        $updated = $this->service->reportNoShow($serviceRequest, $data['reason'] ?? null);

        return new ServiceRequestResource($updated->load('category'));
    }

    private function authorizeOwner(Request $request, ServiceRequest $serviceRequest): void
    {
        abort_unless($serviceRequest->client_id === $request->user()->id, 403);
    }
}
