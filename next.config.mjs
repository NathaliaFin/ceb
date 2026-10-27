import crypto from 'node:crypto';

// O Next sorteia uma chave nova a cada build e, com ela, muda o endereco
// interno de cada acao (salvar, desligar...). O app instalado no celular fica
// aberto por dias e o service worker serve a copia guardada quando o sinal
// demora: depois de um deploy, o "Salvar" dessas telas chamava uma acao que o
// servidor ja nao reconhecia, e nada era salvo. Tirando a chave do
// SESSION_SECRET, ela fica a mesma de um deploy para o outro.
if (!process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY && process.env.SESSION_SECRET) {
  process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY = crypto
    .createHash('sha256')
    .update(`acoes:${process.env.SESSION_SECRET}`)
    .digest('base64');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pg'],

  async redirects() {
    return [
      // O endereco oficial e sem "www": https://visitadps.com.br/ (a pagina
      // principal com os grupos). Quem digitar com www cai nele, no mesmo caminho.
      {
        source: '/:caminho*',
        has: [{ type: 'host', value: 'www.visitadps.com.br' }],
        destination: 'https://visitadps.com.br/:caminho*',
        permanent: true,
      },
      // Enderecos de antes dos grupos: tudo era do Paranoa04.
      { source: '/login', destination: '/', permanent: false },
      { source: '/atendidas', destination: '/paranoa04/atendidas', permanent: false },
      { source: '/admin', destination: '/paranoa04/gerenciar', permanent: false },
      { source: '/admin/calendario', destination: '/paranoa04/gerenciar/calendario', permanent: false },
      { source: '/admin/assistida/nova', destination: '/paranoa04/gerenciar/nova', permanent: false },
      { source: '/admin/assistida/:id', destination: '/paranoa04/gerenciar/:id', permanent: false },
    ];
  },

  async headers() {
    return [
      {
        // O celular confere o service worker a cada abertura; sem isto uma
        // versao antiga podia ficar presa no cache depois de um deploy.
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
