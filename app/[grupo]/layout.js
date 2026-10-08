import { notFound } from 'next/navigation';
import { obterGrupoPorSlug } from '@/lib/grupos';

// A caixinha de um grupo: titulo da aba, nome do app instalado e o manifesto
// dele. Endereco que nao e de grupo nenhum -> pagina nao encontrada.
export async function generateMetadata({ params }) {
  const { grupo: slug } = await params;
  const grupo = await obterGrupoPorSlug(slug);
  if (!grupo) return {};
  return {
    title: `${grupo.nome} - Visitas`,
    manifest: `/${grupo.slug}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: grupo.nome, statusBarStyle: 'black-translucent' },
  };
}

export default async function LayoutDoGrupo({ children, params }) {
  const { grupo: slug } = await params;
  if (!(await obterGrupoPorSlug(slug))) notFound();
  return children;
}
