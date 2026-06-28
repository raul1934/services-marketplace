<?php

namespace Database\Seeders;

use App\Models\VehicleMake;
use App\Models\VehicleModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Seeds the vehicle make/model catalog from vendored JSON datasets
 * (cars + motos, sourced from public GitHub datasets, plus a Brazilian-market
 * supplement). Idempotent: merges by make name and skips models that already
 * exist, so `db:seed` and `migrate:fresh --seed` are both safe.
 */
class VehicleCatalogSeeder extends Seeder
{
    /** Each file is an array of { "brand": string, "models": string[] }. */
    private const FILES = ['cars.json', 'motos.json', 'br-supplement.json'];

    public function run(): void
    {
        // Merge all sources by make name (case-insensitive), union of models.
        $merged = []; // lowerName => ['name' => Brand, 'models' => [lowerModel => Model]]
        foreach (self::FILES as $file) {
            $path = database_path("data/{$file}");
            if (! is_file($path)) {
                continue;
            }
            foreach (json_decode(file_get_contents($path), true) ?? [] as $entry) {
                $brand = trim($entry['brand'] ?? '');
                if ($brand === '') {
                    continue;
                }
                $key = mb_strtolower($brand);
                $merged[$key] ??= ['name' => $brand, 'models' => []];
                foreach ($entry['models'] ?? [] as $model) {
                    $model = trim((string) $model);
                    if ($model !== '') {
                        $merged[$key]['models'][mb_strtolower($model)] ??= $model;
                    }
                }
            }
        }

        // Brand logos, matched by name slug. Cars: vendored PNGs
        // (filippofilip95/car-logos-dataset) self-hosted on the public disk.
        // Motorcycles & others: CDN URLs (Wikimedia Commons) — not saved locally.
        $logoDir = database_path('data/car-logos');
        $motoPath = database_path('data/moto-logos.json');
        $motoLogos = is_file($motoPath) ? (json_decode(file_get_contents($motoPath), true) ?? []) : [];

        foreach ($merged as $entry) {
            $make = VehicleMake::firstOrCreate(['name' => $entry['name']]);
            $slug = Str::slug($entry['name']);

            $src = "{$logoDir}/{$slug}.png";
            if (is_file($src)) {
                // Self-hosted vendored PNG (published to the public disk).
                $diskPath = "car-logos/{$slug}.png";
                if (! Storage::disk('public')->exists($diskPath)) {
                    Storage::disk('public')->put($diskPath, file_get_contents($src));
                }
                if ($make->logo_path !== $diskPath) {
                    $make->update(['logo_path' => $diskPath]);
                }
            } elseif (isset($motoLogos[$slug]) && $make->logo_path !== $motoLogos[$slug]) {
                // CDN URL (stored as-is; the resource returns it directly).
                $make->update(['logo_path' => $motoLogos[$slug]]);
            }

            $existing = $make->models()->pluck('name')->map(fn ($n) => mb_strtolower($n))->all();
            $existing = array_flip($existing);

            $rows = [];
            foreach ($entry['models'] as $lower => $name) {
                if (! isset($existing[$lower])) {
                    $rows[] = ['vehicle_make_id' => $make->id, 'name' => $name, 'created_at' => now(), 'updated_at' => now()];
                }
            }
            foreach (array_chunk($rows, 500) as $chunk) {
                VehicleModel::insertOrIgnore($chunk);
            }
        }
    }
}
