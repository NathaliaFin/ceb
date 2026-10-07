/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pg'],

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
