import './globals.css';

export const metadata = {
  title: 'CEB · Cartões das assistidas',
  description: 'Informações das famílias atendidas pelo projeto de voluntariado',
  robots: { index: false, follow: false },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function LayoutRaiz({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
