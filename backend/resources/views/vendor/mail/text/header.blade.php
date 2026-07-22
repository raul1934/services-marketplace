{{--
    Versão em texto do cabeçalho. Aqui não há imagem: o nome da marca é o
    cabeçalho. Sem esta sobrescrita, a versão texto herdaria o link cru do
    componente do framework — que na prática rendia uma linha como
    "Chama Fácil: http://localhost:19000" no topo da mensagem.
--}}
@props(['url'])
{{ config('brand.name') }} — {{ config('brand.site') }}
