<?php

namespace App\Support\Field;

use App\Models\Field\FieldShift;
use Illuminate\Support\Collection;

/**
 * Read-model over the current shift's performances. The definitions (route,
 * site, stop) carry no execution state — this derives it: a route's running
 * state, a stop's now/next/done + "Nx this shift", a site's running visit.
 * Built once per request from the active shift (or empty when none is open).
 */
class ShiftSnapshot
{
    private ?FieldShift $shift;

    /** The currently running RoutePerformance per route_id (drives now/next/done). */
    private Collection $runningRoutePerfs;

    /** Count of finished route runs per route_id — anchored to the shift. */
    private Collection $doneRouteCounts;

    /** All SitePerformances of the shift. */
    private Collection $sitePerfs;

    public function __construct(?FieldShift $shift)
    {
        $this->shift = $shift;

        if ($shift) {
            $shift->loadMissing(['routePerformances', 'sitePerformances']);
            $this->runningRoutePerfs = $shift->routePerformances->where('status', 'running')->keyBy('route_id');
            $this->doneRouteCounts = $shift->routePerformances->where('status', 'done')
                ->groupBy('route_id')->map->count();
            $this->sitePerfs = $shift->sitePerformances;
        } else {
            $this->runningRoutePerfs = collect();
            $this->doneRouteCounts = collect();
            $this->sitePerfs = collect();
        }
    }

    public static function current(): self
    {
        return new self(FieldShift::active());
    }

    public function shift(): ?FieldShift
    {
        return $this->shift;
    }

    /** 'running' while a run is open, else 'idle' — a finished route resets to idle. */
    public function routeStatus(string $routeId): string
    {
        return $this->runningRoutePerfs->has($routeId) ? 'running' : 'idle';
    }

    /** How many times this route was completed in the shift (shift-anchored). */
    public function routePerformedTimes(string $routeId): int
    {
        return (int) ($this->doneRouteCounts[$routeId] ?? 0);
    }

    /** Whether the site currently has an open (running) visit this shift. */
    public function siteRunning(string $siteId): bool
    {
        return $this->sitePerfs
            ->where('site_id', $siteId)
            ->firstWhere('status', 'running') !== null;
    }

    /**
     * A stop's derived state within its route: 'now' while being visited,
     * 'done' once visited (with how many times this shift), else 'next'.
     *
     * @return array{status: string, times: int}
     */
    public function stopState(string $routeId, string $siteId): array
    {
        $rp = $this->runningRoutePerfs->get($routeId);

        if (! $rp) {
            // No run in progress → nothing performed yet this run (reset).
            return ['status' => 'next', 'times' => 0];
        }

        $visits = $this->sitePerfs
            ->where('route_performance_id', $rp->id)
            ->where('site_id', $siteId);

        $doneCount = $visits->where('status', 'done')->count();

        if ($visits->firstWhere('status', 'running') !== null) {
            return ['status' => 'now', 'times' => $doneCount];
        }

        return $doneCount > 0
            ? ['status' => 'done', 'times' => $doneCount]
            : ['status' => 'next', 'times' => 0];
    }
}
