'use client';

import { useState } from 'react';
import { acaoExcluirAssistida } from '@/app/actions';
import { IconeLixeira } from './Icones';

/**
 * Apagar leva junto o historico de visitas, entao exige confirmacao digitada.
 * Para tirar a familia da lista sem perder nada, basta desmarcar "ativa".
 */
export default function BotaoExcluirAssistida({ id, nome }) {
  const [aberto, setAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState('');

  const liberado = confirmacao.trim().toLowerCase() === 'apagar';

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-alerta px-3 py-2"
      >
        <IconeLixeira tamanho={14} />
        Apagar cadastro
      </button>
    );
  }

  return (
    <div className="bloco-alerta rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold">Apagar o cadastro de {nome}?</p>
      <p className="text-xs text-tinta leading-snug">
        Isso apaga também todo o histórico de visitas e não tem volta. Se a intenção é só tirar da
        lista, volte e desmarque <strong>Família ativa no projeto</strong>.
      </p>
      <input
        value={confirmacao}
        onChange={(evento) => setConfirmacao(evento.target.value)}
        className="campo"
        placeholder="Digite APAGAR para confirmar"
        aria-label="Digite APAGAR para confirmar"
      />
      <div className="flex gap-2">
        <form action={acaoExcluirAssistida} className="flex-1">
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={!liberado}
            className="botao-primario w-full py-2.5 text-sm disabled:opacity-40"
          >
            Apagar definitivamente
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setAberto(false);
            setConfirmacao('');
          }}
          className="botao-secundario px-4 py-2.5 text-sm"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
