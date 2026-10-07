// Faz o celular tratar o site como aplicativo: icone na tela inicial e abertura
// em tela cheia, sem a barra de endereco. As cores sao as da capa, para a
// abertura do app emendar com o cabecalho.
export default function manifest() {
  return {
    name: 'Paranoá04 · Atendimento às Famílias',
    short_name: 'Paranoá04',
    description: 'Cartões das famílias atendidas pelo Paranoá04',
    lang: 'pt-BR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#32353c',
    theme_color: '#32353c',
    icons: [
      { src: '/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // O Android recorta este em circulo ou gota; o coracao fica na area segura.
      { src: '/icone-mascaravel-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
