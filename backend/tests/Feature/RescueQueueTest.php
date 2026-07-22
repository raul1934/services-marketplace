<?php

namespace Tests\Feature;

use App\Mail\UncoveredRequestAlert;
use App\Models\RescueContact;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Fila de resgate no alerta de chamado sem cobertura (MKT-OPS-01).
 *
 * O que estes testes protegem é uma promessa feita a terceiros: só é acionado
 * quem autorizou. Ligar para quem não autorizou é exatamente o problema que a
 * issue original existia para evitar.
 */
class RescueQueueTest extends TestCase
{
    use RefreshDatabase;

    private function chamado(string $slug = 'guincho'): ServiceRequest
    {
        $cat = ServiceCategory::create([
            'type' => 'roadside', 'slug' => $slug, 'name' => 'Guincho',
            'sort_order' => 1, 'is_active' => true,
        ]);

        return ServiceRequest::create([
            'client_id' => User::factory()->create()->id,
            'service_category_id' => $cat->id,
            'description' => 'Pneu furado', 'address' => 'Av. Bady Bassitt, 1000',
            'latitude' => -20.81, 'longitude' => -49.37, 'status' => 'open',
        ]);
    }

    private function contato(array $attrs = []): RescueContact
    {
        return RescueContact::create(array_merge([
            'name' => 'Zé do Guincho', 'company' => 'Guincho Rio Preto',
            'phone' => '(17) 99999-1111', 'city' => 'São José do Rio Preto', 'uf' => 'SP',
            'consent_at' => now(), 'consent_source' => 'visita presencial',
            'is_active' => true,
        ], $attrs));
    }

    public function test_the_alert_lists_contacts_with_call_links(): void
    {
        $this->contato();
        $html = (new UncoveredRequestAlert($this->chamado(), 4))->render();

        $this->assertStringContainsString('Zé do Guincho', $html);
        $this->assertStringContainsString('Guincho Rio Preto', $html);
        // O DDI entra: sem ele o wa.me não abre a conversa.
        $this->assertStringContainsString('wa.me/5517999991111', $html);
        $this->assertStringContainsString('tel:5517999991111', $html);
    }

    public function test_someone_who_never_consented_is_never_called(): void
    {
        // A regra que sustenta a legalidade da fila inteira.
        $this->contato(['name' => 'Sem Autorização', 'consent_at' => null]);

        $html = (new UncoveredRequestAlert($this->chamado(), 4))->render();

        $this->assertStringNotContainsString('Sem Autorização', $html);
    }

    public function test_an_inactive_contact_is_not_called(): void
    {
        $this->contato(['name' => 'Desativado', 'is_active' => false]);

        $html = (new UncoveredRequestAlert($this->chamado(), 4))->render();

        $this->assertStringNotContainsString('Desativado', $html);
    }

    public function test_contacts_are_filtered_by_category(): void
    {
        $this->contato(['name' => 'Só Chaveiro', 'categories' => ['chaveiro']]);
        $this->contato(['name' => 'Faz Guincho', 'phone' => '17999992222', 'categories' => ['guincho']]);
        // Sem categoria declarada entra: numa praça pequena quem faz guincho
        // costuma resolver bateria e pneu, e um telefone a mais às 2h vale.
        $this->contato(['name' => 'Faz De Tudo', 'phone' => '17999993333', 'categories' => null]);

        $html = (new UncoveredRequestAlert($this->chamado('guincho'), 4))->render();

        $this->assertStringContainsString('Faz Guincho', $html);
        $this->assertStringContainsString('Faz De Tudo', $html);
        $this->assertStringNotContainsString('Só Chaveiro', $html);
    }

    public function test_an_empty_queue_says_so_instead_of_staying_silent(): void
    {
        // Alerta que avisa mas não ajuda a resolver precisa dizer o que falta,
        // senão a pessoa só descobre o buraco no meio da urgência.
        $html = (new UncoveredRequestAlert($this->chamado(), 4))->render();

        $this->assertStringContainsString('fila de resgate está vazia', $html);
        $this->assertStringContainsString('rescue-contacts', $html);
    }

    public function test_never_called_comes_before_already_called(): void
    {
        // Distribui o trabalho em vez de queimar sempre o mesmo contato.
        $this->contato(['name' => 'Já Chamado', 'phone' => '17999994444'])
            ->forceFill(['last_called_at' => now()->subDay()])->save();
        $this->contato(['name' => 'Nunca Chamado', 'phone' => '17999995555']);

        $fila = RescueContact::paraChamado(null, 'guincho')->pluck('name')->all();

        $this->assertSame('Nunca Chamado', $fila[0]);
    }

    public function test_priority_wins_over_recency(): void
    {
        $this->contato(['name' => 'Comum', 'phone' => '17999996666', 'priority' => 50]);
        $this->contato(['name' => 'Preferido', 'phone' => '17999997777', 'priority' => 90])
            ->forceFill(['last_called_at' => now()])->save();

        $fila = RescueContact::paraChamado(null, 'guincho')->pluck('name')->all();

        $this->assertSame('Preferido', $fila[0]);
    }
}
