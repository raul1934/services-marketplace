{{--
    Página de saída da lista. Sem formulário e sem "tem certeza?": a pessoa já
    decidiu quando clicou, e pedir confirmação de quem quer sair é o atrito que
    a LGPD chama de obstáculo ao exercício do direito.
--}}
<!DOCTYPE html>
<html lang="{{ $en ? 'en' : 'pt-BR' }}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex" />
<title>{{ $en ? 'Unsubscribed — Chama Fácil' : 'Você saiu da lista — Chama Fácil' }}</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 24px; background: #eef2f7; color: #15233b;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.6;
  }
  @media (prefers-color-scheme: dark) { body { background: #0d131c; color: #eef2f7; } .card { background: #161f2b !important; border-color: #263242 !important; } .sub { color: #a7b6c9 !important; } }
  .card { background: #fff; border: 1px solid #e7ecf3; border-radius: 22px; padding: 40px 34px; max-width: 460px; text-align: center; }
  h1 { font-size: 25px; letter-spacing: -.02em; margin: 0 0 10px; }
  .sub { color: #5b6b82; margin: 0 0 26px; font-size: 16px; }
  a.btn {
    display: inline-flex; align-items: center; justify-content: center; min-height: 48px;
    padding: 0 24px; border-radius: 999px; text-decoration: none; font-weight: 800; font-size: 15px;
    background: linear-gradient(135deg, #ff8a4c 0%, #ff5a6e 55%, #ffb23e 110%); color: #fff;
  }
</style>
</head>
<body>
  <div class="card">
    <h1>{{ $en ? 'You are out of the list.' : 'Pronto, você saiu da lista.' }}</h1>
    <p class="sub">
      @if ($en)
        We will not email <b>{{ $entry->email }}</b> again. If you change your
        mind, you can join back any time from the site.
      @else
        Não vamos mais escrever para <b>{{ $entry->email }}</b>. Se mudar de
        ideia, dá para entrar de novo pelo site quando quiser.
      @endif
    </p>
    <a class="btn" href="https://chamafacil.app/">{{ $en ? 'Back to the site' : 'Voltar ao site' }}</a>
  </div>
</body>
</html>
