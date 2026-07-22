<?php

namespace Tests\Feature;

use App\Mail\UncoveredRequestAlert;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Support\Ops\MailOpsAlerter;
use App\Support\Ops\OpsAlerter;
use App\Support\Ops\StackOpsAlerter;
use App\Support\Ops\WhatsAppOpsAlerter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OpsAlerterChannelsTest extends TestCase
{
    use RefreshDatabase;

    private function chamado(): ServiceRequest
    {
        $categoria = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'guincho-'.uniqid(), 'name' => 'Guincho',
            'sort_order' => 1, 'is_active' => true,
        ]);

        return ServiceRequest::create([
            'client_id' => User::factory()->create()->id,
            'service_category_id' => $categoria->id,
            'description' => 'Pneu furado',
            'address' => 'Av. Bady Bassitt, 1000',
            'latitude' => -20.81, 'longitude' => -49.37,
            'status' => 'open',
        ]);
    }

    public function test_config_picks_the_channel(): void
    {
        config(['concierge.channels' => ['mail']]);
        $this->assertInstanceOf(MailOpsAlerter::class, app(OpsAlerter::class));

        config(['concierge.channels' => ['whatsapp']]);
        $this->app->forgetInstance(OpsAlerter::class);
        $this->assertInstanceOf(WhatsAppOpsAlerter::class, app(OpsAlerter::class));

        config(['concierge.channels' => ['mail', 'whatsapp']]);
        $this->app->forgetInstance(OpsAlerter::class);
        $this->assertInstanceOf(StackOpsAlerter::class, app(OpsAlerter::class));
    }

    public function test_mail_channel_sends_the_alert(): void
    {
        Mail::fake();
        config(['concierge.alert_email' => 'ops@exemplo.com']);

        (new MailOpsAlerter)->uncoveredRequest($this->chamado(), 4);

        Mail::assertSent(UncoveredRequestAlert::class);
    }

    public function test_mail_channel_stays_quiet_without_a_recipient(): void
    {
        Mail::fake();
        config(['concierge.alert_email' => null]);

        (new MailOpsAlerter)->uncoveredRequest($this->chamado(), 4);

        Mail::assertNothingSent();
    }

    public function test_whatsapp_channel_posts_an_approved_template(): void
    {
        Http::fake(['graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid.x']]], 200)]);
        config(['concierge.whatsapp' => [
            'token' => 'TOKEN', 'phone_number_id' => '123', 'to' => '+55 (17) 99647-5590',
            'template' => 'chamado_sem_proposta', 'template_language' => 'pt_BR', 'version' => 'v21.0',
        ]]);

        (new WhatsAppOpsAlerter)->uncoveredRequest($this->chamado(), 7);

        Http::assertSent(function ($req) {
            $corpo = $req->data();

            return str_contains($req->url(), 'v21.0/123/messages')
                && $req->hasHeader('Authorization', 'Bearer TOKEN')
                // Fora da janela de 24h a Meta só entrega template. Se um dia
                // alguém trocar por 'text' achando que é mais simples, isto
                // quebra — que é exatamente o ponto.
                && $corpo['type'] === 'template'
                && $corpo['template']['name'] === 'chamado_sem_proposta'
                // O número vai só com dígitos: a Meta rejeita máscara.
                && $corpo['to'] === '5517996475590'
                // Ordem dos parâmetros: minutos, categoria, endereço. Trocar
                // aqui sem trocar no template aprovado manda o endereço para o
                // lugar do tempo.
                && $corpo['template']['components'][0]['parameters'][0]['text'] === '7'
                && $corpo['template']['components'][0]['parameters'][1]['text'] === 'Guincho'
                && str_contains($corpo['template']['components'][0]['parameters'][2]['text'], 'Bady Bassitt');
        });
    }

    public function test_whatsapp_channel_stays_quiet_when_unconfigured(): void
    {
        Http::fake();
        config(['concierge.whatsapp' => ['token' => null, 'phone_number_id' => null, 'to' => null,
            'template' => 'x', 'template_language' => 'pt_BR', 'version' => 'v21.0']]);

        (new WhatsAppOpsAlerter)->uncoveredRequest($this->chamado(), 4);

        Http::assertNothingSent();
    }

    public function test_a_failing_channel_never_throws(): void
    {
        // A regra da interface: avisar não pode quebrar quem disparou o aviso.
        // Um chamado sem cobertura já é um problema; virar exceção no scheduler
        // — e derrubar a detecção dos outros chamados — seria dois.
        Http::fake(['graph.facebook.com/*' => Http::response(['error' => ['message' => 'template not found']], 400)]);
        config(['concierge.whatsapp' => [
            'token' => 'T', 'phone_number_id' => '1', 'to' => '5511999999999',
            'template' => 'inexistente', 'template_language' => 'pt_BR', 'version' => 'v21.0',
        ]]);

        (new WhatsAppOpsAlerter)->uncoveredRequest($this->chamado(), 4);

        $this->assertTrue(true); // chegou aqui = não lançou
    }

    public function test_stack_delivers_to_every_channel(): void
    {
        Mail::fake();
        Http::fake(['graph.facebook.com/*' => Http::response([], 200)]);
        config([
            'concierge.alert_email' => 'ops@exemplo.com',
            'concierge.whatsapp' => ['token' => 'T', 'phone_number_id' => '1', 'to' => '5511999999999',
                'template' => 't', 'template_language' => 'pt_BR', 'version' => 'v21.0'],
        ]);

        (new StackOpsAlerter([new MailOpsAlerter, new WhatsAppOpsAlerter]))
            ->uncoveredRequest($this->chamado(), 4);

        Mail::assertSent(UncoveredRequestAlert::class);
        Http::assertSentCount(1);
    }

    public function test_the_detector_uses_whatever_channel_is_configured(): void
    {
        Http::fake(['graph.facebook.com/*' => Http::response([], 200)]);
        config([
            'concierge.enabled' => true,
            'concierge.minutes_without_proposal' => 4,
            'concierge.max_age_hours' => 6,
            'concierge.channels' => ['whatsapp'],
            'concierge.whatsapp' => ['token' => 'T', 'phone_number_id' => '1', 'to' => '5511999999999',
                'template' => 't', 'template_language' => 'pt_BR', 'version' => 'v21.0'],
        ]);
        $this->app->forgetInstance(OpsAlerter::class);
        $this->chamado()->forceFill(['created_at' => now()->subMinutes(10)])->save();

        $this->artisan('requests:detect-uncovered')->assertSuccessful();

        // O detector não sabe que virou WhatsApp — só pediu a interface.
        Http::assertSentCount(1);
    }
}
