<?php

namespace Database\Seeders;

use App\Enums\CategoryType;
use App\Models\ServiceCategory;
use Illuminate\Database\Seeder;

class ServiceCategorySeeder extends Seeder
{
    public function run(): void
    {
        $roadside = [
            ['slug' => 'guincho', 'name' => 'Guincho', 'icon' => 'truck'],
            ['slug' => 'bateria', 'name' => 'Bateria', 'icon' => 'battery'],
            ['slug' => 'pneu', 'name' => 'Troca de Pneu', 'icon' => 'car'],
            ['slug' => 'combustivel', 'name' => 'Combustível', 'icon' => 'drop'],
            ['slug' => 'chaveiro', 'name' => 'Chaveiro (carro)', 'icon' => 'key'],
            ['slug' => 'mecanico', 'name' => 'Mecânico Móvel', 'icon' => 'wrench'],
            ['slug' => 'eletrica-automotiva', 'name' => 'Elétrica Automotiva', 'icon' => 'flash'],
            ['slug' => 'vidro-automotivo', 'name' => 'Vidro / Parabrisa', 'icon' => 'car'],
            ['slug' => 'funilaria', 'name' => 'Funilaria e Pintura', 'icon' => 'car'],
            ['slug' => 'lavagem-auto', 'name' => 'Lavagem a Domicílio', 'icon' => 'drop'],
            ['slug' => 'pelicula', 'name' => 'Película / Insulfilm', 'icon' => 'car'],
            ['slug' => 'troca-oleo', 'name' => 'Troca de Óleo', 'icon' => 'drop'],
        ];

        $residential = [
            ['slug' => 'encanador', 'name' => 'Encanador', 'icon' => 'drop'],
            ['slug' => 'eletricista', 'name' => 'Eletricista', 'icon' => 'flash'],
            ['slug' => 'pintor', 'name' => 'Pintor', 'icon' => 'sparkles'],
            ['slug' => 'pedreiro', 'name' => 'Pedreiro', 'icon' => 'wrench'],
            ['slug' => 'montagem-moveis', 'name' => 'Montagem de Móveis', 'icon' => 'wrench'],
            ['slug' => 'limpeza', 'name' => 'Limpeza / Diarista', 'icon' => 'sparkles'],
            ['slug' => 'jardinagem', 'name' => 'Jardinagem', 'icon' => 'drop'],
            ['slug' => 'dedetizacao', 'name' => 'Dedetização', 'icon' => 'shield'],
            ['slug' => 'ar-condicionado', 'name' => 'Ar-condicionado', 'icon' => 'flash'],
            ['slug' => 'chaveiro-residencial', 'name' => 'Chaveiro Residencial', 'icon' => 'key'],
            ['slug' => 'vidracaria', 'name' => 'Vidraçaria', 'icon' => 'home'],
            ['slug' => 'reparos-gerais', 'name' => 'Reparos Gerais', 'icon' => 'wrench'],
            ['slug' => 'desentupimento', 'name' => 'Desentupimento', 'icon' => 'drop'],
            ['slug' => 'telhados-calhas', 'name' => 'Telhados e Calhas', 'icon' => 'home'],
            ['slug' => 'cameras-seguranca', 'name' => 'Câmeras e Segurança', 'icon' => 'camera'],
            ['slug' => 'redes-internet', 'name' => 'Redes e Internet', 'icon' => 'wifi'],
            ['slug' => 'gesso-drywall', 'name' => 'Gesso e Drywall', 'icon' => 'wrench'],
            ['slug' => 'impermeabilizacao', 'name' => 'Impermeabilização', 'icon' => 'drop'],
            ['slug' => 'marceneiro', 'name' => 'Marceneiro', 'icon' => 'wrench'],
            ['slug' => 'serralheiro', 'name' => 'Serralheiro', 'icon' => 'wrench'],
            ['slug' => 'portao-automatico', 'name' => 'Portão Automático', 'icon' => 'settings'],
            ['slug' => 'mudanca-frete', 'name' => 'Mudança / Frete', 'icon' => 'truck'],
            ['slug' => 'piscina', 'name' => 'Piscina (manutenção)', 'icon' => 'drop'],
            ['slug' => 'gas', 'name' => 'Gás (instalação)', 'icon' => 'flash'],
            ['slug' => 'energia-solar', 'name' => 'Energia Solar', 'icon' => 'flash'],
            ['slug' => 'automacao-residencial', 'name' => 'Automação Residencial', 'icon' => 'settings'],
            ['slug' => 'limpeza-pos-obra', 'name' => 'Limpeza Pós-obra', 'icon' => 'sparkles'],
            ['slug' => 'lavagem-estofados', 'name' => 'Lavagem de Estofados', 'icon' => 'sparkles'],
            ['slug' => 'piso-azulejo', 'name' => 'Piso e Azulejo', 'icon' => 'wrench'],
            ['slug' => 'aquecedor', 'name' => 'Aquecedor / Boiler', 'icon' => 'flash'],
        ];

        $beauty = [
            ['slug' => 'cabeleireiro', 'name' => 'Cabeleireiro', 'icon' => 'scissors'],
            ['slug' => 'barbeiro', 'name' => 'Barbeiro', 'icon' => 'scissors'],
            ['slug' => 'manicure', 'name' => 'Manicure e Pedicure', 'icon' => 'sparkles'],
            ['slug' => 'maquiagem', 'name' => 'Maquiagem', 'icon' => 'sparkles'],
            ['slug' => 'depilacao', 'name' => 'Depilação', 'icon' => 'sparkles'],
            ['slug' => 'massagem', 'name' => 'Massagem', 'icon' => 'heart'],
            ['slug' => 'personal-trainer', 'name' => 'Personal Trainer', 'icon' => 'heart'],
            ['slug' => 'esteticista', 'name' => 'Esteticista', 'icon' => 'sparkles'],
        ];

        $pet = [
            ['slug' => 'banho-tosa', 'name' => 'Banho e Tosa', 'icon' => 'paw'],
            ['slug' => 'passeador-caes', 'name' => 'Passeador de Cães', 'icon' => 'paw'],
            ['slug' => 'adestrador', 'name' => 'Adestrador', 'icon' => 'paw'],
            ['slug' => 'veterinario', 'name' => 'Veterinário a Domicílio', 'icon' => 'heart'],
            ['slug' => 'pet-sitter', 'name' => 'Pet Sitter', 'icon' => 'heart'],
        ];

        $order = 1;

        $groups = [
            [CategoryType::Roadside, $roadside],
            [CategoryType::Residential, $residential],
            [CategoryType::Beauty, $beauty],
            [CategoryType::Pet, $pet],
        ];

        foreach ($groups as [$type, $list]) {
            foreach ($list as $data) {
                ServiceCategory::updateOrCreate(
                    ['slug' => $data['slug']],
                    [
                        'type' => $type->value,
                        'name' => $data['name'],
                        'icon' => $data['icon'],
                        'sort_order' => $order++,
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
