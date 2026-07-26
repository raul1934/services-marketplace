<?php

namespace Database\Seeders;

use App\Models\Field\FieldCatalogItem;
use App\Models\Field\FieldCompany;
use App\Models\Field\FieldResource;
use App\Models\Field\FieldResourceCategory;
use App\Models\Field\FieldRoute;
use App\Models\Field\FieldRoutePerformance;
use App\Models\Field\FieldRouteStop;
use App\Models\Field\FieldService;
use App\Models\Field\FieldServicePerformance;
use App\Models\Field\FieldShift;
use App\Models\Field\FieldSite;
use App\Models\Field\FieldSitePerformance;
use Illuminate\Database\Seeder;

/**
 * Seeds the field module to match the provider app's prototype state: six
 * sites, two routes, a company catalog (definitions), plus one open master
 * shift whose execution reproduces the screens — Centro–Norte running with
 * Villa done (1x), Rio Fortore in progress (now), the rest upcoming.
 */
class FieldServiceSeeder extends Seeder
{
    public function run(): void
    {
        $this->definitions();
        $this->execution();
    }

    /** Master data: sites + their services, route templates, add-on catalog. */
    private function definitions(): void
    {
        // Companies own the sites and the resource catalogs. The `contract`
        // label on each site is kept; `company_id` is its slug.
        $companies = ['nadruz' => 'Nadruz', 'pacco' => 'Pacco'];
        foreach ($companies as $id => $name) {
            FieldCompany::updateOrCreate(['id' => $id], ['name' => $name]);
        }

        $sites = [
            ['id' => 'rio-fortore', 'name' => 'Cond. Rio Fortore', 'contract' => 'Nadruz', 'address' => 'Av. Anísio Haddad, 2000', 'lat' => -20.815, 'lng' => -49.38, 'services' => [
                ['id' => 'bomba', 'name' => "Bomba d'água — preventiva", 'who' => 'AN', 'who_name' => 'Você', 'rate' => 'visit', 'obrig' => true, 'nest' => [
                    ['icon' => '🔧', 'label' => 'Multímetro', 'sub' => 'equipamento', 'value' => '1h'],
                    ['icon' => '📦', 'label' => 'Pressostato', 'sub' => 'material', 'value' => 'cobra à parte', 'tone' => 'charge'],
                    ['icon' => '✓', 'label' => 'Checklist da bomba', 'sub' => '', 'value' => '2/2'],
                ]],
                ['id' => 'quadro', 'name' => 'Quadro elétrico — revisão', 'who' => 'BR', 'who_name' => 'Bruno', 'rate' => 'hour', 'obrig' => true, 'nest' => [
                    ['icon' => '🔧', 'label' => 'Alicate-amperímetro', 'sub' => 'equipamento', 'value' => '1,5h'],
                ]],
                ['id' => 'portao', 'name' => 'Portão automático — lubrificação', 'who' => 'CA', 'who_name' => 'Carla', 'rate' => 'visit', 'obrig' => false, 'nest' => [
                    ['icon' => '📦', 'label' => 'Graxa', 'sub' => 'material', 'value' => 'sem custo', 'tone' => 'free'],
                ]],
            ]],
            ['id' => 'solar', 'name' => 'Ed. Solar das Palmeiras', 'contract' => 'Pacco', 'address' => 'Av. Bady Bassitt, 3200', 'lat' => -20.805, 'lng' => -49.372, 'services' => [
                ['id' => 'gerador', 'name' => 'Gerador — teste de carga', 'who' => 'AN', 'who_name' => 'Você', 'rate' => 'hour', 'obrig' => true, 'nest' => [
                    ['icon' => '🔧', 'label' => 'Alicate-amperímetro', 'sub' => 'equipamento', 'value' => '1h'],
                    ['icon' => '📦', 'label' => 'Diesel', 'sub' => 'material', 'value' => 'cobra à parte', 'tone' => 'charge'],
                ]],
                ['id' => 'ar', 'name' => 'Ar-condicionado — limpeza', 'who' => 'BR', 'who_name' => 'Bruno', 'rate' => 'visit', 'obrig' => false, 'nest' => [
                    ['icon' => '📦', 'label' => 'Gás R-410', 'sub' => 'material', 'value' => 'cobra à parte', 'tone' => 'charge'],
                ]],
            ]],
            ['id' => 'villa', 'name' => 'Cond. Villa Toscana', 'contract' => 'Pacco', 'address' => 'R. Cel. Spínola de Castro, 3100', 'lat' => -20.82, 'lng' => -49.388, 'services' => [
                ['id' => 'elevador', 'name' => 'Elevador — inspeção mensal', 'who' => 'AN', 'who_name' => 'Você', 'rate' => 'visit', 'obrig' => true, 'nest' => [
                    ['icon' => '✓', 'label' => 'Checklist do elevador', 'sub' => '', 'value' => '5/5'],
                ]],
                ['id' => 'portao', 'name' => 'Portão social — lubrificação', 'who' => 'CA', 'who_name' => 'Carla', 'rate' => 'visit', 'obrig' => false, 'nest' => [
                    ['icon' => '📦', 'label' => 'Graxa', 'sub' => 'material', 'value' => 'sem custo', 'tone' => 'free'],
                ]],
            ]],
            ['id' => 'anavec', 'name' => 'Ed. Anavec', 'contract' => 'Nadruz', 'address' => 'R. Silva Jardim, 890', 'lat' => -20.8, 'lng' => -49.365, 'services' => [
                ['id' => 'quadro-geral', 'name' => 'Quadro geral — termografia', 'who' => 'BR', 'who_name' => 'Bruno', 'rate' => 'hour', 'obrig' => true, 'nest' => [
                    ['icon' => '🔧', 'label' => 'Câmera termográfica', 'sub' => 'equipamento', 'value' => '1h'],
                ]],
                ['id' => 'iluminacao', 'name' => 'Iluminação — manutenção', 'who' => 'AN', 'who_name' => 'Você', 'rate' => 'visit', 'obrig' => false, 'nest' => [
                    ['icon' => '📦', 'label' => 'Lâmpadas LED', 'sub' => 'material', 'value' => 'cobra à parte', 'tone' => 'charge'],
                ]],
            ]],
            ['id' => 'represa', 'name' => 'Cond. Represa', 'contract' => 'Pacco', 'address' => 'R. da Represa, 450', 'lat' => -20.83, 'lng' => -49.395, 'services' => [
                ['id' => 'bomba-piscina', 'name' => 'Bomba da piscina — preventiva', 'who' => 'AN', 'who_name' => 'Você', 'rate' => 'visit', 'obrig' => true, 'nest' => [
                    ['icon' => '📦', 'label' => 'Selo mecânico', 'sub' => 'material', 'value' => 'sem custo', 'tone' => 'free'],
                ]],
                ['id' => 'jardim', 'name' => 'Irrigação do jardim — revisão', 'who' => 'CA', 'who_name' => 'Carla', 'rate' => 'visit', 'obrig' => false, 'nest' => []],
            ]],
            ['id' => 'damha', 'name' => 'Res. Damha', 'contract' => 'Nadruz', 'address' => 'Av. Damha, 1200', 'lat' => -20.795, 'lng' => -49.36, 'services' => [
                ['id' => 'guarita', 'name' => 'Guarita — CFTV e cerca elétrica', 'who' => 'BR', 'who_name' => 'Bruno', 'rate' => 'hour', 'obrig' => true, 'nest' => [
                    ['icon' => '🔧', 'label' => 'Multímetro', 'sub' => 'equipamento', 'value' => '1h'],
                ]],
            ]],
        ];

        $serviceIds = [];
        foreach ($sites as $site) {
            $services = $site['services'];
            unset($site['services']);
            $site['company_id'] = strtolower($site['contract']);
            $site['geofence'] = $this->geofence($site['lat'], $site['lng'], $site['id']);
            FieldSite::updateOrCreate(['id' => $site['id']], $site);

            foreach ($services as $i => $svc) {
                $id = $site['id'].':'.$svc['id'];
                $serviceIds[] = $id;
                FieldService::updateOrCreate(
                    ['id' => $id],
                    [
                        'site_id' => $site['id'],
                        'name' => $svc['name'],
                        'who' => $svc['who'],
                        'who_name' => $svc['who_name'],
                        'rate' => $svc['rate'],
                        'obrig' => $svc['obrig'],
                        'nest' => $svc['nest'],
                        'position' => $i,
                    ],
                );
            }
        }

        // Drop services promoted from the catalog in earlier runs so re-seeding
        // is deterministic (keeps only the canonical set above).
        FieldService::whereNotIn('id', $serviceIds)->delete();

        $routes = [
            ['id' => 'centro-norte', 'name' => 'Centro–Norte', 'km' => 18, 'stops' => [['villa', '0,0'], ['rio-fortore', '1,2'], ['solar', '3,8'], ['anavec', '5,1']]],
            ['id' => 'sul', 'name' => 'Sul', 'km' => 12, 'stops' => [['represa', '0,0'], ['damha', '2,4'], ['anavec', '4,8']]],
        ];

        foreach ($routes as $route) {
            $stops = $route['stops'];
            unset($route['stops']);
            FieldRoute::updateOrCreate(['id' => $route['id']], $route);
            FieldRouteStop::where('route_id', $route['id'])->delete();
            foreach ($stops as $i => [$siteId, $km]) {
                FieldRouteStop::create(['route_id' => $route['id'], 'site_id' => $siteId, 'km' => $km, 'position' => $i]);
            }
        }

        $catalog = [
            ['id' => 'para-raios', 'name' => 'Para-raios — inspeção', 'rate' => 'visit', 'obrig' => true],
            ['id' => 'hidrante', 'name' => 'Hidrante — teste de pressão', 'rate' => 'visit', 'obrig' => false],
            ['id' => 'cftv', 'name' => 'CFTV — verificação', 'rate' => 'hour', 'obrig' => false],
            ['id' => 'bomba-incendio', 'name' => 'Bomba de incêndio — teste', 'rate' => 'visit', 'obrig' => true],
        ];
        foreach ($catalog as $i => $item) {
            FieldCatalogItem::updateOrCreate(['id' => $item['id']], $item + ['position' => $i]);
        }

        $this->resourceCatalog();
    }

