<?php

namespace App\Http\Controllers\Api\Provider\Field;

use App\Http\Controllers\Controller;
use App\Http\Resources\Field\FieldServiceResource;
use App\Models\Field\FieldCatalogItem;
use App\Models\Field\FieldResource;
use App\Models\Field\FieldResourceCategory;
use App\Models\Field\FieldRoutePerformance;
use App\Models\Field\FieldService;
use App\Models\Field\FieldServicePerformance;
use App\Models\Field\FieldShift;
use App\Models\Field\FieldSite;
use App\Models\Field\FieldSitePerformance;
use App\Models\Media;
use App\Support\Field\Weather;
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
        // Execution rows for this visit, keyed by service — carry done, the
        // in-field assignee, and the resources actually used.
        $perfs = $visit
            ? $visit->servicePerformances()->with('resources')->get()->keyBy('service_id')
            : collect();
        $site->services->each(function ($s) use ($perfs) {
            $p = $perfs->get($s->id);
            $s->setAttribute('done', (bool) ($p?->done ?? false));
            $s->setAttribute('assignee', $p?->assignee);
            $s->setAttribute('assignee_name', $p?->assignee_name);
            $s->setAttribute('exec_resources', $p ? $p->resources->map(fn ($r) => [
                'id' => $r->id,
                'kind' => $r->kind,
                'name' => $r->name,
                'rate' => $r->rate,
                'cost' => $r->cost,
                'qty' => (int) $r->pivot->qty,
            ])->values()->all() : []);
        });

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
                'weather' => [
                    'type' => $visit?->weather['type'] ?? null,
                    'temp' => $visit?->weather['temp'] ?? Weather::currentTemp($site->lat, $site->lng),
                ],
                'photos' => [
                    'before' => $visit?->photo_before ?? [],
                    'after' => $visit?->photo_after ?? [],
                ],
                // Minutes on this visit and on the shift (null when not started).
                'durations' => [
                    'siteMinutes' => $visit?->started_at ? (int) $visit->started_at->diffInMinutes(now()) : null,
                    'shiftMinutes' => $shift?->started_at ? (int) $shift->started_at->diffInMinutes(now()) : null,
                ],
                'presence' => $this->presence(),
                // The crew on the open shift (current operator first), for the
                // per-service assignee picker.
                'crew' => $this->crew(),
                'services' => FieldServiceResource::collection($site->services),
                'catalog' => $catalog->map(fn ($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'rate' => $c->rate,
                    'obrig' => (bool) $c->obrig,
                ])->values(),
                // The site's company catalog of equipment/consumables, grouped by
                // category, for the per-service resource picker.
                'resourceCatalog' => $this->resourceCatalog($site),
            ],
        ]);
    }

    /**
     * Attach a before/after photo to the running visit. Stored UNTOUCHED — the
     * GPS + date/time EXIF is the proof the work happened on-site, so nothing is
     * stripped or re-encoded. The file is named by its lineage for traceability:
     * {shift}_{routePerformance}_{sitePerformance}_{phase}_{index}.{ext}.
     */
    public function attachPhoto(Request $request, FieldSite $site): JsonResponse
    {
        $data = $request->validate([
            'phase' => ['required', 'in:before,after'],
            'photo' => ['required', 'image', 'max:25600'],
        ]);

        $visit = $this->runningVisit($site);

        // At most 15 photos per visit across both phases.
        if (count($visit->photo_before ?? []) + count($visit->photo_after ?? []) >= 15) {
            throw ValidationException::withMessages(['photo' => 'Limite de 15 fotos por visita atingido.']);
        }

        $phase = $data['phase'];
        $col = 'photo_'.$phase;
        $list = $visit->{$col} ?? [];
        $index = count($list) + 1; // position in the phase, in capture order

        $file = $request->file('photo');
        $ext = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg');
        $name = implode('_', [$visit->shift_id, $visit->route_performance_id ?? 0, $visit->id, $phase, $index]).'.'.$ext;
        $path = $file->storeAs('uploads/field/'.$visit->shift_id, $name, 'public');

        $media = Media::create([
            'uploaded_by_id' => $request->user()->id,
            'disk' => 'public',
            'path' => $path,
            'tag' => 'field-os',
        ]);

        $list[] = [
            'url' => $media->url,
            'at' => now()->format('G:i'),
            'takenAt' => now()->toIso8601String(),
            'index' => $index,
            'mediaId' => $media->id,
        ];
        $visit->update([$col => $list]);

        return $this->show($site);
    }

    /** Record the weather: the tech picks the type; the temperature comes from
     *  the backend (Open-Meteo, best-effort). */
    public function setWeather(Request $request, FieldSite $site): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:claro,parcialmente-nublado,nublado,chuvoso,tempestade,neblina'],
        ]);

        $visit = $this->runningVisit($site);
        $visit->update(['weather' => [
            'type' => $data['type'],
            'temp' => Weather::currentTemp($site->lat, $site->lng),
        ]]);

        return $this->show($site);
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

    /** Assign a service on this visit to one of the open shift's operators. */
    public function assignService(Request $request, FieldSite $site, FieldService $service): JsonResponse
    {
        $shiftId = $request->validate(['shift_id' => ['required', 'string']])['shift_id'];

        $shift = FieldShift::active();
        if (! $shift) {
            throw ValidationException::withMessages(['shift' => 'Nenhum turno aberto. Inicie um turno primeiro.']);
        }

        // The chosen operator must be on this shift (the leader or its crew).
        $operator = collect([$shift])->merge($shift->crew)->firstWhere('id', $shiftId);
        if (! $operator) {
            throw ValidationException::withMessages(['shift_id' => 'Operador não está neste turno.']);
        }

        $visit = $this->runningVisit($site);
        FieldServicePerformance::updateOrCreate(
            ['site_performance_id' => $visit->id, 'service_id' => $service->id],
            ['assignee' => $this->initials($operator->tech), 'assignee_name' => $operator->tech],
        );

        return $this->show($site);
    }

    /** Record an equipment/consumable used on a service (any number per service). */
    public function addResource(Request $request, FieldSite $site, FieldService $service, FieldResource $resource): JsonResponse
    {
        if ($resource->company_id !== $site->company_id) {
            throw ValidationException::withMessages(['resource' => 'Recurso não pertence à empresa do site.']);
        }

        $qty = max(1, (int) $request->input('qty', 1));
        $visit = $this->runningVisit($site);
        $perf = FieldServicePerformance::firstOrCreate(
            ['site_performance_id' => $visit->id, 'service_id' => $service->id],
            ['done' => false],
        );
        $perf->resources()->syncWithoutDetaching([$resource->id => ['qty' => $qty]]);

        return $this->show($site);
    }

    /** Remove a resource previously recorded on a service. */
    public function removeResource(FieldSite $site, FieldService $service, FieldResource $resource): JsonResponse
    {
        $visit = $this->runningVisit($site);
        $perf = FieldServicePerformance::query()
            ->where('site_performance_id', $visit->id)
            ->where('service_id', $service->id)
            ->first();
        $perf?->resources()->detach($resource->id);

        return $this->show($site);
    }

    /** The open shift's operators (leader first), for the assignee picker. */
    private function crew(): array
    {
        $shift = FieldShift::active();
        if (! $shift) {
            return [];
        }

        return collect([$shift])->merge($shift->crew)
            ->map(fn ($s) => ['shiftId' => $s->id, 'tech' => $s->tech, 'who' => $this->initials($s->tech)])
            ->values()
            ->all();
    }

    /** The site's company catalog, grouped by category within each kind. */
    private function resourceCatalog(FieldSite $site): array
    {
        if (! $site->company_id) {
            return ['equipment' => [], 'consumable' => []];
        }

        $categories = FieldResourceCategory::query()
            ->where('company_id', $site->company_id)
            ->orderBy('position')
            ->with(['resources' => fn ($q) => $q->orderBy('position')])
            ->get();

        $group = fn (string $kind) => $categories->where('kind', $kind)->map(fn ($cat) => [
            'category' => $cat->name,
            'items' => $cat->resources->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'kind' => $r->kind,
                'rate' => $r->rate,
                'cost' => $r->cost,
            ])->values(),
        ])->values();

        return ['equipment' => $group('equipment'), 'consumable' => $group('consumable')];
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
