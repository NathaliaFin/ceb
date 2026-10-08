'use client';

import { useOptimistic, useTransition } from 'react';
import { acaoMarcarRegistroVisita } from '@/app/actions';
import { nomeDoMes, situacaoDoPrazo, ultimaVisitaFeita } from '@/lib/datas';

const AVISOS = {
  perto: 'Atenção ao prazo do almoxarifado',
  vencido: 'Prazo do almoxarifado vencido',
};

/**
 * "Visita de outubro registrada": o grupo marca quando registrou a visita.
 * Pergunta sempre pela ULTIMA VISITA QUE JA ACONTECEU — o registro e feito uma
 * ou duas semanas depois, muitas vezes ja no mes seguinte —, e so passa para a
 * visita seguinte no dia dela. A marcacao e guardada pelo mes da visita.
 *
 * Desmarcada perto do prazo do almoxarifado (14 dias apos a visita), mostra um
 * aviso pequeno em vermelho.
 */
export default function CaixaRegistroVisita({ assistida, hoje, calendario = {}, triagem }) {
  const visita = ultimaVisitaFeita(hoje, calendario);
  const mes = visita?.slice(0, 7);
  const salva = Boolean(mes) && (assistida.mesesRegistrados ?? []).includes(mes);
  const [marcada, marcarJa] = useOptimistic(salva);
  const [, iniciar] = useTransition();

  // Sem visita ainda (familia nova, triagem depois da ultima visita): nada a registrar.
  if (!visita || !triagem || triagem > visita) return null;

  const aviso = marcada ? null : AVISOS[situacaoDoPrazo(visita, hoje)];

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
    <div className="registro-visita-bloco" onClick={naoAbrirFicha} onKeyDown={naoAbrirFicha}>
      <label className={`registro-visita ${marcada ? 'registro-visita--feito' : ''}`}>
        <input type="checkbox" checked={marcada} onChange={alternar} />
        <span>Visita de {nomeDoMes(mes)} registrada</span>
      </label>
      {aviso && <p className="registro-visita__aviso">{aviso}</p>}
    </div>
  );
}
