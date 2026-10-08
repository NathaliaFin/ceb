'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { acaoDesligarAssistida, acaoReativarAssistida } from '@/app/actions';
import { IconeArquivo, IconeVoltarSeta } from './Icones';

/**
 * Desliga a familia do programa (vai para "Familias atendidas") ou a reativa
 * (volta para os cartoes). Sempre pede confirmacao antes.
 */
export default function BotaoDesligamento({ assistida, modo, aoConcluir, className = '' }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const desligar = modo === 'desligar';

  function clicar(evento) {
    // Dentro do cartao, o toque nao pode abrir a ficha junto.
    evento.stopPropagation();
    const pergunta = desligar
      ? `Desligar ${assistida.nome_completo} do programa?\n\nA família sai dos cartões e vai para "Famílias atendidas". Dá para reativar depois.`
      : `Reativar ${assistida.nome_completo}?\n\nA família volta para os cartões.`;
    if (!window.confirm(pergunta)) return;

    iniciar(async () => {
      await (desligar ? acaoDesligarAssistida : acaoReativarAssistida)(assistida.id);
      aoConcluir?.();
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={clicar}
      disabled={pendente}
      className={`${desligar ? 'botao-desligar' : 'botao-primario'} inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm ${className}`}
    >
      {desligar ? <IconeArquivo tamanho={16} /> : <IconeVoltarSeta tamanho={16} />}
      {pendente ? 'Aguarde…' : desligar ? 'Desligar família' : 'Reativar família'}
    </button>
  );
}
