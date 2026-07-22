{{--
    Confirmação de entrada na lista. Curta de propósito: a função é validar o
    endereço, definir a expectativa e dar UMA coisa para a pessoa fazer.

    Para quem pede serviço, essa coisa é o WhatsApp — enquanto a cidade não
    abriu, o atendimento pode ser feito na mão pelo modo concierge, e é o
    caminho mais curto entre um lead frio e o primeiro serviço real.
    Para quem quer trabalhar, é deixar os documentos prontos para a ligação.
--}}
<x-mail::message>
@if ($en)
# {{ $entry->isPro() ? 'Recebemos seu cadastro, '.$entry->firstName().'!' : 'You are on the list, '.$entry->firstName().'!' }}
@else
# {{ $entry->isPro() ? 'Recebemos seu cadastro, '.$entry->firstName().'!' : 'Você está na lista, '.$entry->firstName().'!' }}
@endif

@if ($entry->isPro())
    @if ($en)
Thanks for signing up as a Chama Fácil pro. The next step is a conversation:
we call you to finish the verification, and after that you start receiving
requests near you.

**Have these ready:** ID document, proof of address and a selfie. Verification
is done by people, not by a robot — which is exactly what makes the other side
trust who shows up.

During early access there is **no subscription and no commission**.
    @else
Obrigado por se cadastrar como profissional Chama Fácil. O próximo passo é uma
conversa: ligamos para você para concluir a verificação e, a partir daí, você
começa a receber chamados perto de você.

**Deixe à mão:** documento com foto, comprovante de endereço e uma selfie. A
conferência é feita por gente, não por robô — é justamente isso que faz o outro
lado confiar em quem aparece.

No acesso antecipado não há **mensalidade nem comissão**.
    @endif

@if ($whatsapp)
<x-mail::button :url="'https://wa.me/'.$whatsapp">
{{ $en ? 'Talk to us on WhatsApp' : 'Falar com a gente no WhatsApp' }}
</x-mail::button>
@endif

@else
    @if ($en)
We will email you the moment Chama Fácil opens in
**{{ $entry->city ?: 'your city' }}**. We open one city at a time, and we only
switch one on once there are enough pros for your first request to actually be
answered — a marketplace with nobody on the other side is not a marketplace.

**Need help before that?** Talk to us on WhatsApp. While your city is not open
yet, we arrange it by hand — tow truck, locksmith, battery, tyre.
    @else
Avisamos por e-mail assim que a Chama Fácil abrir em
**{{ $entry->city ?: 'sua cidade' }}**. Abrimos uma praça por vez, e só ativamos
quando há profissionais suficientes para o seu primeiro chamado ser atendido de
verdade — marketplace sem gente do outro lado não é marketplace.

**Precisa de ajuda antes disso?** Fale com a gente no WhatsApp. Enquanto a sua
cidade não abre, a gente resolve na mão — guincho, chaveiro, bateria, pneu.
    @endif

@if ($whatsapp)
<x-mail::button :url="'https://wa.me/'.$whatsapp">
{{ $en ? 'Talk to us on WhatsApp' : 'Falar com a gente no WhatsApp' }}
</x-mail::button>
@endif
@endif

{{ $en ? 'See you soon,' : 'Até breve,' }}
{{ $en ? 'The Chama Fácil team' : 'Equipe Chama Fácil' }}

<x-slot:subcopy>
{{ $en
    ? 'You received this because you joined the Chama Fácil waitlist. We do not send spam.'
    : 'Você recebeu este e-mail porque entrou na lista de espera da Chama Fácil. Não mandamos spam.' }}
[{{ $en ? 'Unsubscribe' : 'Sair da lista' }}]({{ $unsubscribeUrl }})
</x-slot:subcopy>
</x-mail::message>
