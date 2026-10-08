import { notFound, redirect } from 'next/navigation';
import { podeAcessar, sessaoAtual } from '@/lib/auth';
import { obterGrupoPorSlug } from '@/lib/grupos';
import FormularioLogin from '@/components/FormularioLogin';
import MarcaCapa from '@/components/MarcaCapa';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { grupo: slug } = await params;
  const grupo = await obterGrupoPorSlug(slug);
  return grupo ? { title: `${grupo.nome} - Entrar` } : {};
}

export default async function PaginaLogin({ params }) {
  const { grupo: slug } = await params;
  const grupo = await obterGrupoPorSlug(slug);
  if (!grupo) notFound();
  if (podeAcessar(await sessaoAtual(), grupo)) redirect(`/${grupo.slug}`);

  return (
    // Tela cheia no cinza da capa: a marca e o cartao de entrada juntos no meio.
    <main className="tela-login">
      <header className="capa capa--login entrada">
        <MarcaCapa titulo={grupo.nome} />
      </header>
      <FormularioLogin grupo={grupo.slug} />
    </main>
  );
}
