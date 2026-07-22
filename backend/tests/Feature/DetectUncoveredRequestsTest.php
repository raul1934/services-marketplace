<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Mail\UncoveredRequestAlert;
use App\Models\Proposal;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class DetectUncoveredRequestsTest extends TestCase
{
    use RefreshDatabase;

    private function categoria(): ServiceCategory
    {
        return ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'guincho-'.uniqid(), 'name' => 'Guincho',
            'sort_order' => 1, 'is_active' => true,
        ]);
    }

    private function chamado(array $attrs = []): ServiceRequest
    {
        $request = ServiceRequest::create(array_merge([
            'client_id' => User::factory()->create()->id,
            'service_category_id' => $this->categoria()->id,
            'description' => 'Pneu furado na Bady Bassitt',
            'latitude' => -20.81, 'longitude' => -49.37,
            'status' => RequestStatus::Open->value,
        ], $attrs));

        // created_at é preenchido pelo Eloquent; envelhecer o chamado exige
        // escrever direto, senão ele nasce sempre "agora".
        if (isset($attrs['created_at'])) {
            $request->forceFill(['created_at' => $attrs['created_at']])->save();
        }

        return $request->refresh();
    }

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'concierge.enabled' => true,
            'concierge.minutes_without_proposal' => 4,
            'concierge.max_age_hours' => 6,
            'concierge.alert_email' => 'ops@exemplo.com',
        ]);
    }

    public function test_alerts_when_a_request_sits_with_no_proposal(): void
    {
        Mail::fake();
        $request = $this->chamado(['created_at' => now()->subMinutes(5)]);

        $this->artisan('requests:detect-uncovered')->assertSuccessful();

        Mail::assertSent(UncoveredRequestAlert::class, fn ($m) => $m->request->is($request));
        $this->assertNotNull($request->refresh()->concierge_alerted_at);
    }

    public function test_stays_quiet_before_the_threshold(): void
    {
        Mail::fake();
        $request = $this->chamado(['created_at' => now()->subMinutes(2)]);

        $this->artisan('requests:detect-uncovered')->assertSuccessful();

        Mail::assertNothingSent();
        $this->assertNull($request->refresh()->concierge_alerted_at);
    }

    public function test_stays_quiet_when_a_proposal_already_arrived(): void
    {
        // O gatilho é a ausência de proposta. Chamado respondido não é buraco
        // de cobertura, por mais tempo que leve para ser aceito.
        Mail::fake();
        $request = $this->chamado(['created_at' => now()->subMinutes(30)]);
        Proposal::create([
            'service_request_id' => $request->id,
            'provider_id' => User::factory()->create()->id,
            'price' => 180, 'eta_minutes' => 12,
        ]);

        $this->artisan('requests:detect-uncovered')->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_alerts_only_once_per_request(): void
    {
        Mail::fake();
        $this->chamado(['created_at' => now()->subMinutes(10)]);

        $this->artisan('requests:detect-uncovered')->assertSuccessful();
        $this->artisan('requests:detect-uncovered')->assertSuccessful();

        // O comando roda a cada minuto; sem a marca, o mesmo chamado viraria um
        // e-mail por minuto até alguém agir — e alerta que grita demais deixa
        // de ser lido.
        Mail::assertSentCount(1);
    }

    public function test_ignores_requests_older_than_the_rescue_window(): void
    {
        // Descoberto rodando o comando contra o banco de desenvolvimento: sem
        // teto de idade ele pegou 47 chamados antigos de uma vez. Na estreia em
        // produção isso seria um e-mail por chamado histórico — e alerta que
        // grita demais deixa de ser lido justamente quando passa a importar.
        Mail::fake();
        $request = $this->chamado(['created_at' => now()->subHours(7)]);

        $this->artisan('requests:detect-uncovered')->assertSuccessful();

        Mail::assertNothingSent();
        $this->assertNull($request->refresh()->concierge_alerted_at);
    }

    public function test_ignores_requests_that_are_no_longer_open(): void
    {
        Mail::fake();
        $this->chamado([
            'created_at' => now()->subMinutes(30),
            'status' => RequestStatus::Cancelled->value,
        ]);

        $this->artisan('requests:detect-uncovered')->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_ignores_bot_requests(): void
    {
        Mail::fake();
        $this->chamado(['created_at' => now()->subMinutes(30), 'is_test' => true]);

        $this->artisan('requests:detect-uncovered')->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_marks_the_request_even_without_a_destination(): void
    {
        // Sem e-mail configurado o detector ainda tem valor: o log e a coluna
        // são o que permite medir depois quantos chamados ficaram sem cobertura.
        Mail::fake();
        config(['concierge.alert_email' => null]);
        $request = $this->chamado(['created_at' => now()->subMinutes(10)]);

        $this->artisan('requests:detect-uncovered')->assertSuccessful();

        Mail::assertNothingSent();
        $this->assertNotNull($request->refresh()->concierge_alerted_at);
    }

    public function test_does_nothing_when_disabled(): void
    {
        Mail::fake();
        config(['concierge.enabled' => false]);
        $request = $this->chamado(['created_at' => now()->subMinutes(10)]);

        $this->artisan('requests:detect-uncovered')->assertSuccessful();

        Mail::assertNothingSent();
        $this->assertNull($request->refresh()->concierge_alerted_at);
    }
}
