{{-- Versão em texto puro da confirmação.

     Mensagem só-HTML é sinal negativo para filtro de spam, e a alternativa em
     texto é o que salva quem lê em cliente que não renderiza HTML. Mantenha
     este arquivo em sincronia com waitlist-confirmation.blade.php: nada avisa
     quando os dois divergem. --}}
@if ($entry->isPro())
@if ($en)
Recebemos seu cadastro, {{ $entry->firstName() }}!

Thanks for signing up as a Chama Fácil pro. The next step is a conversation: we
call you to finish the verification, and after that you start receiving requests
near you.

Have these ready: ID document, proof of address and a selfie. Verification is
done by people, not by a robot — which is exactly what makes the other side
trust who shows up.

During early access there is no subscription and no commission.
@else
Recebemos seu cadastro, {{ $entry->firstName() }}!

Obrigado por se cadastrar como profissional Chama Fácil. O próximo passo é uma
conversa: ligamos para você para concluir a verificação e, a partir daí, você
começa a receber chamados perto de você.

Deixe à mão: documento com foto, comprovante de endereço e uma selfie. A
conferência é feita por gente, não por robô — é justamente isso que faz o outro
lado confiar em quem aparece.

No acesso antecipado não há mensalidade nem comissão.
@endif
@else
@if ($en)
You are on the list, {{ $entry->firstName() }}!

We will email you the moment Chama Fácil opens in {{ $entry->city ?: 'your city' }}.
We open one city at a time, and we only switch one on once there are enough pros
for your first request to actually be answered — a marketplace with nobody on
the other side is not a marketplace.

Need help before that? Talk to us on WhatsApp. While your city is not open yet,
we arrange it by hand — tow truck, locksmith, battery, tyre.
@else
Você está na lista, {{ $entry->firstName() }}!

Avisamos por e-mail assim que a Chama Fácil abrir em {{ $entry->city ?: 'sua cidade' }}.
Abrimos uma praça por vez, e só ativamos quando há profissionais suficientes
para o seu primeiro chamado ser atendido de verdade — marketplace sem gente do
outro lado não é marketplace.

Precisa de ajuda antes disso? Fale com a gente no WhatsApp. Enquanto a sua
cidade não abre, a gente resolve na mão — guincho, chaveiro, bateria, pneu.
@endif
@endif

@if ($whatsapp)
{{ $en ? 'WhatsApp' : 'WhatsApp' }}: https://wa.me/{{ $whatsapp }}
@endif

{{ $en ? 'See you soon,' : 'Até breve,' }}
{{ $en ? 'The Chama Fácil team' : 'Equipe Chama Fácil' }}

--
{{ $en
    ? 'You received this because you joined the Chama Fácil waitlist. We do not send spam.'
    : 'Você recebeu este e-mail porque entrou na lista de espera da Chama Fácil. Não mandamos spam.' }}
{{ $en ? 'Unsubscribe' : 'Sair da lista' }}: {{ $unsubscribeUrl }}
