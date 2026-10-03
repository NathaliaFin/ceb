import Link from 'next/link';
import { exigirAdmin } from '@/lib/auth';
import { listarAssistidas } from '@/lib/consultas';
import { corDe, iniciais } from '@/lib/cores';
import { formatarData, hojeIso, numeroDaVisita, primeiraTriagem } from '@/lib/datas';
import { IconeLapis, IconeMais, IconeSeta } from '@/components/Icones';

export const dynamic = 'force-dynamic';

export default async function PaginaAdmin() {
  await exigirAdmin();
  const assistidas = await listarAssistidas({ incluirInativas: true });
  const hoje = hojeIso();

  return (
    <main className="px-4 py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="botao-secundario inline-flex items-center gap-1 px-3 py-2 text-xs shrink-0"
        >
          <span className="rotate-90 inline-flex">
            <IconeSeta tamanho={14} />
          </span>
          Cartões
        </Link>
        <h1 className="text-lg font-bold flex-1 min-w-0">Gerenciar cadastros</h1>
        <Link
          href="/admin/assistida/nova"
          className="botao-primario inline-flex items-center gap-1.5 px-3 py-2 text-xs shrink-0"
        >
          <IconeMais tamanho={14} />
          Nova
        </Link>
      </div>

      {assistidas.length === 0 ? (
        <div className="cartao p-8 text-center" style={{ '--cor': '#e0376f' }}>
          <p className="text-sm text-tinta-suave">
            Nenhuma assistida cadastrada. Comece pela primeira família.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {assistidas.map((assistida, indice) => {
            const cor = corDe(assistida.cor);
            return (
              <li key={assistida.id}>
                <Link
                  href={`/admin/assistida/${assistida.id}`}
                  className={`cartao entrada flex items-center gap-3 p-4 ${
                    assistida.ativa ? '' : 'cartao-inativo'
                  }`}
                  style={{ '--cor': cor.base, animationDelay: `${Math.min(indice, 8) * 60}ms` }}
                >
                  <div className="avatar w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                    {iniciais(assistida.nome_completo)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm leading-snug break-words">
                      {assistida.nome_completo}
                      {!assistida.ativa && (
                        <span className="text-xs text-tinta-suave font-normal"> · inativa</span>
                      )}
                    </p>
                    <p className="text-xs text-tinta-suave mt-0.5">
                      {assistida.triagens?.length
                        ? `${numeroDaVisita(primeiraTriagem(assistida.triagens), hoje)} visitas · ${
                            assistida.triagens.length > 1
                              ? `${assistida.triagens.length} triagens, a 1ª em `
                              : 'em '
                          }${formatarData(primeiraTriagem(assistida.triagens))}`
                        : 'sem triagem registrada'}
                      {assistida.necessidades_emergenciais && ' · 🚨 emergência'}
                    </p>
                  </div>
                  <span className="text-tinta-suave shrink-0">
                    <IconeLapis tamanho={16} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
