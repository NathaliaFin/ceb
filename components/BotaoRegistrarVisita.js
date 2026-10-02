'use client';

import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { acaoRegistrarVisita } from '@/app/actions';
import { IconeCheck } from './Icones';

function Botao({ confirmando, destaque, numero, aoClicar }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={aoClicar}
      className={`${confirmando || destaque ? 'botao-primario' : 'botao-secundario'} text-xs px-3 py-2 whitespace-nowrap`}
    >
      {pending ? 'Salvando…' : confirmando ? 'Confirmar?' : `Registrar ${numero}`}
    </button>
  );
}

/**
 * Dois toques para registrar: o primeiro arma, o segundo confirma. Em campo, no
 * celular, o toque sem querer e comum — e so a administradora pode desfazer.
 *
 * O envio e um formulario comum apontando para a server action, entao continua
 * funcionando mesmo que o JavaScript nao carregue; nesse caso perde-se so a
 * etapa de confirmacao.
 */
export default function BotaoRegistrarVisita({ assistidaId, data, jaRegistrada, numero, destaque }) {
  const [confirmando, setConfirmando] = useState(false);
  const [registrada, setRegistrada] = useState(jaRegistrada);

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

  function aoClicar(evento) {
    if (!confirmando) {
      evento.preventDefault();
      setConfirmando(true);
    }
  }

  return (
    <form action={acaoRegistrarVisita}>
      <input type="hidden" name="assistida_id" value={assistidaId} />
      <input type="hidden" name="data" value={data} />
      <Botao confirmando={confirmando} destaque={destaque} numero={numero} aoClicar={aoClicar} />
    </form>
  );
}
