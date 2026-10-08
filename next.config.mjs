/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pg'],

  // Enderecos de antes dos grupos: tudo era do Paranoa04.
  async redirects() {
    return [
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
