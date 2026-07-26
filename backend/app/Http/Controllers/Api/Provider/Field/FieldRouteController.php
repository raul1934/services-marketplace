<?php

namespace App\Http\Controllers\Api\Provider\Field;

use App\Http\Controllers\Controller;
use App\Models\Field\FieldRoute;
use App\Models\Field\FieldRoutePerformance;
use App\Models\Field\FieldShift;
use App\Models\Field\FieldSitePerformance;
use App\Support\Field\ShiftSnapshot;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

/**
 * Routes are templates (no status of their own). Their running state and each
 * stop's now/next/done + "Nx this shift" are derived from the active shift's
 * RoutePerformances/SitePerformances. Start/finish drive a RoutePerformance.
 */
class FieldRouteController extends Controller
{
    public function index(): JsonResponse
    {
        $routes = FieldRoute::query()->with($this->stopLoad())->orderBy('name')->get();
        $snap = ShiftSnapshot::current();

        return response()->json([
            'data' => $routes->map(fn ($route) => $this->shape($route, $snap))->values(),
        ]);
    }

    public function show(FieldRoute $route): JsonResponse
    {
        $route->load($this->stopLoad());

        return response()->json(['data' => $this->shape($route, ShiftSnapshot::current())]);
    }

    /** Eager-loads each stop's site with its mandatory-service count. */
    private function stopLoad(): array
    {
        return ['stops.site' => fn ($q) => $q->withCount([
            'services as obrig_count' => fn ($s) => $s->where('obrig', true),
        ])];
    }

    /** Begin running the route in the open shift (slider "iniciar rota"). */
    public function start(FieldRoute $route): JsonResponse
    {
        $shift = $this->activeShift();

        // Starting a route only opens the route — it does NOT start any site.
        // The tech drives to each stop and starts that visit by hand.
        FieldRoutePerformance::firstOrCreate(
            ['shift_id' => $shift->id, 'route_id' => $route->id, 'status' => 'running'],
            ['started_at' => now()],
        );

        return $this->show($route);
    }

    /**
     * Close the route (slider "finalizar rota"). Finishing resets the run: the
     * route goes back to idle and its still-open visits are closed, so the next
     * run starts fresh (per-site "performed" counts are per run). Only the count
     * of completed runs stays, anchored to the shift.
     */
    public function finish(FieldRoute $route): JsonResponse
    {
        $shift = $this->activeShift();

        $runs = FieldRoutePerformance::query()
            ->where('shift_id', $shift->id)
            ->where('route_id', $route->id)
            ->where('status', 'running')
            ->get();

        foreach ($runs as $run) {
            $run->update(['status' => 'done', 'ended_at' => now()]);
            FieldSitePerformance::query()
                ->where('route_performance_id', $run->id)
                ->where('status', 'running')
                ->update(['status' => 'done', 'ended_at' => now()]);
        }

        return $this->show($route);
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

    /** @return array<string, mixed> */
    private function shape(FieldRoute $route, ShiftSnapshot $snap): array
    {
        return [
            'id' => $route->id,
            'name' => $route->name,
            'km' => (float) $route->km,
            'status' => $snap->routeStatus($route->id),
            'required' => $route->stops->sum(fn ($s) => (int) ($s->site->obrig_count ?? 0)),
            'performedTimes' => $snap->routePerformedTimes($route->id),
            'stops' => $route->stops->map(function ($stop) use ($route, $snap) {
                $state = $snap->stopState($route->id, $stop->site_id);

                return [
                    'siteId' => $stop->site_id,
                    'km' => $stop->km,
                    'status' => $state['status'],
                    'times' => $state['times'],
                    'site' => $stop->site ? [
                        'id' => $stop->site->id,
                        'name' => $stop->site->name,
                        'address' => $stop->site->address,
                        'geo' => $stop->site->lat !== null && $stop->site->lng !== null
                            ? ['lat' => (float) $stop->site->lat, 'lng' => (float) $stop->site->lng]
                            : null,
                    ] : null,
                ];
            })->values(),
        ];
    }
}
