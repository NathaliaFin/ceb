'use client';

import { useEffect, useState, useTransition } from 'react';
import { acaoRegistrarVisita } from '@/app/actions';
import { IconeCheck } from './Icones';

/**
 * Dois toques para registrar: o primeiro arma, o segundo confirma. Em campo, no
 * celular, o toque sem querer e comum — e so a administradora pode desfazer.
 */
export default function BotaoRegistrarVisita({ assistidaId, data, jaRegistrada, numero, destaque }) {
  const [confirmando, setConfirmando] = useState(false);
  const [registrada, setRegistrada] = useState(jaRegistrada);
  const [pendente, iniciarTransicao] = useTransition();

  useEffect(() => setRegistrada(jaRegistrada), [jaRegistrada]);

  useEffect(() => {
    if (!confirmando) return undefined;
    const temporizador = setTimeout(() => setConfirmando(false), 4000);
    return () => clearTimeout(temporizador);
  }, [confirmando]);

  if (registrada) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bloco-doacao">
        <IconeCheck tamanho={14} />
        Registrada
      </span>
    );
  }

  function aoEnviar(dadosDoFormulario) {
    if (!confirmando) {
      setConfirmando(true);
      return;
    }
    iniciarTransicao(async () => {
      await acaoRegistrarVisita(dadosDoFormulario);
      setConfirmando(false);
      setRegistrada(true);
    });
  }

  return (
    <form action={aoEnviar}>
      <input type="hidden" name="assistida_id" value={assistidaId} />
      <input type="hidden" name="data" value={data} />
      <button
        type="submit"
        disabled={pendente}
        className={`${confirmando || destaque ? 'botao-primario' : 'botao-secundario'} text-xs px-3 py-2 whitespace-nowrap`}
      >
        {pendente ? 'Salvando…' : confirmando ? 'Confirmar?' : `Registrar ${numero}`}
      </button>
    </form>
  );
}
