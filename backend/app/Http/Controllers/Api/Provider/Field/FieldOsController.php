<?php

namespace App\Http\Controllers\Api\Provider\Field;

use App\Http\Controllers\Controller;
use App\Http\Resources\Field\FieldServiceResource;
use App\Models\Field\FieldCatalogItem;
use App\Models\Field\FieldRoutePerformance;
use App\Models\Field\FieldService;
use App\Models\Field\FieldServicePerformance;
use App\Models\Field\FieldShift;
use App\Models\Field\FieldSite;
use App\Models\Field\FieldSitePerformance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * The work order (OS) for a site visit — the editable face of a SitePerformance.
 * Checking a service off, or adding one from the company catalog, writes to the
 * running visit's ServicePerformances (created on first edit, tied to the route
 * being run). Finishing the OS reuses the site finish endpoint.
 */
class FieldOsController extends Controller
{
    /** The OS: services with their done state, who's present, catalog add-ons. */
    public function show(FieldSite $site): JsonResponse
    {
        $site->load('services');
        $shift = FieldShift::active();
        $visit = $this->readVisit($site);
        $doneMap = $visit
            ? $visit->servicePerformances()->pluck('done', 'service_id')
            : collect();
        $site->services->each(fn ($s) => $s->setAttribute('done', (bool) ($doneMap[$s->id] ?? false)));

        // Catalog add-ons not yet on this site.
        $existing = $site->services->pluck('id')->all();
        $catalog = FieldCatalogItem::query()->orderBy('position')->get()
            ->reject(fn ($c) => in_array($site->id.':'.$c->id, $existing, true));

        return response()->json([
            'data' => [
                'site' => [
                    'id' => $site->id,
                    'name' => $site->name,
                    'contract' => $site->contract,
                    'address' => $site->address,
                    'geo' => $site->lat !== null && $site->lng !== null
                        ? ['lat' => (float) $site->lat, 'lng' => (float) $site->lng]
                        : null,
                ],
                'visit' => $visit ? ['id' => (string) $visit->id, 'status' => $visit->status] : null,
                // Minutes on this visit and on the shift (null when not started).
                'durations' => [
                    'siteMinutes' => $visit?->started_at ? (int) $visit->started_at->diffInMinutes(now()) : null,
                    'shiftMinutes' => $shift?->started_at ? (int) $shift->started_at->diffInMinutes(now()) : null,
                ],
                'presence' => $this->presence(),
                'services' => FieldServiceResource::collection($site->services),
                'catalog' => $catalog->map(fn ($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'rate' => $c->rate,
                    'obrig' => (bool) $c->obrig,
                ])->values(),
            ],
        ]);
    }

    /** Check a service done/undone on the running visit. */
    public function toggleService(Request $request, FieldSite $site, FieldService $service): JsonResponse
    {
        $done = $request->validate(['done' => ['required', 'boolean']])['done'];
        $visit = $this->runningVisit($site);

        FieldServicePerformance::updateOrCreate(
            ['site_performance_id' => $visit->id, 'service_id' => $service->id],
            ['done' => $done],
        );

        return $this->show($site);
    }

    /** Add a company-catalog service to this visit (promotes it to a site service). */
    public function addCatalog(FieldSite $site, FieldCatalogItem $item): JsonResponse
    {
        $visit = $this->runningVisit($site);
        $serviceId = $site->id.':'.$item->id;

        $service = FieldService::firstOrCreate(
            ['id' => $serviceId],
            [
                'site_id' => $site->id,
                'name' => $item->name,
                'who' => 'AN',
                'who_name' => 'Você',
                'rate' => $item->rate,
                'obrig' => $item->obrig,
                'nest' => [],
                'position' => 90,
            ],
        );

        FieldServicePerformance::firstOrCreate(
            ['site_performance_id' => $visit->id, 'service_id' => $service->id],
            ['done' => false],
        );

        return $this->show($site);
    }

    /** Latest visit for this site in the open shift, if any (read-only). */
    private function readVisit(FieldSite $site): ?FieldSitePerformance
    {
        $shift = FieldShift::active();
        if (! $shift) {
            return null;
        }

        return FieldSitePerformance::query()
            ->where('shift_id', $shift->id)
            ->where('site_id', $site->id)
            ->orderByRaw("case when status = 'running' then 0 else 1 end")
            ->latest('id')
            ->first();
    }

    /** The running visit for this site, opening one if the shift is open. */
    private function runningVisit(FieldSite $site): FieldSitePerformance
    {
        $shift = FieldShift::active();
        if (! $shift) {
            throw ValidationException::withMessages([
                'shift' => 'Nenhum turno aberto. Inicie um turno primeiro.',
            ]);
        }

        $visit = FieldSitePerformance::query()
            ->where('shift_id', $shift->id)
            ->where('site_id', $site->id)
            ->where('status', 'running')
            ->first();

        if ($visit) {
            return $visit;
        }

        $runningRoute = FieldRoutePerformance::query()
            ->where('shift_id', $shift->id)
            ->where('status', 'running')
            ->latest('started_at')
            ->first();

        return FieldSitePerformance::create([
            'shift_id' => $shift->id,
            'route_performance_id' => $runningRoute?->id,
            'site_id' => $site->id,
            'status' => 'running',
            'crew' => 1,
            'time' => now()->format('G:i'),
            'started_at' => now(),
        ]);
    }

    /** Initials of everyone on the open shift (leader + crew). */
    private function presence(): array
    {
        $shift = FieldShift::active();
        if (! $shift) {
            return [];
        }

        return collect([$shift->tech])
            ->merge($shift->crew->pluck('tech'))
            ->map(fn ($name) => $this->initials($name))
            ->values()
            ->all();
    }

    private function initials(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        if (count($parts) >= 2) {
            return mb_strtoupper(mb_substr($parts[0], 0, 1).mb_substr($parts[1], 0, 1));
        }

        return mb_strtoupper(mb_substr($name, 0, 2));
    }
}
