<?php

namespace App\Console\Commands;

use App\Mail\TestMessage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * Manda um e-mail de teste pela configuração atual.
 *
 * Existe porque "configurei o SMTP" e "o e-mail chega" são coisas diferentes, e
 * a distância entre as duas costuma ser uma senha errada, uma porta bloqueada
 * pelo provedor ou um remetente que não bate com a caixa autenticada. Descobrir
 * isso quando o primeiro cliente não recebe a confirmação é tarde.
 *
 *   php artisan mail:test voce@email.com
 */
class TestMail extends Command
{
    protected $signature = 'mail:test {to : Endereço que deve receber}';

    protected $description = 'Envia um e-mail de teste pela configuração atual de mail';

    public function handle(): int
    {
        $para = (string) $this->argument('to');
        $mailer = config('mail.default');
        $from = config('mail.from.address');
        $user = config('mail.mailers.smtp.username');

        $this->line('');
        $this->line("  mailer .... {$mailer}");
        if ($mailer === 'smtp') {
            $this->line('  host ...... '.config('mail.mailers.smtp.host').':'.config('mail.mailers.smtp.port'));
            $this->line('  scheme .... '.(config('mail.mailers.smtp.scheme') ?: 'padrão'));
            $this->line("  usuário ... {$user}");
        }
        $this->line("  remetente . {$from}");
        $this->line("  destino ... {$para}");
        $this->line('');

        if ($mailer === 'log') {
            $this->warn('MAIL_MAILER=log: a mensagem vai para storage/logs/laravel.log e ninguém recebe.');
        }

        // Um remetente diferente da caixa autenticada passa no envio e falha na
        // entrega — o e-mail sai, o servidor aceita, e o destinatário nunca vê
        // porque SPF/DKIM não alinham. É o modo de falha mais caro de
        // diagnosticar, então avisamos antes de tentar.
        if ($mailer === 'smtp' && $user && $from && strcasecmp((string) $user, (string) $from) !== 0) {
            $this->warn("Remetente ({$from}) diferente da caixa autenticada ({$user}).");
            $this->warn('Isso costuma passar no envio e cair em spam na entrega.');
        }

        try {
            Mail::to($para)->send(new TestMessage);
        } catch (\Throwable $e) {
            $this->error('Falhou: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info('Enviado sem erro.');
        $this->line('Confira a caixa de entrada — e o spam. Envio aceito não é entrega.');

        return self::SUCCESS;
    }
}