    /**
     * Each company's equipment/consumable catalog, with categories (N:N). The
     * items mirror what the services already reference in their `nest`, so the
     * picker (Phase 3) offers exactly what the demo shows.
     */
    private function resourceCatalog(): void
    {
        $catalogs = [
            'nadruz' => [
                'categories' => [
                    'equipment' => ['medicao' => 'Medição', 'eletrica' => 'Elétrica'],
                    'consumable' => ['pecas' => 'Peças', 'lubrificantes' => 'Lubrificantes'],
                ],
                'resources' => [
                    // [slug, name, kind, rate|cost, [category slugs]]
                    ['multimetro', 'Multímetro', 'equipment', 'hour', ['medicao', 'eletrica']],
                    ['alicate', 'Alicate-amperímetro', 'equipment', 'hour', ['medicao', 'eletrica']],
                    ['termografica', 'Câmera termográfica', 'equipment', 'hour', ['medicao']],
                    ['pressostato', 'Pressostato', 'consumable', 'charged', ['pecas']],
                    ['graxa', 'Graxa', 'consumable', 'free', ['lubrificantes']],
                    ['led', 'Lâmpadas LED', 'consumable', 'charged', ['pecas']],
                ],
            ],
            'pacco' => [
                'categories' => [
                    'equipment' => ['climatizacao' => 'Climatização', 'eletrica' => 'Elétrica'],
                    'consumable' => ['gases' => 'Gases', 'pecas' => 'Peças'],
                ],
                'resources' => [
                    ['alicate', 'Alicate-amperímetro', 'equipment', 'hour', ['eletrica']],
                    ['manifold', 'Manifold', 'equipment', 'visit', ['climatizacao']],
                    ['vacuometro', 'Vacuômetro', 'equipment', 'hour', ['climatizacao']],
                    ['gas-r410', 'Gás R-410', 'consumable', 'charged', ['gases']],
                    ['diesel', 'Diesel', 'consumable', 'charged', ['gases']],
                    ['selo', 'Selo mecânico', 'consumable', 'free', ['pecas']],
                ],
            ],
        ];

        foreach ($catalogs as $companyId => $cat) {
            $catPos = 0;
            foreach ($cat['categories'] as $kind => $cats) {
                foreach ($cats as $slug => $name) {
                    FieldResourceCategory::updateOrCreate(
                        ['id' => "$companyId:cat:$slug"],
                        ['company_id' => $companyId, 'kind' => $kind, 'name' => $name, 'position' => $catPos++],
                    );
                }
            }

            foreach ($cat['resources'] as $i => [$slug, $name, $kind, $rateOrCost, $catSlugs]) {
                $resource = FieldResource::updateOrCreate(
                    ['id' => "$companyId:res:$slug"],
                    [
                        'company_id' => $companyId,
                        'kind' => $kind,
                        'name' => $name,
                        'rate' => $kind === 'equipment' ? $rateOrCost : null,
                        'cost' => $kind === 'consumable' ? $rateOrCost : null,
                        'position' => $i,
                    ],
                );
                $resource->categories()->sync(array_map(fn ($c) => "$companyId:cat:$c", $catSlugs));
            }
        }
    }

