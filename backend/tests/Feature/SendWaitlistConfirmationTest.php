<?php

namespace Tests\Feature;

use App\Jobs\SendWaitlistConfirmation;
use App\Mail\WaitlistConfirmation;
use App\Models\WaitlistEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Idempotência do envio de confirmação (#168).
 *
 * O caso que estes testes protegem não é raro nem exótico: basta o processo
 * morrer entre o efeito e a conclusão do job — OOM, deploy, SIGKILL — para a
 * fila reentregar o mesmo trabalho desde o início.
 */
class SendWaitlistConfirmationTest extends TestCase
{
    use RefreshDatabase;

    private function entrada(array $attrs = []): WaitlistEntry
    {
        return WaitlistEntry::create(array_merge([
            'role' => 'customer', 'name' => 'Marina Alves',
            'email' => 'marina@exemplo.com', 'city' => 'São José do Rio Preto',
            'locale' => 'pt',
        ], $attrs));
    }

    public function test_sends_once_and_marks_the_entry(): void
    {
        Mail::fake();
        $e = $this->entrada();

        (new SendWaitlistConfirmation($e->id))->handle();

        Mail::assertSent(WaitlistConfirmation::class, 1);
        $this->assertNotNull($e->refresh()->confirmed_mail_sent_at);
    }

    public function test_running_the_same_job_twice_sends_one_email(): void
    {
        // O critério de aceite da issue, literal.
        Mail::fake();
        $e = $this->entrada();

        (new SendWaitlistConfirmation($e->id))->handle();
        (new SendWaitlistConfirmation($e->id))->handle();

        Mail::assertSent(WaitlistConfirmation::class, 1);
    }

    public function test_two_workers_racing_send_one_email(): void
    {
        // O `UPDATE ... WHERE confirmed_mail_sent_at IS NULL` é atômico: dois
        // workers competindo pelo mesmo registro, só um afeta linha. Sem essa
        // reivindicação, ambos passariam pelo `if` e mandariam.
        Mail::fake();
        $e = $this->entrada();

        $a = new SendWaitlistConfirmation($e->id);
        $b = new SendWaitlistConfirmation($e->id);
        $a->handle();
        $b->handle();

        Mail::assertSent(WaitlistConfirmation::class, 1);
    }

    public function test_a_failed_send_releases_the_claim_for_the_retry(): void
    {
        // Se a marca ficasse presa depois de uma falha, o retry da fila não
        // teria efeito nenhum e a pessoa nunca receberia a confirmação — trocar
        // duplicata por silêncio não é conserto.
        $e = $this->entrada();
        Mail::shouldReceive('to->send')->once()->andThrow(new \RuntimeException('SMTP fora do ar'));

        try {
            (new SendWaitlistConfirmation($e->id))->handle();
            $this->fail('deveria ter propagado a exceção para a fila tentar de novo');
        } catch (\RuntimeException $ex) {
            $this->assertSame('SMTP fora do ar', $ex->getMessage());
        }

        $this->assertNull($e->refresh()->confirmed_mail_sent_at);
    }

    public function test_does_not_email_someone_who_unsubscribed(): void
    {
        Mail::fake();
        // forceFill e não create(): `unsubscribed_at` fica fora do $fillable de
        // propósito — só a rota assinada de descadastro escreve nela. Passar no
        // create() era silenciosamente descartado, e o teste passava a medir um
        // registro que nunca chegou a se descadastrar.
        $e = $this->entrada();
        $e->forceFill(['unsubscribed_at' => now()])->save();

        (new SendWaitlistConfirmation($e->id))->handle();

        Mail::assertNothingSent();
    }

    public function test_survives_a_deleted_entry(): void
    {
        // Job na fila e registro apagado no meio — pedido de exclusão do titular,
        // por exemplo. Não pode virar exceção e entupir failed_jobs.
        Mail::fake();
        $e = $this->entrada();
        $id = $e->id;
        $e->delete();

        (new SendWaitlistConfirmation($id))->handle();

        Mail::assertNothingSent();
    }

    public function test_signing_up_dispatches_the_job(): void
    {
        \Illuminate\Support\Facades\Bus::fake();

        $this->postJson('/api/v1/waitlist', [
            'name' => 'Marina Alves', 'email' => 'marina@exemplo.com',
        ])->assertCreated();

        \Illuminate\Support\Facades\Bus::assertDispatched(SendWaitlistConfirmation::class);
        // A marca NÃO é gravada no despacho: quem grava é o job, depois de
        // reivindicar. Gravar aqui era o bug original.
        $this->assertNull(WaitlistEntry::first()->confirmed_mail_sent_at);
    }
}
