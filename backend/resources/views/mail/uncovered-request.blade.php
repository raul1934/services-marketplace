{{--
    Alerta de chamado sem cobertura. O objetivo é uma coisa só: quem abrir isto
    no celular deve conseguir ligar para o cliente e para um guincheiro sem
    precisar abrir mais nada.
--}}
<x-mail::message>
# Chamado sem proposta há {{ $minutes }} minutos

Ninguém respondeu ainda. Enquanto isso o cliente está esperando — e o que perde
o cliente não é a demora, é o silêncio.

<x-mail::panel>
**{{ $request->category?->name ?? 'Sem categoria' }}**
{{ $request->description ?: 'Sem descrição.' }}

**Onde:** {{ $request->address ?: 'endereço não informado' }}
@if ($request->latitude && $request->longitude)
[Abrir no mapa](https://www.google.com/maps/search/?api=1&query={{ $request->latitude }},{{ $request->longitude }})
@endif

**Orçamento do cliente:** {{ $request->budget_max ? 'R$ '.number_format((float) $request->budget_max, 2, ',', '.') : 'não informado' }}
**Urgência:** {{ $request->urgency?->value ?? '—' }}
**Aberto em:** {{ $request->created_at?->timezone('America/Sao_Paulo')->format('d/m H:i') }}
</x-mail::panel>

## Cliente

**{{ $request->client?->name ?? '—' }}**
@if ($request->client?->phone)
[Ligar]({{ 'tel:'.preg_replace('/\D/', '', $request->client->phone) }}) ·
[WhatsApp](https://wa.me/{{ preg_replace('/\D/', '', $request->client->phone) }})
@endif

<x-mail::button :url="$adminUrl">
Abrir o chamado no painel
</x-mail::button>

---

**O que fazer:** ligue para um guincheiro da lista da praça e ofereça o serviço.
Ligação para telefone comercial oferecendo trabalho pago é conversa normal — e
converte muito melhor do que pedir que alguém instale um app antes de ver o
dinheiro. Com o serviço feito, aí sim vale o convite para o aplicativo.

<small>Você recebeu isto porque `CONCIERGE_ALERT_EMAIL` aponta para este
endereço. Cada chamado gera um alerta só.</small>
</x-mail::message>
