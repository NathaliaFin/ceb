'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { acaoConcluirEmergencia, acaoExcluirEmergencia, acaoReabrirEmergencia } from '@/app/actions';
import { formatarData } from '@/lib/datas';
import { emergenciasAbertas, emergenciasConcluidas } from '@/lib/emergencias';
import { IconeAlerta, IconeCheck, IconeLixeira } from './Icones';

function BotaoExcluir({ aoClicar, desligado }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={desligado}
      className="botao-secundario shrink-0 inline-flex items-center justify-center w-8 h-8 text-tinta-suave"
      aria-label="Excluir necessidade"
      title="Excluir"
    >
      <IconeLixeira tamanho={14} />
    </button>
  );
}

/**
 * Necessidades emergenciais no cadastro: as abertas com o botao de concluir,
 * o campo para registrar uma nova (vai junto com o "Salvar") e o historico.
 *
 * Concluir e reabrir chamam o servidor direto, sem enviar o formulario em
 * volta: o que estiver sendo editado no cadastro continua na tela.
 */
export default function EmergenciasNoCadastro({ assistida }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [emAndamento, setEmAndamento] = useState(null);

  const abertas = emergenciasAbertas(assistida);
  const concluidas = emergenciasConcluidas(assistida);

  function excluir(emergencia) {
    const confirmou = window.confirm(
      `Excluir esta necessidade?

"${emergencia.texto}"

Ela some do cartão e do histórico, sem como desfazer.`,
    );
    if (confirmou) executar(acaoExcluirEmergencia, emergencia.id);
  }

  function executar(acao, id) {
    setEmAndamento(id);
    iniciar(async () => {
      await acao(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="block text-sm font-semibold">Necessidade emergencial</p>

      {abertas.length > 0 && (
        <ul className="space-y-2">
          {abertas.map((emergencia) => (
            <li key={emergencia.id} className="bloco-alerta rounded-xl p-3 flex items-start gap-3">
              <span className="mt-0.5 shrink-0">
                <IconeAlerta tamanho={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug whitespace-pre-line text-tinta font-medium break-words">
                  {emergencia.texto}
                </p>
                <p className="text-xs mt-1 opacity-80">Registrada em {formatarData(emergencia.registrada_em)}</p>
              </div>
              <button
                type="button"
                onClick={() => executar(acaoConcluirEmergencia, emergencia.id)}
                disabled={pendente}
                className="botao-secundario shrink-0 inline-flex items-center gap-1 px-3 py-2 text-xs"
              >
                <IconeCheck tamanho={14} />
                {pendente && emAndamento === emergencia.id ? 'Aguarde…' : 'Concluir'}
              </button>
              <BotaoExcluir aoClicar={() => excluir(emergencia)} desligado={pendente} />
            </li>
          ))}
        </ul>
      )}

      <div>
        <label htmlFor="nova_emergencia" className="block text-xs font-semibold text-tinta-suave mb-1.5">
          {abertas.length > 0 ? 'Registrar outra necessidade' : 'Registrar necessidade'}
        </label>
        {/* Recriado vazio a cada necessidade nova: um segundo "Salvar" nao a
            registra de novo. */}
        <textarea
          key={assistida?.emergencias?.length ?? 0}
          id="nova_emergencia"
          name="nova_emergencia"
          rows={2}
          className="campo resize-y"
          placeholder="O botijão de gás acabou"
        />
        <p className="text-xs text-tinta-suave mt-1.5 leading-snug">
          Entra ao salvar e aparece em destaque e piscando no cartão. Quando for resolvida, toque em
          Concluir: ela sai do cartão e fica no histórico.
        </p>
      </div>

      {concluidas.length > 0 && (
        <details className="rounded-xl border border-borda px-3 py-2">
          <summary className="cursor-pointer text-sm font-semibold py-1">
            Histórico ({concluidas.length} {concluidas.length === 1 ? 'concluída' : 'concluídas'})
          </summary>
          <ul className="mt-2 space-y-2 pb-1">
            {concluidas.map((emergencia) => (
              <li key={emergencia.id} className="flex items-start gap-3 border-t border-borda pt-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug whitespace-pre-line break-words">{emergencia.texto}</p>
                  <p className="text-xs text-tinta-suave mt-1">
                    Registrada em {formatarData(emergencia.registrada_em)} · concluída em{' '}
                    {formatarData(emergencia.concluida_em)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => executar(acaoReabrirEmergencia, emergencia.id)}
                  disabled={pendente}
                  className="botao-secundario shrink-0 px-3 py-1.5 text-xs"
                >
                  {pendente && emAndamento === emergencia.id ? 'Aguarde…' : 'Reabrir'}
                </button>
                <BotaoExcluir aoClicar={() => excluir(emergencia)} desligado={pendente} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
