<?php

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Enums\PhotoPhase;
use App\Enums\RequestStatus;
use App\Enums\RequestUrgency;
use App\Events\RequestStatusUpdated;
use App\Jobs\DispatchNewRequestToProviders;
use App\Models\Media;
use App\Models\Question;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Notifications\RequestStatusChanged;
use App\Support\NearbyLocation;
use Illuminate\Http\UploadedFile;

class RequestService
{
    /**
     * @param  array{service_category_id:int,description:string,latitude:float,longitude:float,address?:?string,budget_max?:?float,payment_method?:string,answers?:array<array{question_id:int,answer:string}>,urgency?:string,availabilities?:array<array{starts_at:string,ends_at:string}>}  $data
     */
    public function create(User $client, array $data): ServiceRequest
    {
        // In local dev, scatter new requests around São José do Rio Preto so they
        // land among the seeded providers/feed instead of at the real device
        // location. No-op in testing/staging/production — the posted coords win.
        $location = app()->environment('local')
            ? NearbyLocation::random()
            : ['latitude' => $data['latitude'], 'longitude' => $data['longitude']];

        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $data['service_category_id'],
            'asset_id' => $data['asset_id'] ?? null,
            'description' => $data['description'],
            ...$location,
            'address' => $data['address'] ?? null,
            'reception_type' => $data['reception_type'] ?? null,
            'entry_code' => $data['entry_code'] ?? null,
            'budget_max' => $data['budget_max'] ?? null,
            'payment_method' => $data['payment_method'] ?? PaymentMethod::Cash->value,
            'urgency' => $data['urgency'] ?? RequestUrgency::Urgent->value,
            'status' => RequestStatus::Open->value,
        ]);

        $this->saveAnswers($request, $data['answers'] ?? []);

        // Customer's available time windows (for scheduled requests).
        foreach ($data['availabilities'] ?? [] as $w) {
            $request->availabilities()->create([
                'starts_at' => $w['starts_at'],
                'ends_at' => $w['ends_at'],
            ]);
        }

        // Attach any photos the client uploaded during the wizard (upload-first).
        if (! empty($data['media_ids'])) {
            (new MediaService)->attach($data['media_ids'], $request, 'request', $client->id);
        }

        // Notify nearby online providers (queued fan-out).
        DispatchNewRequestToProviders::dispatch($request->id);

        return $request;
    }

    /**
     * Persist the client's answers to intake questions, snapshotting each
     * question's text (in the request locale) so the record stays readable even
     * if the catalog question later changes.
     *
     * @param  array<array{question_id:int,answer:string}>  $answers
     */
    private function saveAnswers(ServiceRequest $request, array $answers): void
    {
        if (! $answers) {
            return;
        }

        $questions = Question::whereIn('id', array_column($answers, 'question_id'))->get()->keyBy('id');

        foreach ($answers as $a) {
            $answer = trim((string) ($a['answer'] ?? ''));
            if ($answer === '') {
                continue;
            }
            $question = $questions->get($a['question_id']);

            $request->answers()->create([
                'question_id' => $question?->id,
                'text' => $question?->localizedText() ?? '',
                'answer' => $answer,
            ]);
        }
    }

    public function cancel(ServiceRequest $request, ?string $reason = null): void
    {
        $request->update([
            'status' => RequestStatus::Cancelled->value,
            'cancelled_reason' => $reason,
            'cancelled_at' => now(),
        ]);

        RequestStatusUpdated::dispatch($request->id, RequestStatus::Cancelled->value);
    }

    public function addPhoto(
        ServiceRequest $request,
        UploadedFile $file,
        PhotoPhase $phase = PhotoPhase::Request,
        ?int $uploadedById = null,
    ): Media {
        $path = $file->store("requests/{$request->id}", 'public');

        return $request->media()->create([
            'uploaded_by_id' => $uploadedById,
            'disk' => 'public',
            'path' => $path,
            'tag' => $phase->value,
        ]);
    }

    /**
     * On completion, credit the provider's wallet with the net earnings
     * (labor + parts − 3% platform fee) and bump their completed-jobs counter.
     * Idempotent: skips if a credit for this request already exists.
     */
    private function settleEarnings(ServiceRequest $request): void
    {
        if (! $request->accepted_provider_id) {
            return;
        }
        $exists = \App\Models\WalletTransaction::where('service_request_id', $request->id)
            ->where('type', \App\Models\WalletTransaction::TYPE_CREDIT)->exists();
        if ($exists) {
            return;
        }

        $labor = (float) ($request->acceptedProposal?->price ?? 0);
        $parts = $request->jobParts()->get()->sum(fn ($p) => (float) ($p->unit_price ?? 0) * $p->quantity);
        $surcharges = (float) $request->surcharges()
            ->where('status', \App\Enums\SurchargeStatus::Approved->value)
            ->sum('amount');
        $gross = $labor + $parts + $surcharges;
        // Platform fee depends on the provider's plan (Free 5% · Pro 2.5% · Enterprise 1%).
        $rate = $request->provider?->providerProfile?->commissionRate()
            ?? \App\Enums\ProviderPlan::Free->commissionRate();
        $net = round($gross * (1 - $rate), 2);

        if ($net > 0) {
            \App\Models\WalletTransaction::create([
                'provider_id' => $request->accepted_provider_id,
                'type' => \App\Models\WalletTransaction::TYPE_CREDIT,
                'amount' => $net,
                'description' => $request->category?->name,
                'service_request_id' => $request->id,
            ]);

            $request->provider?->notify(new \App\Notifications\PaymentSettled($request->id, $net));
        }

        $request->provider?->providerProfile?->increment('jobs_completed');
    }

    /**
     * Provider no-show (C35): reopen the request to other providers at no cost
     * and notify the client. Covers both the common no-show (ETA exceeded / no
     * check-in) and the qualified no-show (client refused a surcharge and the
     * provider left). The previous provider is detached and a penalty applies
     * to their reputation (handled in the back-office reputation pipeline).
     */
    public function reportNoShow(ServiceRequest $request, ?string $reason = null): ServiceRequest
    {
        $request->update([
            'no_show_at' => now(),
            'no_show_reason' => $reason,
            'status' => RequestStatus::Open->value,
            'accepted_proposal_id' => null,
            'accepted_provider_id' => null,
            'accepted_at' => null,
            'started_at' => null,
        ]);

        $request->client->notify(new \App\Notifications\ProviderNoShow($request->id));
        DispatchNewRequestToProviders::dispatch($request->id);
        RequestStatusUpdated::dispatch($request->id, RequestStatus::Open->value);

        return $request->fresh();
    }

    /** Provider advances the active job: in_progress -> completed. */
    public function updateStatus(ServiceRequest $request, RequestStatus $status): ServiceRequest
    {
        $attrs = ['status' => $status->value];
        if ($status === RequestStatus::InProgress) {
            $attrs['started_at'] = now();
        } elseif ($status === RequestStatus::Completed) {
            $attrs['completed_at'] = now();
        }

        $request->update($attrs);

        if ($status === RequestStatus::Completed) {
            $this->settleEarnings($request);
        }

        $request->client->notify(new RequestStatusChanged($request->id, $status));
        RequestStatusUpdated::dispatch($request->id, $status->value);

        return $request->fresh();
    }
}
