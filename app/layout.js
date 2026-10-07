import './globals.css';
import ModoAplicativo from '@/components/ModoAplicativo';

export const metadata = {
  title: 'CEB · Cartões das assistidas',
  description: 'Informações das famílias atendidas pelo projeto de voluntariado',
  robots: { index: false, follow: false },
  // Instalado no iPhone ("Adicionar a Tela de Inicio"): nome sob o icone e
  // abertura em tela cheia. A barra preta solida deixa o conteudo comecar
  // abaixo do relogio; a translucida mostraria o fundo claro sob ele.
  appleWebApp: { capable: true, title: 'Paranoá04', statusBarStyle: 'black' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Barra do Android na cor do topo da capa.
  themeColor: '#32353c',
};

export default function LayoutRaiz({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh antialiased">
        {children}
        <ModoAplicativo />
      </body>
    </html>
  );
}
