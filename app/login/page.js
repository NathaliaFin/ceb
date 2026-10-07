import { redirect } from 'next/navigation';
import { papelAtual } from '@/lib/auth';
import FormularioLogin from '@/components/FormularioLogin';
import MarcaCapa from '@/components/MarcaCapa';

export const dynamic = 'force-dynamic';

export default async function PaginaLogin() {
  if (await papelAtual()) redirect('/');

  return (
    // A mesma capa da tela principal, com o cartao de entrada subindo sobre
    // ela como os cartoes das familias.
    <main className="min-h-dvh pb-10 overflow-x-clip">
      <header className="capa capa--login">
        <div className="px-4 max-w-6xl mx-auto entrada">
          <MarcaCapa />
        </div>
      </header>

      <div className="px-4">
        <FormularioLogin />
      </div>
    </main>
  );
}
