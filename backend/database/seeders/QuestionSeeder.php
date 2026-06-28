<?php

namespace Database\Seeders;

use App\Enums\CategoryType;
use App\Models\Question;
use App\Models\ServiceCategory;
use Illuminate\Database\Seeder;

class QuestionSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedTypeLevel();
        $this->seedPerCategory();
    }

    /**
     * Generic intake questions shown for every category of a type (the fallback,
     * `service_category_id` = null). Category-specific questions extend/override
     * these. Keyed by (type, key) so re-seeding is idempotent.
     */
    private function seedTypeLevel(): void
    {
        $opt = fn (string $v, string $pt, string $en) => ['value' => $v, 'text' => ['pt' => $pt, 'en' => $en]];

        $byType = [
            // Roadside identity comes from the selected asset + per-category questions.
            CategoryType::Roadside->value => [],
            CategoryType::Residential->value => [
                ['key' => 'access', 'type' => 'select', 'text' => ['pt' => 'Quem recebe o profissional?', 'en' => 'Who receives the pro?'], 'options' => [
                    $opt('me', 'Eu mesmo', 'Myself'),
                    $opt('someone', 'Outra pessoa', 'Someone else'),
                    $opt('doorman', 'Portaria', 'Front desk'),
                ]],
                ['key' => 'unit', 'half' => true, 'text' => ['pt' => 'Apto / unidade', 'en' => 'Unit / apt'], 'placeholder' => ['pt' => '42B', 'en' => '42B']],
                ['key' => 'floor', 'half' => true, 'text' => ['pt' => 'Andar', 'en' => 'Floor'], 'placeholder' => ['pt' => '4º', 'en' => '4th']],
            ],
            CategoryType::Beauty->value => [
                ['key' => 'service_for', 'half' => true, 'text' => ['pt' => 'Atendimento para', 'en' => 'Service for'], 'placeholder' => ['pt' => '1 pessoa', 'en' => '1 person']],
                ['key' => 'preferred_time', 'half' => true, 'text' => ['pt' => 'Horário preferido', 'en' => 'Preferred time'], 'placeholder' => ['pt' => 'Tarde', 'en' => 'Afternoon']],
            ],
            CategoryType::Pet->value => [
                ['key' => 'pet_type', 'half' => true, 'text' => ['pt' => 'Tipo de pet', 'en' => 'Pet type'], 'placeholder' => ['pt' => 'Cão', 'en' => 'Dog']],
                ['key' => 'pet_size', 'type' => 'select', 'half' => true, 'text' => ['pt' => 'Porte', 'en' => 'Size'], 'options' => [
                    $opt('small', 'Pequeno', 'Small'),
                    $opt('medium', 'Médio', 'Medium'),
                    $opt('large', 'Grande', 'Large'),
                ]],
            ],
        ];

        foreach ($byType as $type => $questions) {
            $order = 1;
            foreach ($questions as $q) {
                Question::updateOrCreate(
                    ['category_type' => $type, 'service_category_id' => null, 'key' => $q['key']],
                    $this->attrs($q, $order++),
                );
            }
            // Deactivate type-level questions no longer seeded (keep for history).
            Question::where('category_type', $type)
                ->whereNull('service_category_id')
                ->whereNotIn('key', array_column($questions, 'key') ?: ['__none__'])
                ->update(['is_active' => false]);
        }
    }

    /** Custom questions for specific categories (keyed by slug). */
    private function seedPerCategory(): void
    {
        $opt = fn (string $v, string $pt, string $en) => ['value' => $v, 'text' => ['pt' => $pt, 'en' => $en]];
        $yesNo = [$opt('yes', 'Sim', 'Yes'), $opt('no', 'Não', 'No')];

        $bySlug = [
            // ── Roadside ──────────────────────────────────────────
            'guincho' => [
                ['key' => 'destination', 'required' => true, 'text' => ['pt' => 'Para onde rebocar?', 'en' => 'Tow to where?'], 'placeholder' => ['pt' => 'Oficina, casa, concessionária…', 'en' => 'Shop, home, dealer…']],
                ['key' => 'starts', 'type' => 'select', 'text' => ['pt' => 'O veículo liga?', 'en' => 'Does it start?'], 'options' => [
                    $opt('yes', 'Liga normalmente', 'Yes'), $opt('sometimes', 'Às vezes', 'Sometimes'), $opt('no', 'Não liga', 'No'),
                ]],
                ['key' => 'wheels_locked', 'type' => 'select', 'half' => true, 'text' => ['pt' => 'Rodas travadas?', 'en' => 'Wheels locked?'], 'options' => $yesNo],
                ['key' => 'location_type', 'type' => 'select', 'half' => true, 'text' => ['pt' => 'Onde está?', 'en' => 'Where is it?'], 'options' => [
                    $opt('street', 'Rua', 'Street'), $opt('garage', 'Garagem', 'Garage'), $opt('parking', 'Estacionamento', 'Parking lot'),
                ]],
            ],
            'bateria' => [
                ['key' => 'lights', 'type' => 'select', 'text' => ['pt' => 'As luzes do painel acendem?', 'en' => 'Do the dashboard lights turn on?'], 'options' => [
                    $opt('yes', 'Acendem normal', 'Yes'), $opt('weak', 'Fracas', 'Weak'), $opt('no', 'Não acendem', 'No'),
                ]],
                ['key' => 'noise', 'type' => 'select', 'half' => true, 'text' => ['pt' => 'Faz barulho ao tentar ligar?', 'en' => 'Clicks when starting?'], 'options' => $yesNo],
            ],
            'pneu' => [
                ['key' => 'tire_size', 'half' => true, 'text' => ['pt' => 'Medida do pneu', 'en' => 'Tire size'], 'placeholder' => ['pt' => '205/55 R16', 'en' => '205/55 R16']],
                ['key' => 'has_spare', 'type' => 'select', 'half' => true, 'text' => ['pt' => 'Tem estepe?', 'en' => 'Have a spare?'], 'options' => $yesNo],
                ['key' => 'which_tire', 'type' => 'select', 'text' => ['pt' => 'Qual pneu?', 'en' => 'Which tire?'], 'options' => [
                    $opt('fl', 'Dianteiro esq.', 'Front left'), $opt('fr', 'Dianteiro dir.', 'Front right'),
                    $opt('rl', 'Traseiro esq.', 'Rear left'), $opt('rr', 'Traseiro dir.', 'Rear right'),
                ]],
            ],
            'combustivel' => [
                ['key' => 'fuel_type', 'type' => 'select', 'half' => true, 'text' => ['pt' => 'Combustível', 'en' => 'Fuel'], 'options' => [
                    $opt('gasoline', 'Gasolina', 'Gasoline'), $opt('ethanol', 'Etanol', 'Ethanol'), $opt('diesel', 'Diesel', 'Diesel'),
                ]],
                ['key' => 'liters', 'type' => 'number', 'half' => true, 'text' => ['pt' => 'Quantos litros?', 'en' => 'How many liters?'], 'placeholder' => ['pt' => '10', 'en' => '10']],
            ],
            'chaveiro' => [
                ['key' => 'key_inside', 'type' => 'select', 'text' => ['pt' => 'A chave ficou dentro do carro?', 'en' => 'Key locked inside?'], 'options' => $yesNo],
                ['key' => 'key_type', 'type' => 'select', 'half' => true, 'text' => ['pt' => 'Tipo de chave', 'en' => 'Key type'], 'options' => [
                    $opt('common', 'Comum', 'Common'), $opt('switch', 'Canivete', 'Switchblade'), $opt('presence', 'Presença', 'Smart key'),
                ]],
            ],
            'mecanico' => [
                ['key' => 'symptom', 'required' => true, 'text' => ['pt' => 'Qual o sintoma?', 'en' => 'What is the symptom?'], 'placeholder' => ['pt' => 'Barulho, fumaça, falha…', 'en' => 'Noise, smoke, misfire…']],
                ['key' => 'starts', 'type' => 'select', 'half' => true, 'text' => ['pt' => 'O carro liga?', 'en' => 'Does it start?'], 'options' => $yesNo],
            ],

            // ── Residential ───────────────────────────────────────
            'encanador' => [
                ['key' => 'issue', 'type' => 'select', 'required' => true, 'text' => ['pt' => 'Tipo de serviço', 'en' => 'Service type'], 'options' => [
                    $opt('leak', 'Vazamento', 'Leak'), $opt('clog', 'Entupimento', 'Clog'),
                    $opt('install', 'Instalação', 'Installation'), $opt('repair', 'Reparo', 'Repair'),
                ]],
                ['key' => 'location', 'type' => 'select', 'half' => true, 'text' => ['pt' => 'Onde?', 'en' => 'Where?'], 'options' => [
                    $opt('kitchen', 'Cozinha', 'Kitchen'), $opt('bathroom', 'Banheiro', 'Bathroom'),
                    $opt('laundry', 'Área', 'Laundry'), $opt('other', 'Outro', 'Other'),
                ]],
                ['key' => 'water_off', 'type' => 'select', 'half' => true, 'text' => ['pt' => 'A água está fechada?', 'en' => 'Is the water shut off?'], 'options' => $yesNo],
            ],
            'eletricista' => [
                ['key' => 'issue', 'type' => 'select', 'required' => true, 'text' => ['pt' => 'Tipo de serviço', 'en' => 'Service type'], 'options' => [
                    $opt('short', 'Curto-circuito', 'Short circuit'), $opt('install', 'Instalação', 'Installation'),
                    $opt('breaker', 'Disjuntor', 'Breaker'), $opt('outlet', 'Tomada / interruptor', 'Outlet / switch'),
                ]],
                ['key' => 'whole_house', 'type' => 'select', 'half' => true, 'text' => ['pt' => 'Falta luz na casa toda?', 'en' => 'Is the whole house out?'], 'options' => $yesNo],
            ],
            'chaveiro-residencial' => [
                ['key' => 'target', 'type' => 'select', 'text' => ['pt' => 'O que precisa abrir/trocar?', 'en' => 'What needs opening/changing?'], 'options' => [
                    $opt('door', 'Porta', 'Door'), $opt('gate', 'Portão', 'Gate'), $opt('safe', 'Cofre', 'Safe'),
                ]],
                ['key' => 'key_broken', 'type' => 'select', 'half' => true, 'text' => ['pt' => 'Chave quebrou na fechadura?', 'en' => 'Key broke in the lock?'], 'options' => $yesNo],
            ],
            'limpeza' => [
                ['key' => 'size', 'type' => 'select', 'required' => true, 'text' => ['pt' => 'Tamanho do imóvel', 'en' => 'Property size'], 'options' => [
                    $opt('1', '1 quarto', '1 bedroom'), $opt('2', '2 quartos', '2 bedrooms'),
                    $opt('3', '3 quartos', '3 bedrooms'), $opt('4+', '4+ quartos', '4+ bedrooms'),
                ]],
                ['key' => 'cleaning_type', 'type' => 'select', 'text' => ['pt' => 'Tipo de limpeza', 'en' => 'Cleaning type'], 'options' => [
                    $opt('standard', 'Padrão', 'Standard'), $opt('heavy', 'Pesada', 'Heavy'), $opt('post_work', 'Pós-obra', 'Post-construction'),
                ]],
            ],
            'ar-condicionado' => [
                ['key' => 'ac_type', 'type' => 'select', 'half' => true, 'text' => ['pt' => 'Tipo', 'en' => 'Type'], 'options' => [
                    $opt('split', 'Split', 'Split'), $opt('window', 'Janela', 'Window'), $opt('portable', 'Portátil', 'Portable'),
                ]],
                ['key' => 'ac_service', 'type' => 'select', 'text' => ['pt' => 'Serviço', 'en' => 'Service'], 'options' => [
                    $opt('install', 'Instalação', 'Installation'), $opt('clean', 'Limpeza', 'Cleaning'),
                    $opt('recharge', 'Recarga de gás', 'Gas recharge'), $opt('repair', 'Reparo', 'Repair'),
                ]],
            ],
            'montagem-moveis' => [
                ['key' => 'item_count', 'type' => 'number', 'half' => true, 'text' => ['pt' => 'Quantos móveis?', 'en' => 'How many items?'], 'placeholder' => ['pt' => '2', 'en' => '2']],
                ['key' => 'has_manual', 'type' => 'select', 'half' => true, 'text' => ['pt' => 'Tem o manual?', 'en' => 'Have the manual?'], 'options' => $yesNo],
            ],

            // ── Beauty ────────────────────────────────────────────
            'cabeleireiro' => [
                ['key' => 'service', 'type' => 'select', 'required' => true, 'text' => ['pt' => 'Serviço', 'en' => 'Service'], 'options' => [
                    $opt('cut', 'Corte', 'Cut'), $opt('color', 'Coloração', 'Color'),
                    $opt('blowout', 'Escova', 'Blowout'), $opt('treatment', 'Hidratação', 'Treatment'),
                ]],
                ['key' => 'hair_length', 'type' => 'select', 'half' => true, 'text' => ['pt' => 'Comprimento', 'en' => 'Length'], 'options' => [
                    $opt('short', 'Curto', 'Short'), $opt('medium', 'Médio', 'Medium'), $opt('long', 'Longo', 'Long'),
                ]],
            ],
            'manicure' => [
                ['key' => 'mani_service', 'type' => 'select', 'text' => ['pt' => 'Serviço', 'en' => 'Service'], 'options' => [
                    $opt('hands', 'Mãos', 'Hands'), $opt('feet', 'Pés', 'Feet'), $opt('both', 'Mãos e pés', 'Both'),
                ]],
            ],

            // ── Pet ───────────────────────────────────────────────
            'banho-tosa' => [
                ['key' => 'coat', 'type' => 'select', 'half' => true, 'text' => ['pt' => 'Pelagem', 'en' => 'Coat'], 'options' => [
                    $opt('short', 'Curta', 'Short'), $opt('long', 'Longa', 'Long'),
                ]],
            ],
            'veterinario' => [
                ['key' => 'symptom', 'required' => true, 'text' => ['pt' => 'Sintoma / motivo', 'en' => 'Symptom / reason'], 'placeholder' => ['pt' => 'O que está acontecendo?', 'en' => 'What is happening?']],
            ],
        ];

        $categories = ServiceCategory::all()->keyBy('slug');

        foreach ($bySlug as $slug => $questions) {
            $category = $categories->get($slug);
            if (! $category) {
                continue;
            }
            $order = 10; // after the type-level generics
            foreach ($questions as $q) {
                Question::updateOrCreate(
                    ['service_category_id' => $category->id, 'key' => $q['key']],
                    ['category_type' => $category->type->value] + $this->attrs($q, $order++),
                );
            }
            Question::where('service_category_id', $category->id)
                ->whereNotIn('key', array_column($questions, 'key'))
                ->update(['is_active' => false]);
        }
    }

    /**
     * @param  array<string,mixed>  $q
     * @return array<string,mixed>
     */
    private function attrs(array $q, int $order): array
    {
        return [
            'text' => $q['text'],
            'type' => $q['type'] ?? 'text',
            'placeholder' => $q['placeholder'] ?? null,
            'options' => $q['options'] ?? null,
            'half' => $q['half'] ?? false,
            'required' => $q['required'] ?? false,
            'sort_order' => $order,
            'is_active' => true,
        ];
    }
}
