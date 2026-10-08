import Link from 'next/link';
import { sair } from '@/app/actions';
import { exigirAdministradora } from '@/lib/auth';
import { listarGrupos } from '@/lib/grupos';
import { corDe } from '@/lib/cores';
import FormularioGrupo from '@/components/FormularioGrupo';
import { IconeCheck, IconeLapis, IconeSair } from '@/components/Icones';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Visita DPS - Administração' };

/** Painel da administradora: os grupos e o cadastro de um novo. */
export default async function PaginaPainel({ searchParams }) {
  await exigirAdministradora();
  const { salvo } = await searchParams;
  const grupos = await listarGrupos({ incluirInativos: true });

  return (
    <main className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-lg font-bold flex-1">Grupos</h1>
        <Link href="/" className="botao-secundario px-3 py-2 text-xs">Página principal</Link>
        <form action={sair}>
          <button type="submit" className="botao-secundario inline-flex items-center gap-1.5 px-3 py-2 text-xs">
            <IconeSair tamanho={14} />
            Sair
          </button>
        </form>
      </div>

      {salvo && (
        <p className="cartao entrada flex items-center gap-2 px-4 py-3 mb-5 text-sm font-semibold">
          <IconeCheck tamanho={16} />
          Grupo salvo.
        </p>
      )}

      <ul className="space-y-3 mb-8">
        {grupos.map((grupo) => (
          <li key={grupo.id}>
            <div
              className={`cartao flex items-center gap-3 p-4 ${grupo.ativo ? '' : 'cartao-inativo'}`}
              style={{ '--cor': corDe(grupo.cor).base }}
            >
              <div className="min-w-0 flex-1">
                <Link href={`/${grupo.slug}`} className="font-semibold text-sm hover:underline">
                  {grupo.nome}
                </Link>
                <p className="text-xs text-tinta-suave mt-0.5">
                  /{grupo.slug} · {grupo.familias} {grupo.familias === 1 ? 'família' : 'famílias'}
                  {!grupo.ativo && ' · fora da página principal'}
                  {!grupo.lembrete_destinatarios && ' · sem e-mails de lembrete'}
                </p>
              </div>
              <Link
                href={`/painel/${grupo.id}`}
                className="botao-secundario inline-flex items-center gap-1 px-3 py-2 text-xs shrink-0"
              >
                <IconeLapis tamanho={14} />
                Editar
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="text-base font-bold mb-3">Novo grupo</h2>
      <FormularioGrupo grupo={null} />
    </main>
  );
}
