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
//
// Tambem mede a altura da tela (--altura-tela). No app instalado do iPhone a
// pagina ocupa a tela inteira, mas o 100dvh e o innerHeight vem sem a faixa do
// relogio; la a medida certa e a da propria tela (screen), na orientacao atual.
const DETECTAR_MODO_APP = `(function(){try{
var d=document.documentElement;
if(matchMedia('(display-mode: standalone)').matches||navigator.standalone||matchMedia('(max-width: 767px)').matches){d.classList.add('modo-app')}
function medir(){
  var h=window.innerHeight;
  if(navigator.standalone){var deitado=window.innerWidth>window.innerHeight;h=Math.max(h,deitado?Math.min(screen.width,screen.height):Math.max(screen.width,screen.height))}
  d.style.setProperty('--altura-tela',h+'px');
}
medir();addEventListener('resize',medir);addEventListener('orientationchange',function(){setTimeout(medir,250)});
}catch(e){}})();`;

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
