<?php

/*
 * CORS.
 *
 * A API é baseada em token e não usa cookie (`supports_credentials` false), então
 * CORS aqui não protege sessão — protege os endpoints públicos. Com origem
 * liberada, qualquer site consegue montar um formulário que despeja cadastro na
 * nossa lista de espera a partir do navegador de terceiros, e rate limit por IP
 * não ajuda quando os IPs são de gente diferente.
 *
 * Os apps móveis NÃO passam por aqui: requisição nativa não manda origem e não
 * dispara preflight. Quem depende desta lista é o navegador — a landing.
 */

$origens = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))
)));

return [
    'paths' => ['api/*', 'broadcasting/auth'],
    'allowed_methods' => ['*'],

    // Sem CORS_ALLOWED_ORIGINS definido, mantém o comportamento aberto de antes.
    // É o que faz o desenvolvimento seguir funcionando sem configuração — e o que
    // torna a restrição uma decisão explícita de quem sobe produção, em vez de
    // uma quebra silenciosa no dia do deploy.
    'allowed_origins' => $origens ?: ['*'],

    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
