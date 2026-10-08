import Link from 'next/link';
import { exigirSessao } from '@/lib/auth';
import { listarExcecoesCalendario, listarFamiliasAtendidas, mapaDeExcecoes } from '@/lib/consultas';
import { formatarData, hojeIso, proximaVisita } from '@/lib/datas';
import CardAssistida from '@/components/CardAssistida';
import BotaoDesligamento from '@/components/BotaoDesligamento';
import { IconeSeta } from '@/components/Icones';

export const dynamic = 'force-dynamic';

/**
 * Familias desligadas do programa, ja atendidas. Ficam em cinza, com a data do
 * desligamento e o botao de reativar (raro, mas acontece).
 */
export default async function PaginaFamiliasAtendidas() {
  const papel = await exigirSessao();
  const podeEditar = papel === 'admin';
  const hoje = hojeIso();

  const [atendidas, excecoes] = await Promise.all([listarFamiliasAtendidas(), listarExcecoesCalendario()]);
  const calendario = mapaDeExcecoes(excecoes);
  const proxima = proximaVisita(hoje, calendario);

  return (
    <main className="px-4 py-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/" className="botao-secundario inline-flex items-center gap-1 px-3 py-2 text-xs shrink-0">
          <span className="rotate-90 inline-flex">
            <IconeSeta tamanho={14} />
          </span>
          Voltar
        </Link>
        <h1 className="text-lg font-bold">Famílias atendidas</h1>
      </div>
      <p className="text-sm text-tinta-suave mb-6 leading-snug">
        Famílias desligadas do programa depois de atendidas.{' '}
        {atendidas.length === 0
          ? 'Nenhuma por enquanto.'
          : `${atendidas.length} ${atendidas.length === 1 ? 'família' : 'famílias'}. Toque no cartão para ver a ficha.`}
      </p>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {atendidas.map((assistida, indice) => (
          <li key={assistida.id} className="flex flex-col gap-2">
            <div className="cartao-desligado">
              <CardAssistida
                assistida={assistida}
                hoje={hoje}
                proximaVisita={proxima}
                calendario={calendario}
                indice={indice}
                podeEditar={podeEditar}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-tinta-suave">
                {assistida.desligada_em ? `Desligada em ${formatarData(assistida.desligada_em)}` : 'Desligada'}
              </span>
              {podeEditar && <BotaoDesligamento assistida={assistida} modo="reativar" />}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
