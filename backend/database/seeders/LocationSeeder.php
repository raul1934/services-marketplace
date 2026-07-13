<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Country;
use App\Models\State;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;

/**
 * Country -> State -> City reference data, sourced from IBGE (official Brazilian
 * geography API). Idempotent and safe to run on every deploy:
 *   - country/states use updateOrCreate (cheap, ~27 rows)
 *   - cities are seeded once (bulk insert) and skipped if already present
 *
 * Brazil only for now; the schema (cities.state_id -> states.country_id) already
 * supports adding other countries later.
 */
class LocationSeeder extends Seeder
{
    private const IBGE_STATES = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';

    private const IBGE_CITIES = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios';

    public function run(): void
    {
        $brazil = Country::updateOrCreate(
            ['iso2' => 'BR'],
            ['name' => 'Brasil', 'iso3' => 'BRA', 'dial_code' => '+55'],
        );

        $this->seedStates($brazil);
        $this->seedCities();
    }

    private function seedStates(Country $country): void
    {
        if ($country->states()->count() >= 27) {
            return;
        }

        $resp = Http::timeout(60)->retry(2, 500)->get(self::IBGE_STATES);
        if (! $resp->ok()) {
            $this->command?->warn('IBGE (estados) indisponível — estados não semeados.');

            return;
        }

        foreach ($resp->json() as $uf) {
            State::updateOrCreate(
                ['ibge_id' => $uf['id']],
                ['country_id' => $country->id, 'name' => $uf['nome'], 'uf' => $uf['sigla']],
            );
        }

        $this->command?->info('Estados IBGE semeados: '.$country->states()->count());
    }

    private function seedCities(): void
    {
        if (City::query()->exists()) {
            return; // seed-once: municipalities don't change often
        }

        $resp = Http::timeout(120)->retry(2, 800)->get(self::IBGE_CITIES);
        if (! $resp->ok()) {
            $this->command?->warn('IBGE (municípios) indisponível — cidades não semeadas.');

            return;
        }

        // IBGE state id -> our states.id
        $stateIdByIbge = State::pluck('id', 'ibge_id');
        $now = now();

        $rows = collect($resp->json())
            ->map(function (array $m) use ($stateIdByIbge, $now) {
                $ufIbge = data_get($m, 'microrregiao.mesorregiao.UF.id')
                    ?? data_get($m, 'regiao-imediata.regiao-intermediaria.UF.id');

                return [
                    'ibge_id' => $m['id'] ?? null,
                    'state_id' => $stateIdByIbge[$ufIbge] ?? null,
                    'name' => $m['nome'] ?? '',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            })
            ->filter(fn ($r) => $r['name'] !== '' && $r['state_id'] !== null)
            ->values();

        $rows->chunk(1000)->each(fn ($chunk) => City::insert($chunk->all()));

        $this->command?->info('Cidades IBGE semeadas: '.$rows->count());
    }
}