    /**
     * A rectangular geofence around the site — sized a bit differently per site
     * (from its id) so the sides read as distinct lengths on the map.
     *
     * @return array<int, array{lat: float, lng: float}>
     */
    private function geofence(float $lat, float $lng, string $id): array
    {
        $seed = crc32($id);
        $halfW = 40 + ($seed % 40);          // 40–79 m
        $halfH = 35 + (intdiv($seed, 8) % 45); // 35–79 m
        $dLat = $halfH / 111320.0;
        $dLng = $halfW / (111320.0 * cos(deg2rad($lat)));

        return [
            ['lat' => $lat - $dLat, 'lng' => $lng - $dLng],
            ['lat' => $lat - $dLat, 'lng' => $lng + $dLng],
            ['lat' => $lat + $dLat, 'lng' => $lng + $dLng],
            ['lat' => $lat + $dLat, 'lng' => $lng - $dLng],
        ];
    }

    /** Reproduces the app's live state: an open shift mid-route. */
    private function execution(): void
    {
        // Wipe prior execution so re-seeding is idempotent.
        FieldShift::query()->delete(); // cascades to route/site/service performances

        // ── Today's open master shift + one crew member ──
        $master = FieldShift::create([
            'id' => 'shift-master-today',
            'shift_leader_id' => 'shift-master-today', // self → master
            'tech' => 'Você',
            'date' => today(),
            'status' => 'active',
            'started_at' => now()->subMinutes(50),
        ]);
        FieldShift::create([
            'id' => 'shift-crew-bruno',
            'shift_leader_id' => $master->id, // crew member of the master
            'tech' => 'Bruno',
            'date' => today(),
            'status' => 'active',
            'started_at' => now()->setTime(7, 50),
        ]);

        // Centro–Norte is being run.
        $cn = FieldRoutePerformance::create([
            'shift_id' => $master->id,
            'route_id' => 'centro-norte',
            'status' => 'running',
            'started_at' => now()->setTime(7, 55),
        ]);

        // Villa: visited (done → stop shows 1x).
        $villa = FieldSitePerformance::create([
            'shift_id' => $master->id, 'route_performance_id' => $cn->id, 'site_id' => 'villa',
            'status' => 'done', 'crew' => 2, 'time' => '8:00',
            'started_at' => now()->setTime(8, 0), 'ended_at' => now()->setTime(8, 25),
        ]);
        FieldServicePerformance::create(['site_performance_id' => $villa->id, 'service_id' => 'villa:elevador', 'done' => true]);
        FieldServicePerformance::create(['site_performance_id' => $villa->id, 'service_id' => 'villa:portao', 'done' => true]);

        // Rio Fortore: in progress (running → stop shows "now", site shows running).
        // No services pre-selected — a visit starts with nothing checked; the
        // tech marks each service as it's performed.
        FieldSitePerformance::create([
            'shift_id' => $master->id, 'route_performance_id' => $cn->id, 'site_id' => 'rio-fortore',
            'status' => 'running', 'crew' => 3, 'time' => '8:33',
            'started_at' => now()->subMinutes(11),
        ]);

        // ── Yesterday's closed shift (feeds the performances screen + history) ──
        $yst = FieldShift::create([
            'id' => 'shift-yesterday',
            'shift_leader_id' => 'shift-yesterday',
            'tech' => 'Você',
            'date' => today()->subDay(),
            'status' => 'done',
            'started_at' => now()->subDay()->setTime(8, 0),
            'ended_at' => now()->subDay()->setTime(17, 0),
        ]);
        foreach ([['villa', 2, '16:10'], ['anavec', 3, '11:05'], ['solar', 2, '9:58']] as [$siteId, $crew, $time]) {
            $p = FieldSitePerformance::create([
                'shift_id' => $yst->id, 'site_id' => $siteId, 'status' => 'done', 'crew' => $crew, 'time' => $time,
                'started_at' => now()->subDay(), 'ended_at' => now()->subDay(),
            ]);
            $p->forceFill(['created_at' => now()->subDay(), 'updated_at' => now()->subDay()])->saveQuietly();
        }
    }
}
