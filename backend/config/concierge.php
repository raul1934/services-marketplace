<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Modo concierge — resgate de chamado sem cobertura
    |--------------------------------------------------------------------------
    |
    | Enquanto a oferta orgânica não existe, vai haver chamado que ninguém pega:
    | madrugada, feriado, categoria sem cobertura. O que perde o cliente nesses
    | casos não é a demora — é o silêncio. Este detector avisa a operação a
    | tempo de alguém pegar o telefone e resolver na mão.
    |
    | Ver marketing-audit/praca-de-lancamento.md e a issue MKT-OPS-01.
    |
    */

    'enabled' => env('CONCIERGE_ENABLED', true),

    /*
    | Minutos sem NENHUMA proposta antes de acionar a operação.
    |
    | O gatilho é a falha real, não a contagem de prestadores cadastrados: dez
    | guincheiros cadastrados e todos dormindo às 2h da manhã são zero
    | cobertura. O que importa é o chamado estar sem resposta.
    |
    | Curto o suficiente para ainda dar tempo de resolver: em socorro veicular,
    | quem está parado na rua desiste bem antes de meia hora.
    */
    'minutes_without_proposal' => env('CONCIERGE_MINUTES', 4),

    /*
    | Idade máxima do chamado para ainda valer um alerta.
    |
    | Sem este teto, o primeiro `php artisan requests:detect-uncovered` depois
    | de subir a funcionalidade dispararia um e-mail para cada chamado aberto e
    | sem resposta que já existisse no banco — foram 47 no ambiente de
    | desenvolvimento. Alerta que grita demais na estreia deixa de ser lido
    | justamente quando passa a importar.
    |
    | Além disso, resgate tem janela: chamado de ontem não é oportunidade, é
    | histórico. Quem estava parado na rua há seis horas já resolveu de outro
    | jeito.
    */
    'max_age_hours' => env('CONCIERGE_MAX_AGE_HOURS', 6),

    /*
    | Para onde vai o alerta. Sem destino configurado, o detector ainda roda e
    | ainda marca os chamados — só não avisa ninguém, e registra em log.
    */
    'alert_email' => env('CONCIERGE_ALERT_EMAIL'),

    /*
    | Base do painel administrativo, para o alerta linkar direto o chamado.
    */
    'admin_url' => env('CONCIERGE_ADMIN_URL', 'https://admin.chamafacil.app'),

    /*
    |--------------------------------------------------------------------------
    | Canais do alerta
    |--------------------------------------------------------------------------
    |
    | Lista separada por vírgula: 'mail', 'whatsapp', ou os dois. Com mais de um
    | canal, todos recebem — útil enquanto o WhatsApp está sendo validado, para
    | conferir que chega sem apostar a operação nele.
    |
    | Padrão só e-mail: não depende de integração nenhuma e já resolve.
    |
    */
    'channels' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CONCIERGE_CHANNELS', 'mail'))
    ))),

    /*
    |--------------------------------------------------------------------------
    | WhatsApp Cloud API (oficial da Meta)
    |--------------------------------------------------------------------------
    |
    | Só é usado quando 'whatsapp' está em CONCIERGE_CHANNELS. Sem as
    | credenciais o canal se cala e registra em log — nunca derruba o detector.
    |
    | Dois avisos que custam caro descobrir tarde:
    |
    | 1. Um número registrado na Cloud API DEIXA de funcionar no aplicativo do
    |    WhatsApp. Não registre o número que a landing publica como suporte:
    |    use um número separado.
    | 2. Fora da janela de 24h a Meta só entrega TEMPLATE APROVADO. O alerta é
    |    sempre iniciado por nós, então é sempre template — e o nome abaixo
    |    precisa existir e estar aprovado no WhatsApp Manager antes de ligar
    |    o canal.
    |
    | O template esperado tem três parâmetros no corpo, nesta ordem:
    |   {{1}} minutos sem proposta · {{2}} categoria · {{3}} endereço
    |
    */
    'whatsapp' => [
        'token' => env('CONCIERGE_WA_TOKEN'),
        'phone_number_id' => env('CONCIERGE_WA_PHONE_ID'),
        'to' => env('CONCIERGE_WA_TO'),
        'template' => env('CONCIERGE_WA_TEMPLATE', 'chamado_sem_proposta'),
        'template_language' => env('CONCIERGE_WA_TEMPLATE_LANG', 'pt_BR'),
        'version' => env('CONCIERGE_WA_VERSION', 'v21.0'),
    ],

];
