import { redirect } from 'next/navigation';
import { papelAtual } from '@/lib/auth';
import FormularioLogin from '@/components/FormularioLogin';
import MarcaCapa from '@/components/MarcaCapa';

export const dynamic = 'force-dynamic';

export default async function PaginaLogin() {
  if (await papelAtual()) redirect('/');

  return (
    // Tela cheia no cinza da capa: a marca e o cartao de entrada juntos no meio.
    <main className="tela-login">
      <header className="capa capa--login entrada">
        <MarcaCapa />
      </header>
      <FormularioLogin />
    </main>
  );
}
