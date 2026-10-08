'use client';

import { useActionState } from 'react';
import { acaoEnviarLembreteDeTeste } from '@/app/actions';

/** Painel: dispara agora um lembrete de teste para os e-mails do grupo. */
export default function BotaoLembreteDeTeste({ grupoId }) {
  const [resultado, acao, pendente] = useActionState(acaoEnviarLembreteDeTeste, null);

  return (
    <form action={acao} className="cartao p-5 mt-5 space-y-3" style={{ '--cor': '#1584c0' }}>
      <input type="hidden" name="id" value={grupoId} />
      <p className="text-sm font-semibold">Lembrete por e-mail</p>
      <p className="text-xs text-tinta-suave leading-snug">
        Manda agora o lembrete de registro para os e-mails deste grupo, com &quot;[Teste]&quot; no
        assunto. Não conta como o lembrete do mês: o envio automático continua igual.
      </p>
      <button type="submit" disabled={pendente} className="botao-secundario w-full py-2.5 text-sm">
        {pendente ? 'Enviando…' : 'Enviar lembrete de teste'}
      </button>
      {resultado && (
        <p className={`text-sm font-medium ${resultado.ok ? '' : 'bloco-alerta rounded-xl px-3 py-2'}`} role="status">
          {resultado.ok ? '✓ ' : ''}
          {resultado.mensagem}
        </p>
      )}
    </form>
  );
}
