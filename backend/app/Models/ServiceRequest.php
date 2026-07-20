<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\ReceptionType;
use App\Enums\RequestStatus;
use App\Enums\RequestUrgency;
use App\Models\Concerns\HasMedia;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class ServiceRequest extends Model
{
    use HasMedia;

    protected $fillable = [
        'client_id', 'market_id', 'service_category_id', 'asset_id', 'share_asset_note', 'accepted_proposal_id', 'accepted_provider_id',
        'description', 'latitude', 'longitude', 'address', 'reception_type', 'entry_code', 'start_code', 'budget_max',
        'payment_method',
        'urgency', 'max_wait_minutes', 'status',
        'is_test', // TEMP — test bots. Remove with app/Bots.
        'cancelled_reason', 'accepted_at', 'started_at', 'completed_at', 'cancelled_at',
        'parts_approval_requested_at', 'parts_approved_at',
        'no_show_at', 'no_show_reason',
    ];

    protected $casts = [
        'status' => RequestStatus::class,
        'urgency' => RequestUrgency::class,
        'max_wait_minutes' => 'integer',
        'is_test' => 'boolean', // TEMP — test bots. Remove with app/Bots.
        'share_asset_note' => 'boolean',
        'reception_type' => ReceptionType::class,
        'payment_method' => PaymentMethod::class,
        'latitude' => 'float',
        'longitude' => 'float',
        'budget_max' => 'decimal:2',
        'accepted_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'parts_approval_requested_at' => 'datetime',
        'parts_approved_at' => 'datetime',
        'no_show_at' => 'datetime',
    ];

    /**
     * When the provider's promised arrival window closes.
     *
     * Urgent jobs: the client stated how long they'd wait (max_wait_minutes),
     * counted from acceptance — that's the moment the provider committed. For a
     * scheduled job the promise is the agreed window, so its start is the
     * deadline. Null means there is nothing to be late for yet.
     */
    public function arrivalDeadline(): ?\Illuminate\Support\Carbon
    {
        // accepted_at is always set by ProposalService::accept, but fall back to
        // created_at rather than return null: a row missing it would otherwise
        // lock the client out of reporting a no-show forever, with no recourse.
        $acceptedAt = $this->accepted_at ?? $this->created_at;

        if ($acceptedAt === null) {
            return null;
        }

        if ($this->urgency === RequestUrgency::Urgent) {
            return $acceptedAt->copy()->addMinutes($this->max_wait_minutes ?? 30);
        }

        return $this->availabilities()->orderBy('starts_at')->value('starts_at');
    }

    /**
     * Reporting a no-show only makes sense while the client is still waiting:
     * once the provider is on site (in_progress) they demonstrably showed up,
     * and before the promised window closes the complaint is premature.
     */
    public function canReportNoShow(): bool
    {
        if ($this->status !== RequestStatus::Accepted) {
            return false;
        }

        $deadline = $this->arrivalDeadline();

        return $deadline !== null && $deadline->isPast();
    }

    /**
     * Rescheduling is a pre-arrival action too. Urgent jobs additionally wait
     * for the promised window to lapse — until then the provider is simply on
     * their way, and offering to move the job invites cancelling a pro who is
     * two minutes out. Scheduled jobs can be moved at any point before they
     * start, which is the whole point of having a booking.
     */
    public function canReschedule(): bool
    {
        if ($this->status !== RequestStatus::Accepted) {
            return false;
        }

        if ($this->urgency !== RequestUrgency::Urgent) {
            return true;
        }

        return $this->arrivalDeadline()?->isPast() ?? false;
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function market(): BelongsTo
    {
        return $this->belongsTo(Market::class);
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accepted_provider_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    /** The asset (vehicle/property/pet) this request is tied to (R6). */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function proposals(): HasMany
    {
        return $this->hasMany(Proposal::class);
    }

    public function acceptedProposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'accepted_proposal_id');
    }

    /** Client's reference photos (media tagged `request`). */
    public function photos(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable')->where('tag', 'request');
    }

    /** Provider's photos before starting the job (media tagged `before`). */
    public function beforePhotos(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable')->where('tag', 'before')->latest();
    }

    /** Provider's photos after finishing the job (media tagged `after`). */
    public function afterPhotos(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable')->where('tag', 'after')->latest();
    }

    /** Pre-bid questions asked by providers. */
    public function questions(): HasMany
    {
        return $this->hasMany(RequestQuestion::class);
    }

    /** Client's answers to the category's intake questions. */
    public function answers(): HasMany
    {
        return $this->hasMany(RequestAnswer::class);
    }

    /** The client's review of the provider. */
    public function review(): HasOne
    {
        return $this->hasOne(Review::class)->where('author_role', 'client');
    }

    /** The provider's review of the client. */
    public function providerReview(): HasOne
    {
        return $this->hasOne(Review::class)->where('author_role', 'provider');
    }

    /** Customer's available time windows (for scheduled requests). */
    public function availabilities(): HasMany
    {
        return $this->hasMany(RequestAvailability::class);
    }

    /** Provider's timeline of photos/comments during the service. */
    public function jobUpdates(): HasMany
    {
        return $this->hasMany(JobUpdate::class);
    }

    /** Parts replaced/adjusted during the service. */
    public function jobParts(): HasMany
    {
        return $this->hasMany(JobPart::class);
    }

    /** Surcharges (acréscimos) proposed by the provider during the service. */
    public function surcharges(): HasMany
    {
        return $this->hasMany(Surcharge::class);
    }

    /** Reschedule requests raised by either party on a scheduled job. */
    public function rescheduleRequests(): HasMany
    {
        return $this->hasMany(RescheduleRequest::class);
    }

    public function disputes(): HasMany
    {
        return $this->hasMany(Dispute::class);
    }

    /** Most recent dispute on this job (at most one active at a time). */
    public function dispute(): HasOne
    {
        return $this->hasOne(Dispute::class)->latestOfMany();
    }

    /** Warranty claims opened after completion. */
    public function warrantyClaims(): HasMany
    {
        return $this->hasMany(WarrantyClaim::class);
    }

    /**
     * Live/actionable requests (open/accepted/in_progress), scoped to a
     * Market Admin's assigned market(s) or unrestricted for a Super Admin —
     * shared by the ops dashboard table, the live map, and its marker feed
     * so all three agree on exactly what counts as "active".
     */
    public static function activeInMarketScope(User $user): Builder
    {
        $activeStatuses = [RequestStatus::Open->value, RequestStatus::Accepted->value, RequestStatus::InProgress->value];

        return static::query()
            ->whereIn('status', $activeStatuses)
            ->when(! $user->isSuperAdmin(), fn ($q) => $q->whereIn('market_id', $user->marketIds()));
    }
}
