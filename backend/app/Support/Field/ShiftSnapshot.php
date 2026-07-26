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

    /** RoutePerformances keyed by route_id. */
    private Collection $routePerfs;

    /** All SitePerformances of the shift. */
    private Collection $sitePerfs;

    public function __construct(?FieldShift $shift)
    {
        $this->shift = $shift;

        if ($shift) {
            $shift->loadMissing(['routePerformances', 'sitePerformances']);
            $this->routePerfs = $shift->routePerformances->keyBy('route_id');
            $this->sitePerfs = $shift->sitePerformances;
        } else {
            $this->routePerfs = collect();
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

    /** 'idle' (not started) | 'running' | 'done'. */
    public function routeStatus(string $routeId): string
    {
        $rp = $this->routePerfs->get($routeId);

        return $rp ? $rp->status : 'idle';
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
        $rp = $this->routePerfs->get($routeId);

        if (! $rp) {
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
