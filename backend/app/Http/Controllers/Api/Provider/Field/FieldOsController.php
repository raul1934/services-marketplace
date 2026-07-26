<?php

namespace App\Http\Controllers\Api\Provider\Field;

use App\Http\Controllers\Controller;
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
        $site->load('services.requiredResources');
        $shift = FieldShift::active();
        $visit = $this->readVisit($site);

        // Equipment/consumables a service declares it needs (shown on the card).
        $required = fn ($service) => $service
            ? $service->requiredResources->map(fn ($r) => ['kind' => $r->kind, 'name' => $r->name])->values()
            : collect();

        // The visit's services are the instances the tech added — repeatable,
        // each owned by an operator and carrying its own resources. There is no
        // separate "select/done" step: adding a service IS performing it.
        $instances = $visit
            ? $visit->servicePerformances()->with(['service.requiredResources', 'resources'])->orderBy('id')->get()->map(fn ($p) => [
                'id' => (string) $p->id,
                'serviceId' => $p->service_id,
                'name' => $p->service?->name ?? $p->service_id,
                'rate' => $p->service?->rate ?? 'visit',
                'obrig' => (bool) ($p->service?->obrig ?? false),
                'required' => $required($p->service),
                'assignee' => $p->assignee,
                'assigneeName' => $p->assignee_name,
                'resources' => $p->resources->map(fn ($r) => [
                    'id' => $r->id,
                    'kind' => $r->kind,
                    'name' => $r->name,
                    'rate' => $r->rate,
                    'cost' => $r->cost,
                    'qty' => (int) $r->pivot->qty,
                ])->values(),
            ])->values()
            : collect();

        // The "add service" menu: the site's own services (mandatory ones lead),
        // then the company add-on catalog. The app groups it and offers search.
        $menu = $site->services->map(fn ($s) => [
            'id' => $s->id, 'name' => $s->name, 'obrig' => (bool) $s->obrig, 'rate' => $s->rate, 'required' => $required($s),
        ])->concat(FieldCatalogItem::query()->orderBy('position')->get()->map(fn ($c) => [
            'id' => $c->id, 'name' => $c->name, 'obrig' => (bool) $c->obrig, 'rate' => $c->rate, 'required' => collect(),
        ]))->sortByDesc('obrig')->values();

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
                // The crew on the open shift (current operator first): the visit's
                // services are grouped under them, and each has an "add" button.
                'crew' => $this->crew(),
                // The added service instances (grouped by operator in the app).
                'services' => $instances,
                // The menu to add from (mandatory first, then the catalog).
                'serviceMenu' => $menu,
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

    /**
     * Add a service to the visit under one operator. A service can be added to
     * several operators, but at most ONCE per operator — so this is idempotent
     * on (visit, service, operator). Adding it IS performing it (no done flag).
     * The service_id is a site service, or a catalog item promoted on the fly.
     */
    public function addService(Request $request, FieldSite $site): JsonResponse
    {
        $data = $request->validate([
            'service_id' => ['required', 'string'],
            'shift_id' => ['required', 'string'],
        ]);

        $operator = $this->operatorOnShift($data['shift_id']);
        $serviceId = $this->resolveService($site, $data['service_id']);
        $visit = $this->runningVisit($site);

        FieldServicePerformance::firstOrCreate(
            ['site_performance_id' => $visit->id, 'service_id' => $serviceId, 'assignee_name' => $operator->tech],
            ['assignee' => $this->initials($operator->tech), 'done' => true],
        );

        return $this->show($site);
    }

    /** Remove one added service instance from the visit. */
    public function removeService(FieldSite $site, FieldServicePerformance $performance): JsonResponse
    {
        $visit = $this->runningVisit($site);
        if ($performance->site_performance_id === $visit->id) {
            $performance->delete();
        }

        return $this->show($site);
    }

    /** Record an equipment/consumable used on one service instance. */
    public function addResource(Request $request, FieldSite $site, FieldServicePerformance $performance, FieldResource $resource): JsonResponse
    {
        $this->assertOwnsPerformance($site, $performance);
        if ($resource->company_id !== $site->company_id) {
            throw ValidationException::withMessages(['resource' => 'Recurso não pertence à empresa do site.']);
        }

        $qty = max(1, (int) $request->input('qty', 1));
        $performance->resources()->syncWithoutDetaching([$resource->id => ['qty' => $qty]]);

        return $this->show($site);
    }

    /** Remove a resource from one service instance. */
    public function removeResource(FieldSite $site, FieldServicePerformance $performance, FieldResource $resource): JsonResponse
    {
        $this->assertOwnsPerformance($site, $performance);
        $performance->resources()->detach($resource->id);

        return $this->show($site);
    }

    /** The operator (leader or crew) on the open shift, or a validation error. */
    private function operatorOnShift(string $shiftId): FieldShift
    {
        $shift = FieldShift::active();
        if (! $shift) {
            throw ValidationException::withMessages(['shift' => 'Nenhum turno aberto. Inicie um turno primeiro.']);
        }
        $operator = collect([$shift])->merge($shift->crew)->firstWhere('id', $shiftId);
        if (! $operator) {
            throw ValidationException::withMessages(['shift_id' => 'Operador não está neste turno.']);
        }

        return $operator;
    }

    /** A menu id → a site-service id, promoting a catalog item if needed. */
    private function resolveService(FieldSite $site, string $id): string
    {
        if (FieldService::whereKey($id)->where('site_id', $site->id)->exists()) {
            return $id;
        }

        $item = FieldCatalogItem::findOrFail($id);
        $serviceId = $site->id.':'.$item->id;
        FieldService::firstOrCreate(['id' => $serviceId], [
            'site_id' => $site->id,
            'name' => $item->name,
            'who' => 'AN',
            'who_name' => 'Você',
            'rate' => $item->rate,
            'obrig' => $item->obrig,
            'nest' => [],
            'position' => 90,
        ]);

        return $serviceId;
    }

    /** Guard: the performance instance must belong to this site's running visit. */
    private function assertOwnsPerformance(FieldSite $site, FieldServicePerformance $performance): void
    {
        $visit = $this->runningVisit($site);
        if ($performance->site_performance_id !== $visit->id) {
            throw ValidationException::withMessages(['performance' => 'Serviço não pertence a esta visita.']);
        }
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
