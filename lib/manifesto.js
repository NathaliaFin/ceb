// O "manifesto" faz o celular tratar o site como aplicativo: icone na tela
// inicial e abertura em tela cheia, sem a barra de endereco. Cada grupo tem o
// seu (nome e endereco proprios), e a pagina principal tem o do Visita DPS.
// As cores sao as da capa, para a abertura do app emendar com o cabecalho.
export function manifesto({ nome, nomeCurto, descricao, endereco }) {
  return Response.json(
    {
      id: endereco,
      name: nome,
      short_name: nomeCurto,
      description: descricao,
      lang: 'pt-BR',
      start_url: endereco,
      scope: endereco,
      display: 'standalone',
      background_color: '#32353c',
      theme_color: '#32353c',
      icons: [
        { src: '/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        // O Android recorta este em circulo ou gota; o coracao fica na area segura.
        { src: '/icone-mascaravel-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
}
