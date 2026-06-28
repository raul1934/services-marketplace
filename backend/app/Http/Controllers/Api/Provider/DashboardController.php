<?php

namespace App\Http\Controllers\Api\Provider;

use App\Enums\RequestStatus;
use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Provider home dashboard: today's earnings, job counts and rating. */
class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $provider = $request->user();
        $profile = $provider->providerProfile;

        // Earnings come from the accepted proposal's price on completed jobs.
        $completed = ServiceRequest::query()
            ->where('service_requests.accepted_provider_id', $provider->id)
            ->where('service_requests.status', RequestStatus::Completed->value)
            ->join('proposals', 'proposals.id', '=', 'service_requests.accepted_proposal_id');

        $today = (clone $completed)->whereDate('service_requests.completed_at', today());

        return response()->json([
            'earnings_today' => (float) (clone $today)->sum('proposals.price'),
            'earnings_week' => (float) (clone $completed)
                ->where('service_requests.completed_at', '>=', now()->startOfWeek())
                ->sum('proposals.price'),
            'jobs_today' => (clone $today)->count(),
            'jobs_completed' => (int) ($profile?->jobs_completed ?? 0),
            'rating_avg' => (float) ($profile?->rating_avg ?? 0),
            'rating_count' => (int) ($profile?->rating_count ?? 0),
            'is_online' => (bool) ($profile?->is_online ?? false),
        ]);
    }
}
