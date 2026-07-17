<?php

namespace Database\Seeders;

use App\Models\PartType;
use App\Models\PropertyType;
use Illuminate\Database\Seeder;

/**
 * Seeds the part catalog and which parts each property type suggests. Idempotent.
 *
 * A `*` marks a part as pre-ticked for that type — an edícula almost always has
 * a pool, a casa might not. Pre-ticking is safe because a part is an **empty
 * slot to measure** (`area` stays null → "Sem medição"), not a claim about the
 * place. That is the line: we may pre-select *choices*, never invent *facts*.
 * Untick what isn't there and nothing is created.
 */
class PartTypeSeeder extends Seeder
{
    /** slug => display name, in the order they should appear. */
    private const PARTS = [
        'sala' => 'Sala',
        'quarto' => 'Quarto',
        'cozinha' => 'Cozinha',
        'banheiro' => 'Banheiro',
        'area-servico' => 'Área de serviço',
        'varanda' => 'Varanda',
        'quintal' => 'Quintal',
        'garagem' => 'Garagem',
        'telhado' => 'Telhado',
        'piscina' => 'Piscina',
        'fachada' => 'Fachada',
        'laje' => 'Laje',
        'muro' => 'Muro',
        'hall' => 'Hall',
        'salao-festas' => 'Salão de festas',
        'playground' => 'Playground',
        'guarita' => 'Guarita',
        'estoque' => 'Estoque',
        'vitrine' => 'Vitrine',
        'terreno' => 'Terreno',
        'pomar' => 'Pomar',
        'curral' => 'Curral',
        'vaga' => 'Vaga',
    ];

    /** property type => part slugs; a trailing `*` means pre-ticked. */
    private const BY_TYPE = [
        'Apartamento' => ['sala*', 'quarto*', 'cozinha*', 'banheiro*', 'area-servico*', 'varanda'],
        'Casa' => ['sala*', 'quarto*', 'cozinha*', 'banheiro*', 'area-servico*', 'quintal*', 'garagem', 'telhado', 'muro', 'piscina'],
        'Casa em condomínio' => ['sala*', 'quarto*', 'cozinha*', 'banheiro*', 'area-servico*', 'quintal*', 'garagem*', 'telhado', 'piscina'],
        'Sobrado' => ['sala*', 'quarto*', 'cozinha*', 'banheiro*', 'area-servico*', 'quintal*', 'garagem*', 'telhado', 'laje'],
        'Cobertura' => ['sala*', 'quarto*', 'cozinha*', 'banheiro*', 'area-servico*', 'varanda*', 'laje', 'piscina'],
        'Kitnet/Studio' => ['sala*', 'cozinha*', 'banheiro*'],
        'Flat' => ['sala*', 'quarto*', 'banheiro*', 'cozinha'],
        // The user's own example: an edícula almost always comes with the pool.
        'Edícula' => ['sala*', 'cozinha*', 'banheiro*', 'piscina*', 'quintal*', 'quarto', 'telhado', 'laje'],
        'Sala comercial' => ['sala*', 'banheiro*', 'cozinha'],
        'Loja' => ['sala*', 'banheiro*', 'vitrine*', 'estoque'],
        'Galpão' => ['sala*', 'banheiro*', 'estoque*', 'telhado*', 'fachada'],
        'Terreno' => ['terreno*', 'muro'],
        'Chácara/Sítio' => ['sala*', 'quarto*', 'cozinha*', 'banheiro*', 'quintal*', 'piscina', 'pomar', 'telhado', 'muro'],
        'Fazenda' => ['sala*', 'quarto*', 'cozinha*', 'banheiro*', 'curral', 'pomar', 'telhado'],
        'Garagem/Vaga' => ['vaga*'],
    ];

    public function run(): void
    {
        $parts = [];
        $position = 0;
        foreach (self::PARTS as $slug => $name) {
            $parts[$slug] = PartType::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'position' => $position++],
            );
        }

        foreach (self::BY_TYPE as $typeName => $slugs) {
            $type = PropertyType::where('name', $typeName)->first();
            // A property type this seeder doesn't know about isn't an error —
            // the catalog can grow from either side.
            if (! $type) {
                continue;
            }

            $sync = [];
            foreach ($slugs as $entry) {
                $preTicked = str_ends_with($entry, '*');
                $slug = rtrim($entry, '*');
                if (isset($parts[$slug])) {
                    $sync[$parts[$slug]->id] = ['default_selected' => $preTicked];
                }
            }
            // sync() so re-running reflects edits here rather than only ever
            // adding — the pivot carries no data worth preserving.
            $type->partTypes()->sync($sync);
        }
    }
}
