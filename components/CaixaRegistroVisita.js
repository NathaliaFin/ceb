'use client';

import { useOptimistic, useTransition } from 'react';
import { acaoMarcarRegistroVisita } from '@/app/actions';
import { nomeDoMes } from '@/lib/datas';

/**
 * "Visita de outubro registrada": o grupo marca quando registrou a visita do
 * mes. O mes e sempre o corrente; na virada, a caixa aparece desmarcada para o
 * mes novo (a marcacao e guardada por mes, ver migracao 011).
 */
export default function CaixaRegistroVisita({ assistida, hoje }) {
  const mes = hoje.slice(0, 7);
  const salva = (assistida.mesesRegistrados ?? []).includes(mes);
  const [marcada, marcarJa] = useOptimistic(salva);
  const [, iniciar] = useTransition();

  function alternar(evento) {
    const nova = evento.target.checked;
    iniciar(async () => {
      marcarJa(nova); // aparece na hora; se o servidor falhar, volta sozinha
      await acaoMarcarRegistroVisita(assistida.id, nova);
    });
  }

  // O cartao inteiro abre a ficha: tocar aqui nao pode fazer as duas coisas.
  const naoAbrirFicha = (evento) => evento.stopPropagation();

  return (
    <label
      className={`registro-visita ${marcada ? 'registro-visita--feito' : ''}`}
      onClick={naoAbrirFicha}
      onKeyDown={naoAbrirFicha}
    >
      <input type="checkbox" checked={marcada} onChange={alternar} />
      <span>Visita de {nomeDoMes(mes)} registrada</span>
    </label>
  );
}
