import Link from 'next/link';
import { exigirAdmin } from '@/lib/auth';
import { listarAssistidas, listarDiasSemVisita } from '@/lib/consultas';
import {
  diasDeVisitaEntre, formatarData, formatarDataPorExtenso, hojeIso, mesesDepois,
  primeiraTriagem,
} from '@/lib/datas';
import { acaoDesmarcarSemVisita, acaoMarcarSemVisita } from '@/app/actions';
import { IconeAlerta, IconeCheck, IconeSeta } from '@/components/Icones';

export const dynamic = 'force-dynamic';

export default async function PaginaCalendario() {
  await exigirAdmin();

  const hoje = hojeIso();
  const [assistidas, diasSemVisita] = await Promise.all([
    listarAssistidas({ incluirInativas: true }),
    listarDiasSemVisita(),
  ]);

  // Mostra desde a triagem mais antiga (ou um ano atras) ate tres meses a frente.
  const triagens = assistidas.map((a) => primeiraTriagem(a.triagens)).filter(Boolean);
  const inicio = triagens.length > 0 ? triagens.sort()[0] : mesesDepois(hoje, -12);
  const dias = diasDeVisitaEntre(inicio, mesesDepois(hoje, 3)).reverse();

  const marcados = new Map(diasSemVisita.map((d) => [d.data, d.motivo]));

  return (
    <main className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/admin"
          className="botao-secundario inline-flex items-center gap-1 px-3 py-2 text-xs shrink-0"
        >
          <span className="rotate-90 inline-flex">
            <IconeSeta tamanho={14} />
          </span>
          Voltar
        </Link>
        <h1 className="text-lg font-bold">Calendário das visitas</h1>
      </div>

      <p className="text-sm text-tinta-suave leading-relaxed mb-5">
        Todo 4º sábado é dia de visita, e a contagem dos cartões sai daqui. Se num mês o grupo não
        foi a campo, marque abaixo: aquele mês deixa de contar para <strong>todas</strong> as
        famílias, e o número de cada cartão se corrige sozinho.
      </p>

      <ul className="space-y-2">
        {dias.map((dia) => {
          const semVisita = marcados.has(dia);
          const futuro = dia > hoje;

          return (
            <li
              key={dia}
              className={`cartao p-3.5 flex items-center gap-3 ${semVisita ? 'cartao-inativo' : ''}`}
              style={{ '--cor': semVisita ? '#8a8178' : '#0f9372' }}
            >
              <span className={semVisita ? 'text-tinta-suave' : 'text-tinta-suave'}>
                {semVisita ? <IconeAlerta tamanho={16} /> : <IconeCheck tamanho={16} />}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {formatarData(dia)}
                  {futuro && <span className="text-tinta-suave font-normal"> · ainda vai acontecer</span>}
                </p>
                <p className="text-xs text-tinta-suave">
                  {formatarDataPorExtenso(dia)}
                  {semVisita && (
                    <span className="text-alerta font-semibold">
                      {' · não houve visita'}
                      {marcados.get(dia) ? ` (${marcados.get(dia)})` : ''}
                    </span>
                  )}
                </p>
              </div>

              {semVisita ? (
                <form action={acaoDesmarcarSemVisita} className="shrink-0">
                  <input type="hidden" name="data" value={dia} />
                  <button type="submit" className="botao-secundario px-3 py-2 text-xs">
                    Houve, sim
                  </button>
                </form>
              ) : (
                <form action={acaoMarcarSemVisita} className="shrink-0 flex gap-2">
                  <input type="hidden" name="data" value={dia} />
                  <input
                    name="motivo"
                    placeholder="motivo (opcional)"
                    aria-label={`Motivo de não haver visita em ${formatarData(dia)}`}
                    className="campo text-xs w-28 px-2 py-1.5"
                  />
                  <button type="submit" className="botao-secundario px-3 py-2 text-xs whitespace-nowrap">
                    Não houve
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
