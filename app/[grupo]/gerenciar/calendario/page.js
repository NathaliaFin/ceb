import Link from 'next/link';
import { exigirGrupo } from '@/lib/auth';
import { listarAssistidas, listarExcecoesCalendario, mapaDeExcecoes } from '@/lib/consultas';
import {
  formatarData, formatarDataPorExtenso, hojeIso, mesesDepois, mesesDeVisita, primeiraTriagem,
} from '@/lib/datas';
import { acaoRemoverExcecaoCalendario, acaoSalvarExcecaoCalendario } from '@/app/actions';
import { IconeAlerta, IconeCheck, IconeLapis, IconeSeta } from '@/components/Icones';

export const dynamic = 'force-dynamic';

const NOMES_MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export default async function PaginaCalendario({ params }) {
  const { grupo: slug } = await params;
  const { grupo } = await exigirGrupo(slug);

  const hoje = hojeIso();
  const [assistidas, excecoes] = await Promise.all([
    listarAssistidas(grupo.id, { incluirInativas: true }),
    listarExcecoesCalendario(grupo.id),
  ]);

  const mapa = mapaDeExcecoes(excecoes);
  const motivos = new Map(excecoes.map((e) => [e.mes, e.motivo]));

  // Da triagem mais antiga (ou um ano atras) ate tres meses a frente.
  const triagens = assistidas.map((a) => primeiraTriagem(a.triagens)).filter(Boolean).sort();
  const inicio = triagens.length > 0 ? triagens[0] : mesesDepois(hoje, -12);
  const meses = mesesDeVisita(inicio.slice(0, 7), mesesDepois(hoje, 3).slice(0, 7), mapa).reverse();

  return (
    <main className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link
          href={`/${grupo.slug}/gerenciar`}
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
        A visita cai no <strong>4º sábado</strong>, menos em <strong>dezembro</strong>, que é no 3º.
        A contagem de todos os cartões do {grupo.nome} sai daqui. Quando um mês fugir da regra, corrija
        abaixo: vale para <strong>todas</strong> as famílias do grupo de uma vez, e os números se
        corrigem sozinhos.
      </p>

      <ul className="space-y-2">
        {meses.map((item) => {
          const semVisita = item.alterado && item.data === null;
          const mudouDia = item.alterado && item.data !== null;
          const futuro = item.data !== null && item.data > hoje;
          const nomeMes = NOMES_MESES[item.mes - 1];
          // So a inicial em maiuscula: o "capitalize" do CSS deixava "Janeiro De 2027".
          const rotulo = `${nomeMes[0].toUpperCase()}${nomeMes.slice(1)} de ${item.ano}`;

          return (
            <li
              key={item.chave}
              className={`cartao p-3.5 ${semVisita ? 'cartao-inativo' : ''}`}
              style={{ '--cor': semVisita ? '#8a8178' : mudouDia ? '#c98200' : '#0f9372' }}
            >
              <div className="flex items-start gap-3">
                <span className="text-tinta-suave mt-0.5 shrink-0">
                  {semVisita ? <IconeAlerta tamanho={16} /> : mudouDia ? <IconeLapis tamanho={16} /> : <IconeCheck tamanho={16} />}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {rotulo}
                    {futuro && (
                      <span className="text-tinta-suave font-normal"> · ainda vai acontecer</span>
                    )}
                  </p>
                  <p className="text-xs text-tinta-suave mt-0.5">
                    {semVisita ? (
                      <span className="text-alerta font-semibold">
                        não houve visita
                        {motivos.get(item.chave) ? ` — ${motivos.get(item.chave)}` : ''}
                      </span>
                    ) : (
                      <>
                        {formatarDataPorExtenso(item.data)} · {formatarData(item.data)}
                        {mudouDia && (
                          <span className="font-semibold"> · data corrigida (o padrão seria {formatarData(item.padrao)})</span>
                        )}
                      </>
                    )}
                  </p>
                </div>

                {item.alterado && (
                  <form action={acaoRemoverExcecaoCalendario} className="shrink-0">
                    <input type="hidden" name="grupo" value={grupo.slug} />
                    <input type="hidden" name="mes" value={item.chave} />
                    <button type="submit" className="botao-secundario px-3 py-2 text-xs whitespace-nowrap">
                      Voltar ao padrão
                    </button>
                  </form>
                )}
              </div>

              {!item.alterado && (
                // Uma coluna no celular, duas lado a lado em tela maior — sempre
                // alinhadas de um mes para o outro.
                <div className="grid sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-borda">
                  <form action={acaoSalvarExcecaoCalendario} className="flex items-center gap-2">
                    <input type="hidden" name="grupo" value={grupo.slug} />
                    <input type="hidden" name="mes" value={item.chave} />
                    <input type="hidden" name="tipo" value="data" />
                    <input
                      type="date"
                      name="data"
                      defaultValue={item.padrao}
                      min={`${item.chave}-01`}
                      max={`${item.chave}-31`}
                      aria-label={`Data da visita de ${rotulo}`}
                      className="campo px-2.5 py-2 flex-1 min-w-0"
                    />
                    <button type="submit" className="botao-secundario px-3 py-2 text-xs whitespace-nowrap">
                      Mudar a data
                    </button>
                  </form>

                  <form action={acaoSalvarExcecaoCalendario} className="flex items-center gap-2">
                    <input type="hidden" name="grupo" value={grupo.slug} />
                    <input type="hidden" name="mes" value={item.chave} />
                    <input type="hidden" name="tipo" value="sem" />
                    <input
                      name="motivo"
                      placeholder="motivo"
                      aria-label={`Motivo de não haver visita em ${rotulo}`}
                      className="campo px-2.5 py-2 flex-1 min-w-0"
                    />
                    <button type="submit" className="botao-secundario px-3 py-2 text-xs whitespace-nowrap">
                      Não houve
                    </button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
