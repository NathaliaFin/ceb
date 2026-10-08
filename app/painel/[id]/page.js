import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirAdministradora } from '@/lib/auth';
import { obterGrupo } from '@/lib/grupos';
import FormularioGrupo from '@/components/FormularioGrupo';
import BotaoLembreteDeTeste from '@/components/BotaoLembreteDeTeste';
import { IconeSeta } from '@/components/Icones';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Visita DPS - Administração' };

export default async function PaginaEditarGrupo({ params }) {
  await exigirAdministradora();
  const { id } = await params;
  const grupo = Number.isInteger(Number(id)) ? await obterGrupo(Number(id)) : null;
  if (!grupo) notFound();

  return (
    <main className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/painel"
          className="botao-secundario inline-flex items-center gap-1 px-3 py-2 text-xs shrink-0"
        >
          <span className="rotate-90 inline-flex">
            <IconeSeta tamanho={14} />
          </span>
          Voltar
        </Link>
        <h1 className="text-lg font-bold">{grupo.nome}</h1>
      </div>
      <FormularioGrupo grupo={grupo} />
      <BotaoLembreteDeTeste grupoId={grupo.id} />
    </main>
  );
}
