<?php

namespace Database\Seeders;

use App\Enums\CategoryType;
use App\Models\QuestionSuggestion;
use Illuminate\Database\Seeder;

/**
 * Type-level suggested pre-bid questions, one row per language. Idempotent by
 * (category_type, service_category_id=null, key, lang). Category-specific
 * suggestions (service_category_id set) can be added later without touching these.
 */
class QuestionSuggestionSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->data() as $type => $suggestions) {
            $order = 0;
            foreach ($suggestions as $s) {
                $order += 10;
                foreach (['pt', 'en'] as $lang) {
                    QuestionSuggestion::updateOrCreate(
                        ['category_type' => $type, 'service_category_id' => null, 'key' => $s['key'], 'lang' => $lang],
                        [
                            'text' => $s[$lang],
                            'image_required' => $s['image_required'] ?? false,
                            'sort_order' => $order,
                            'is_active' => true,
                        ],
                    );
                }
            }
        }
    }

    /** @return array<string, array<int, array<string, mixed>>> */
    private function data(): array
    {
        return [
            CategoryType::Roadside->value => [
                ['key' => 'vehicle', 'pt' => 'Qual a marca e o modelo do veículo?', 'en' => "What's the make and model of the vehicle?"],
                ['key' => 'safe_spot', 'pt' => 'O veículo está em local seguro e acessível?', 'en' => 'Is the vehicle in a safe, accessible spot?'],
                ['key' => 'photo', 'image_required' => true, 'pt' => 'Pode enviar uma foto do problema?', 'en' => 'Can you send a photo of the issue?'],
                ['key' => 'transmission', 'pt' => 'O câmbio é automático ou manual?', 'en' => 'Is the transmission automatic or manual?'],
            ],
            CategoryType::Residential->value => [
                ['key' => 'photo', 'image_required' => true, 'pt' => 'Pode enviar uma foto do local/problema?', 'en' => 'Can you send a photo of the spot/issue?'],
                ['key' => 'since_when', 'pt' => 'Há quanto tempo o problema começou?', 'en' => 'How long has the problem been happening?'],
                ['key' => 'materials', 'pt' => 'Você já tem o material ou eu levo?', 'en' => 'Do you already have the materials or should I bring them?'],
                ['key' => 'best_time', 'pt' => 'Qual o melhor horário para o atendimento?', 'en' => "What's the best time for the visit?"],
            ],
            CategoryType::Condo->value => [
                ['key' => 'time_restriction', 'pt' => 'Há restrição de horário no condomínio?', 'en' => 'Are there time restrictions at the building?'],
                ['key' => 'authorization', 'pt' => 'Preciso de autorização prévia na portaria?', 'en' => 'Do I need prior authorization at the front desk?'],
                ['key' => 'floor_elevator', 'pt' => 'Qual o andar e há elevador?', 'en' => 'Which floor, and is there an elevator?'],
                ['key' => 'photo', 'image_required' => true, 'pt' => 'Pode enviar uma foto do local?', 'en' => 'Can you send a photo of the spot?'],
            ],
            CategoryType::Beauty->value => [
                ['key' => 'procedure', 'pt' => 'Qual procedimento você deseja?', 'en' => 'Which procedure would you like?'],
                ['key' => 'preference', 'pt' => 'Tem preferência de produto ou marca?', 'en' => 'Any product or brand preference?'],
                ['key' => 'allergy', 'pt' => 'Você tem alergia a algum produto?', 'en' => 'Are you allergic to any product?'],
                ['key' => 'reference_photo', 'image_required' => true, 'pt' => 'Pode enviar uma foto de referência?', 'en' => 'Can you send a reference photo?'],
            ],
            CategoryType::Pet->value => [
                ['key' => 'size_breed', 'pt' => 'Qual o porte e a raça do pet?', 'en' => "What's the pet's size and breed?"],
                ['key' => 'temperament', 'pt' => 'O pet é dócil ou precisa de cuidado especial?', 'en' => 'Is the pet gentle or does it need special care?'],
                ['key' => 'last_visit', 'pt' => 'Quando foi o último atendimento?', 'en' => 'When was the last grooming/visit?'],
                ['key' => 'photo', 'image_required' => true, 'pt' => 'Pode enviar uma foto do pet?', 'en' => 'Can you send a photo of the pet?'],
            ],
        ];
    }
}
