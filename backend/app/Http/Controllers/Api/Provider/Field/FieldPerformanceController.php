<?php

namespace App\Http\Controllers\Api\Provider\Field;

use App\Http\Controllers\Controller;
use App\Models\Field\FieldSitePerformance;
use Illuminate\Http\JsonResponse;

/** The performances screen: recent site visits (today/yesterday) across shifts. */
class FieldPerformanceController extends Controller
{
    public function index(): JsonResponse
    {
        $performances = FieldSitePerformance::query()
            ->with('site:id,name')
            ->where('created_at', '>=', now()->subDay()->startOfDay())
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $performances->map(fn ($p) => [
                'id' => (string) $p->id,
                'siteId' => $p->site_id,
                'siteName' => $p->site?->name,
                'day' => $p->created_at?->isToday() ? 'today' : 'yesterday',
                'time' => $p->time,
                'crew' => (int) $p->crew,
                'status' => $p->status === 'running' ? 'doing' : 'done',
            ])->values(),
        ]);
    }
}
