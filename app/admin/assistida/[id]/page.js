import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirAdmin } from '@/lib/auth';
import { obterAssistida } from '@/lib/consultas';
import { formatarData, formatarDataPorExtenso, ordinal } from '@/lib/datas';
import { acaoExcluirVisita } from '@/app/actions';
import FormularioAssistida from '@/components/FormularioAssistida';
import BotaoExcluirAssistida from '@/components/BotaoExcluirAssistida';
import { IconeCheck, IconeLixeira, IconeSeta } from '@/components/Icones';

export const dynamic = 'force-dynamic';

export default async function PaginaEditarAssistida({ params, searchParams }) {
  await exigirAdmin();

  const { id } = await params;
  const { salvo } = await searchParams;

  const identificador = Number(id);
  if (!Number.isInteger(identificador)) notFound();

  const assistida = await obterAssistida(identificador);
  if (!assistida) notFound();

  const totalVisitas = assistida.visitas.length;

  return (
    <main className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin"
          className="botao-secundario inline-flex items-center gap-1 px-3 py-2 text-xs shrink-0"
        >
          <span className="rotate-90 inline-flex">
            <IconeSeta tamanho={14} />
          </span>
          Voltar
        </Link>
        <h1 className="text-lg font-bold min-w-0 break-words">{assistida.nome_completo}</h1>
      </div>

      {salvo && (
        <p className="cartao entrada flex items-center gap-2 px-4 py-3 mb-5 text-sm font-semibold">
          <IconeCheck tamanho={16} />
          Alterações salvas.
        </p>
      )}

      <FormularioAssistida assistida={assistida} />

      <section className="cartao p-5 mt-5" style={{ '--cor': '#1584c0' }}>
        <h2 className="font-bold text-sm">
          Histórico de visitas
          <span className="text-tinta-suave font-normal"> · {totalVisitas} no total</span>
        </h2>

        {totalVisitas === 0 ? (
          <p className="text-sm text-tinta-suave mt-2">Nenhuma visita registrada ainda.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {assistida.visitas.map((visita, indice) => (
              <li
                key={visita.id}
                className="bloco-doacao rounded-xl px-3 py-2.5 flex items-center gap-3"
              >
                <span className="font-bold text-sm shrink-0 w-10">
                  {ordinal(totalVisitas - indice)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{formatarData(visita.data)}</p>
                  <p className="text-xs text-tinta-suave">
                    {formatarDataPorExtenso(visita.data)}
                    {visita.observacao ? ` · ${visita.observacao}` : ''}
                  </p>
                </div>
                <form action={acaoExcluirVisita} className="shrink-0">
                  <input type="hidden" name="id" value={visita.id} />
                  <input type="hidden" name="assistida_id" value={assistida.id} />
                  <button
                    type="submit"
                    className="text-tinta-suave p-2"
                    aria-label={`Apagar a ${ordinal(totalVisitas - indice)} visita`}
                    title="Apagar esta visita"
                  >
                    <IconeLixeira tamanho={15} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-5 pb-4">
        <BotaoExcluirAssistida id={assistida.id} nome={assistida.nome_completo} />
      </section>
    </main>
  );
}
