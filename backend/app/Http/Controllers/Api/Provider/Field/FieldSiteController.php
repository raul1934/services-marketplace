<?php

namespace App\Http\Controllers\Api\Provider\Field;

use App\Http\Controllers\Controller;
use App\Http\Resources\Field\FieldServiceResource;
use App\Models\Field\FieldRoutePerformance;
use App\Models\Field\FieldShift;
use App\Models\Field\FieldSite;
use App\Models\Field\FieldSitePerformance;
use App\Support\Field\ShiftSnapshot;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * Sites are master data (no status). A site's "running" visit and its history
 * are derived from the shift's SitePerformances. Start/finish drive a
 * SitePerformance, tied to the route being run.
 */
class FieldSiteController extends Controller
{
    public function index(): JsonResponse
    {
        $sites = FieldSite::query()
            ->withCount([
                'services',
                'services as obrig_count' => fn ($q) => $q->where('obrig', true),
            ])
            ->orderBy('name')
            ->get();

        $snap = ShiftSnapshot::current();

        return response()->json([
            'data' => $sites->map(fn ($site) => [
                'id' => $site->id,
                'name' => $site->name,
                'contract' => $site->contract,
                'address' => $site->address,
                'status' => $snap->siteRunning($site->id) ? 'running' : 'idle',
                'geo' => $this->geo($site),
                'servicesCount' => (int) $site->services_count,
                'obrigCount' => (int) $site->obrig_count,
            ])->values(),
        ]);
    }

    public function show(FieldSite $site): JsonResponse
    {
        $site->load(['services', 'performances', 'performances.servicePerformances']);
        $snap = ShiftSnapshot::current();

        // Reflect the current/last visit's per-service done state onto the
        // definitions (done is execution state, kept on ServicePerformance).
        $visit = FieldSitePerformance::query()
            ->where('site_id', $site->id)
            ->when(FieldShift::active(), fn ($q, $shift) => $q->where('shift_id', $shift->id))
            ->orderByRaw("case when status = 'running' then 0 else 1 end")
            ->latest('id')
            ->with('servicePerformances')
            ->first();
        $doneMap = $visit ? $visit->servicePerformances->pluck('done', 'service_id') : collect();
        $site->services->each(fn ($s) => $s->setAttribute('done', (bool) ($doneMap[$s->id] ?? false)));

        return response()->json([
            'data' => [
                'id' => $site->id,
                'name' => $site->name,
                'contract' => $site->contract,
                'address' => $site->address,
                'status' => $snap->siteRunning($site->id) ? 'running' : 'idle',
                'geo' => $this->geo($site),
                'services' => FieldServiceResource::collection($site->services),
                'history' => $site->performances->map(fn ($p) => [
                    'id' => (string) $p->id,
                    'day' => $this->dayOf($p->created_at),
                    'time' => $p->time,
                    'services' => $p->servicePerformances->where('done', true)->count(),
                    'status' => $p->status === 'running' ? 'doing' : 'done',
                ])->values(),
            ],
        ]);
    }

    /** Begin the visit (slider "iniciar visita"). */
    public function start(FieldSite $site): JsonResponse
    {
        $shift = $this->activeShift();

        // Tie the visit to whichever route is currently being run, if any.
        $runningRoutePerf = FieldRoutePerformance::query()
            ->where('shift_id', $shift->id)
            ->where('status', 'running')
            ->latest('started_at')
            ->first();

        FieldSitePerformance::firstOrCreate(
            ['shift_id' => $shift->id, 'site_id' => $site->id, 'status' => 'running'],
            [
                'route_performance_id' => $runningRoutePerf?->id,
                'crew' => 1,
                'time' => now()->format('G:i'),
                'started_at' => now(),
            ],
        );

        return $this->show($site);
    }

    /** Close the visit (slider "finalizar visita"). */
    public function finish(FieldSite $site): JsonResponse
    {
        $shift = $this->activeShift();

        FieldSitePerformance::query()
            ->where('shift_id', $shift->id)
            ->where('site_id', $site->id)
            ->where('status', 'running')
            ->update(['status' => 'done', 'ended_at' => now()]);

        return $this->show($site);
    }

    private function activeShift(): FieldShift
    {
        $shift = FieldShift::active();

        if (! $shift) {
            throw ValidationException::withMessages([
                'shift' => 'Nenhum turno aberto. Inicie um turno primeiro.',
            ]);
        }

        return $shift;
    }

    /** @return array{lat: float, lng: float}|null */
    private function geo(FieldSite $site): ?array
    {
        return $site->lat !== null && $site->lng !== null
            ? ['lat' => (float) $site->lat, 'lng' => (float) $site->lng]
            : null;
    }

    private function dayOf(?Carbon $at): string
    {
        if (! $at) {
            return 'today';
        }

        return $at->isToday() ? 'today' : ($at->isYesterday() ? 'yesterday' : $at->format('d/m'));
    }
}
