// Service worker do app Paranoa04.
//
// Com internet, tudo vem do servidor como sempre; o que muda e que cada pagina
// aberta deixa uma copia guardada no celular. Sem sinal no local da visita, o
// app mostra essa ultima copia em vez da tela de erro do navegador.
// Cadastrar e editar continuam exigindo conexao: so GET passa por aqui.

const VERSAO = 'v1';
const CACHE_PAGINAS = `ceb-paginas-${VERSAO}`;
const CACHE_ARQUIVOS = `ceb-arquivos-${VERSAO}`;
// Cada deploy gera arquivos com nome novo; o limite impede o acumulo.
const LIMITE_ARQUIVOS = 200;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const atuais = [CACHE_PAGINAS, CACHE_ARQUIVOS];
      const nomes = await caches.keys();
      await Promise.all(nomes.filter((n) => !atuais.includes(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  if (pedido.method !== 'GET') return;

  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;

  if (pedido.mode === 'navigate') {
    evento.respondWith(pagina(pedido));
  } else if (url.pathname.startsWith('/_next/static/')) {
    evento.respondWith(arquivoFixo(pedido));
  }
  // O resto (dados das navegacoes internas, icones) segue direto para a rede.
});

async function pagina(pedido) {
  try {
    const resposta = await fetch(pedido);
    const destino = new URL(resposta.url || pedido.url);
    // Nao guarda o login nem o que veio de redirecionamento (sessao vencida).
    if (resposta.ok && !resposta.redirected && destino.pathname !== '/login') {
      const copia = resposta.clone();
      caches.open(CACHE_PAGINAS).then((c) => c.put(pedido, copia));
    }
    return resposta;
  } catch {
    const cache = await caches.open(CACHE_PAGINAS);
    return (await cache.match(pedido, { ignoreSearch: true })) || semConexao();
  }
}

// Os arquivos de /_next/static tem o conteudo no nome: nunca mudam, entao a
// copia guardada vale para sempre.
async function arquivoFixo(pedido) {
  const cache = await caches.open(CACHE_ARQUIVOS);
  const guardado = await cache.match(pedido);
  if (guardado) return guardado;

  const resposta = await fetch(pedido);
  if (resposta.ok) {
    await cache.put(pedido, resposta.clone());
    aparar(cache);
  }
  return resposta;
}

async function aparar(cache) {
  const chaves = await cache.keys();
  const excesso = chaves.length - LIMITE_ARQUIVOS;
  for (let i = 0; i < excesso; i++) await cache.delete(chaves[i]);
}

function semConexao() {
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sem internet · Paranoá04</title>
<style>
  body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 24px;
         box-sizing: border-box; background: #faf7f2; color: #241f1a; text-align: center;
         font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  @media (prefers-color-scheme: dark) { body { background: #131110; color: #f6f1e9; } }
  div { max-width: 22rem; }
  h1 { font-size: 1.15rem; margin: 0 0 .5rem; }
  p { margin: 0 0 1.25rem; line-height: 1.5; opacity: .75; font-size: .95rem; }
  button { font: inherit; font-weight: 600; border: 0; border-radius: 12px; padding: 12px 20px;
           background: #e0376f; color: #fff; }
</style></head>
<body><div>
  <h1>Sem internet</h1>
  <p>Esta tela ainda não tinha sido aberta neste celular, então não há uma cópia guardada.
     Quando o sinal voltar, ela carrega normalmente.</p>
  <button onclick="location.reload()">Tentar de novo</button>
</div></body></html>`;
  return new Response(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
