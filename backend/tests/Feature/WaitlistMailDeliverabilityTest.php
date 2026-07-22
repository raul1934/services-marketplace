<?php

namespace Tests\Feature;

use App\Mail\WaitlistConfirmation;
use App\Models\WaitlistEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * O que faz a mensagem ser entregue, e não só enviada.
 *
 * Escrito depois de um envio real cair em lixo eletrônico: o SMTP aceitava, o
 * job passava, e nada no código indicava problema — porque não havia problema
 * no código, havia na mensagem. Estas asserções travam os sinais que o filtro
 * do lado de lá procura.
 */
class WaitlistMailDeliverabilityTest extends TestCase
{
    use RefreshDatabase;

    private function mensagem(array $attrs = []): \Symfony\Component\Mime\Email
    {
        $entry = WaitlistEntry::create(array_merge([
            'role' => 'customer', 'name' => 'Marina Alves', 'email' => 'marina@exemplo.com',
            'city' => 'São José do Rio Preto', 'locale' => 'pt',
        ], $attrs));

        Mail::to($entry->email)->send(new WaitlistConfirmation($entry));

        return Mail::mailer()->getSymfonyTransport()->messages()[0]->getOriginalMessage();
    }

    public function test_carries_a_plain_text_alternative(): void
    {
        // Mensagem só-HTML conta contra no filtro, e deixa de fora quem lê em
        // cliente que não renderiza HTML.
        $msg = $this->mensagem();

        $this->assertNotEmpty($msg->getHtmlBody());
        $this->assertNotEmpty($msg->getTextBody());
        $this->assertStringContainsString('Marina', $msg->getTextBody());
        $this->assertStringContainsString('Rio Preto', $msg->getTextBody());
    }

    public function test_offers_one_click_unsubscribe(): void
    {
        // RFC 8058. Gmail e Yahoo exigem de quem envia em volume desde 2024, e a
        // ausência pesa mesmo em volume baixo — que é a situação de um domínio
        // novo mandando o primeiro e-mail da vida. Sem o botão nativo, a saída
        // que sobra para quem não quer mais é marcar como spam, que é o que de
        // fato destrói reputação.
        $msg = $this->mensagem();
        $headers = $msg->getHeaders();

        $this->assertTrue($headers->has('List-Unsubscribe'));
        $this->assertTrue($headers->has('List-Unsubscribe-Post'));

        $unsub = $headers->get('List-Unsubscribe')->getBodyAsString();
        $this->assertStringContainsString('/unsubscribe', $unsub);
        // Assinado: o cabeçalho é lido por máquina, e sem assinatura qualquer
        // um descadastraria outra pessoa trocando o id da URL.
        $this->assertStringContainsString('signature=', $unsub);
        $this->assertStringStartsWith('<', $unsub);

        $this->assertStringContainsString(
            'One-Click',
            $headers->get('List-Unsubscribe-Post')->getBodyAsString()
        );
    }

    public function test_text_part_exists_for_pros_and_in_english(): void
    {
        foreach ([['pro', 'pt'], ['customer', 'en'], ['pro', 'en']] as [$role, $locale]) {
            Mail::mailer()->getSymfonyTransport()->flush();
            $msg = $this->mensagem([
                'role' => $role, 'locale' => $locale, 'email' => "m-{$role}-{$locale}@exemplo.com",
            ]);
            $this->assertNotEmpty($msg->getTextBody(), "{$role}/{$locale}");
        }
    }
}
