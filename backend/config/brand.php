<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Marca nos e-mails
    |--------------------------------------------------------------------------
    |
    | O cabeçalho dos e-mails usa estes valores. Precisa ser URL absoluta e
    | pública: cliente de e-mail não resolve caminho relativo e não tem acesso a
    | nada que dependa de sessão.
    |
    | Não sai de APP_URL de propósito — APP_URL aponta para a API
    | (api.chamafacil.app), e a imagem vive na landing.
    |
    | PNG e não SVG: Gmail, Outlook e boa parte dos clientes descartam SVG. O
    | arquivo é gerado a partir de landing/logo.svg com o dobro do tamanho de
    | exibição, para não ficar borrado em tela retina.
    |
    */

    'name' => env('BRAND_NAME', 'Chama Fácil'),

    'logo' => env('BRAND_LOGO_URL', 'https://chamafacil.app/logo-email.png'),

    'site' => env('BRAND_SITE_URL', 'https://chamafacil.app'),

];
