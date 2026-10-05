import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirAdmin } from '@/lib/auth';
import { listarExcecoesCalendario, mapaDeExcecoes, obterAssistida } from '@/lib/consultas';
import {
  formatarData, hojeIso, numeroDaVisita, primeiraTriagem, proximaVisita,
} from '@/lib/datas';
import FormularioAssistida from '@/components/FormularioAssistida';
import BotaoExcluirAssistida from '@/components/BotaoExcluirAssistida';
import { IconeCalendario, IconeCheck, IconeSeta } from '@/components/Icones';

export const dynamic = 'force-dynamic';

export default async function PaginaEditarAssistida({ params, searchParams }) {
  await exigirAdmin();

  const { id } = await params;
  const { salvo } = await searchParams;

  const identificador = Number(id);
  if (!Number.isInteger(identificador)) notFound();

  const assistida = await obterAssistida(identificador);
  if (!assistida) notFound();

  const hoje = hojeIso();
  const calendario = mapaDeExcecoes(await listarExcecoesCalendario());
  const proxima = proximaVisita(hoje, calendario);
  const triagem = primeiraTriagem(assistida.triagens);
  const quantasTriagens = assistida.triagens?.length ?? 0;

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

      <section className="cartao p-4 mb-5 flex items-start gap-3" style={{ '--cor': '#1584c0' }}>
        <span className="text-tinta-suave mt-0.5">
          <IconeCalendario tamanho={18} />
        </span>
        <div className="text-sm leading-snug">
          {triagem ? (
            <>
              <p>
                O cartão mostra{' '}
                <strong>
                  {numeroDaVisita(triagem, hoje, calendario)}{' '}
                  {numeroDaVisita(triagem, hoje, calendario) === 1 ? 'visita' : 'visitas'}
                </strong>
                , contando a triagem de {formatarData(triagem)} como a primeira.
              </p>
              <p className="text-tinta-suave text-xs mt-1">
                Próxima em {formatarData(proxima)}, quando passa a {numeroDaVisita(triagem, proxima, calendario)}.
                A contagem vem do calendário: nada precisa ser confirmado.
                {quantasTriagens > 1 &&
                  ` São ${quantasTriagens} triagens registradas; a contagem usa a primeira.`}
              </p>
            </>
          ) : (
            <p className="text-tinta-suave">
              Sem nenhuma triagem registrada, o cartão mostra um traço no lugar do número.
            </p>
          )}
        </div>
      </section>

      <FormularioAssistida assistida={assistida} />

      <section className="mt-5 pb-4">
        <BotaoExcluirAssistida id={assistida.id} nome={assistida.nome_completo} />
      </section>
    </main>
  );
}
