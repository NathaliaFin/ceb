'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';

function acompanharConexao(avisar) {
  window.addEventListener('online', avisar);
  window.addEventListener('offline', avisar);
  return () => {
    window.removeEventListener('online', avisar);
    window.removeEventListener('offline', avisar);
  };
}

/**
 * Liga o service worker (public/sw.js), que guarda no celular a ultima versao
 * de cada tela para o app abrir mesmo sem sinal no local da visita.
 *
 * Fica de fora no `next dev`: la os arquivos mudam a cada salvamento e a copia
 * guardada so atrapalharia.
 */
export default function ModoAplicativo() {
  const caminho = usePathname();
  // No servidor nao ha como saber; parte de "com internet".
  const semInternet = useSyncExternalStore(acompanharConexao, () => !navigator.onLine, () => false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  }, []);

  // Na tela de login nao ha sessao: as copias com os dados das familias saem
  // do celular. Cobre o "Sair" e a sessao vencida.
  useEffect(() => {
    if (caminho !== '/login' || !('caches' in window)) return;
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n.startsWith('ceb-paginas')).map((n) => caches.delete(n))))
      .catch(() => {});
  }, [caminho]);

  if (!semInternet) return null;

  return (
    <div role="status" className="aviso-sem-internet">
      Sem internet · mostrando a última versão salva
    </div>
  );
}
