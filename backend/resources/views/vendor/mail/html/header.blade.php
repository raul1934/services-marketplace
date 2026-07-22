{{--
    Sobrescreve o cabeçalho de e-mail do Laravel.

    O componente do framework tem um caso especial: quando `app.name` é
    exatamente "Laravel", ele troca o nome pelo LOGO DO LARAVEL, hospedado em
    laravel.com. Em produção o APP_NAME era "Laravel", então os e-mails saíram
    literalmente com a marca do framework no topo.

    Corrigir o APP_NAME já resolveu isso, mas deixava só texto. Aqui entra a
    nossa marca de verdade.

    Duas decisões que importam em e-mail:

    - PNG, não SVG. Gmail, Outlook e boa parte dos clientes descartam SVG.
    - O `alt` é o nome da marca, não "logo". Muitos clientes bloqueiam imagem por
      padrão, e nesse caso o alt é o cabeçalho — "Chama Fácil" lê certo,
      "logo" não lê nada.
--}}
@props(['url'])
<tr>
<td class="header">
<a href="{{ config('brand.site') }}" style="display: inline-block;">
<img src="{{ config('brand.logo') }}"
     alt="{{ config('brand.name') }}"
     height="56"
     style="height: 56px; width: auto; max-width: 100%; border: 0; display: block; margin: 0 auto;">
</a>
</td>
</tr>
