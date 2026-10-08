import { redirect } from 'next/navigation';
import { entrarNoPainel } from '@/app/actions';
import { sessaoAtual } from '@/lib/auth';
import FormularioLogin from '@/components/FormularioLogin';
import MarcaCapa from '@/components/MarcaCapa';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Visita DPS - Administração' };

export default async function PaginaEntrarNoPainel() {
  if ((await sessaoAtual())?.admin) redirect('/painel');
  return (
    <main className="tela-login">
      <header className="capa capa--login entrada">
        <MarcaCapa titulo="Visita DPS" />
      </header>
      <FormularioLogin acaoDeEntrar={entrarNoPainel} titulo="Administração" />
    </main>
  );
}
