# Jobs idempotentes

**Todo job de fila pode rodar duas vezes.** Não é hipótese nem caso raro: se o
processo morrer depois de o job produzir efeito e antes de ele ser marcado como
concluído — OOM, deploy, SIGKILL, queda de rede — o registro segue reservado, o
`retry_after` vence e outro worker o pega **desde o início**.

Isso vale mesmo com tudo bem configurado. O que já fizemos reduz a janela e não
a fecha:

- `--max-time=300` recicla o worker só **entre** jobs, nunca no meio de um
- `stop_grace_period: 90s` (maior que o `--timeout=60`) dá tempo de terminar o
  job em andamento antes do SIGKILL no deploy
- `retry_after: 90` > `timeout: 60`, senão a fila liberaria o job para outro
  worker enquanto o primeiro ainda roda

## O padrão: reivindicação atômica antes do efeito

Referência viva: `app/Jobs/SendWaitlistConfirmation.php`.

```php
$reivindicou = Model::whereKey($this->id)
    ->whereNull('marca')
    ->update(['marca' => now()]);

if ($reivindicou === 0) {
    return;               // outra execução já cuidou disto
}

try {
    // ... o efeito ...
} catch (\Throwable $e) {
    Model::whereKey($this->id)->update(['marca' => null]);
    throw $e;             // devolve a reivindicação e deixa a fila tentar de novo
}
```

O `UPDATE ... WHERE marca IS NULL` é atômico no banco: dois workers competindo
pelo mesmo registro, só um recebe uma linha afetada.

Três detalhes que parecem estilo e não são:

1. **A reivindicação vem ANTES do efeito.** Marcar depois deixa a janela aberta
   justamente no trecho demorado — a conversa SMTP, a chamada ao gateway — que
   é onde a chance de morrer no meio se concentra.
2. **A falha devolve a marca.** Sem isso, trocamos duplicata por silêncio: o
   retry roda, vê a marca, e não faz nada. Ninguém recebe, ninguém percebe.
3. **A marca não entra no `$fillable`.** Ela é controle interno; só o job
   escreve nela, com `update()` de query builder.

## O que despacha não marca

O bug original era o controller gravar `confirmed_mail_sent_at` no **despacho**:

```php
Mail::to($e->email)->queue(new WaitlistConfirmation($e));
$e->forceFill(['confirmed_mail_sent_at' => now()])->save();   // errado
```

A marca era gravada antes de o e-mail existir. Não protegia de nada — e ainda
mentia, porque um envio que falhasse ficava registrado como enviado.

## Mailable não deve ser ShouldQueue quando um job já o envia

O `Mailer` do Laravel troca `send()` por `queue()` quando o Mailable é
`ShouldQueue` (`Mailer::sendMailable`). Com os dois, o job enfileira **outro**
job, retorna na hora, e o erro real aparece fora do `try/catch` que devolveria a
reivindicação — quebrando a idempotência sem quebrar nenhum teste óbvio.

Regra: ou o Mailable é `ShouldQueue` e ninguém o embrulha, ou existe um job e o
Mailable é síncrono.

## Quando este padrão não basta

Para efeito que cabe numa coluna do próprio registro, ele resolve. **Para
dinheiro — repasse ao prestador, cobrança, estorno — não basta**: aí é chave de
idempotência por operação, numa tabela de operações já executadas, que é o que o
gateway de pagamento vai exigir de qualquer forma.

Nenhum job que mova dinheiro deve entrar em produção sem isso.

## Como testar

O teste que importa é o mais simples: rodar o mesmo job duas vezes e exigir
**um** efeito. Ver `tests/Feature/SendWaitlistConfirmationTest.php`, que cobre
também dois workers competindo, falha devolvendo a marca, registro apagado no
meio e destinatário descadastrado.
