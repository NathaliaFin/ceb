import './globals.css';
import ModoAplicativo from '@/components/ModoAplicativo';

export const metadata = {
  title: 'Paranoá04 - Visitas',
  description: 'Informações das famílias atendidas pelo projeto de voluntariado',
  robots: { index: false, follow: false },
  // Instalado no iPhone ("Adicionar a Tela de Inicio"): nome sob o icone e
  // abertura em tela cheia. Com a barra translucida a pagina passa por baixo
  // do relogio; o .modo-app pinta essa faixa na cor da capa.
  appleWebApp: { capable: true, title: 'Paranoá04', statusBarStyle: 'black-translucent' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Barra do Android na cor do topo da capa.
  themeColor: '#32353c',
};

// No celular (no app instalado ou no navegador) o site usa o "modo app": a
// tela toda preenchida, com o cartao esticando ate o pe. Computador e tablet
// ficam com o layout de pagina. Roda antes da pintura para o layout nao pular.
const DETECTAR_MODO_APP = `try{if(matchMedia('(display-mode: standalone)').matches||navigator.standalone||matchMedia('(max-width: 767px)').matches){document.documentElement.classList.add('modo-app')}}catch(e){}`;

export default function LayoutRaiz({ children }) {
  return (
    // A classe modo-app entra pelo script antes do React: sem o aviso, a
    // hidratacao reclamaria da diferenca com o HTML do servidor.
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: DETECTAR_MODO_APP }} />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        <ModoAplicativo />
      </body>
    </html>
  );
}
