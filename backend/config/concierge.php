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

];
