'use client';

import { useActionState, useState } from 'react';
import { acaoSalvarAssistida } from '@/app/actions';
import { CHAVES_CORES, PALETA, iniciais } from '@/lib/cores';
import { IconeLixeira, IconeMais } from './Icones';

function Campo({ nome, rotulo, dica, children }) {
  return (
    <div>
      <label htmlFor={nome} className="block text-sm font-semibold mb-1.5">
        {rotulo}
      </label>
      {children}
      {dica && <p className="text-xs text-tinta-suave mt-1.5 leading-snug">{dica}</p>}
    </div>
  );
}

function linhaDeFamiliar(familiar) {
  return {
    chave: Math.random().toString(36).slice(2),
    nome: familiar?.nome ?? '',
    parentesco: familiar?.parentesco ?? '',
    idade: familiar?.idade ?? '',
    observacao: familiar?.observacao ?? '',
  };
}

export default function FormularioAssistida({ assistida }) {
  const [estado, acao, pendente] = useActionState(acaoSalvarAssistida, { erro: null });

  const [cor, setCor] = useState(assistida?.cor ?? 'rosa');
  const [nome, setNome] = useState(assistida?.nome_completo ?? '');
  const [familiares, setFamiliares] = useState(
    assistida?.familiares?.length ? assistida.familiares.map(linhaDeFamiliar) : [linhaDeFamiliar()],
  );

  const coordenadasIniciais =
    assistida?.latitude !== null && assistida?.latitude !== undefined
      ? `${assistida.latitude}, ${assistida.longitude}`
      : '';

  function alterarFamiliar(chave, campo, valor) {
    setFamiliares((linhas) =>
      linhas.map((linha) => (linha.chave === chave ? { ...linha, [campo]: valor } : linha)),
    );
  }

  return (
    <form action={acao} className="space-y-5">
      {assistida?.id && <input type="hidden" name="id" value={assistida.id} />}

      {estado?.erro && (
        <p className="bloco-alerta rounded-xl px-4 py-3 text-sm font-medium" role="alert">
          {estado.erro}
        </p>
      )}

      <section className="cartao p-5 space-y-4" style={{ '--cor': PALETA[cor].base }}>
        <div className="flex items-center gap-3">
          <div
            className="avatar w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
            style={{ '--cor': PALETA[cor].base }}
          >
            {iniciais(nome || '?')}
          </div>
          <div className="min-w-0 flex-1">
            <Campo nome="nome_completo" rotulo="Nome completo">
              <input
                id="nome_completo"
                name="nome_completo"
                required
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
                className="campo"
                placeholder="Maria da Silva Santos"
              />
            </Campo>
          </div>
        </div>

        <div>
          <span className="block text-sm font-semibold mb-2">Cor do cartão</span>
          <div className="flex flex-wrap gap-2">
            {CHAVES_CORES.map((chave) => (
              <button
                key={chave}
                type="button"
                onClick={() => setCor(chave)}
                aria-pressed={cor === chave}
                title={PALETA[chave].nome}
                className="w-9 h-9 rounded-full transition-transform"
                style={{
                  background: PALETA[chave].base,
                  transform: cor === chave ? 'scale(1.12)' : 'none',
                  boxShadow: cor === chave ? `0 0 0 3px var(--papel), 0 0 0 5px ${PALETA[chave].base}` : 'none',
                }}
              >
                <span className="sr-only">{PALETA[chave].nome}</span>
              </button>
            ))}
          </div>
          <input type="hidden" name="cor" value={cor} />
        </div>

        <Campo nome="telefone" rotulo="Telefone (WhatsApp)" dica="Com DDD. Ex.: (31) 99999-9999">
          <input
            id="telefone"
            name="telefone"
            type="tel"
            defaultValue={assistida?.telefone ?? ''}
            className="campo"
            placeholder="(31) 99999-9999"
          />
        </Campo>

        <Campo nome="endereco" rotulo="Endereço">
          <input
            id="endereco"
            name="endereco"
            defaultValue={assistida?.endereco ?? ''}
            className="campo"
            placeholder="Rua das Flores, 123 — Bairro, Cidade"
          />
        </Campo>

        <Campo
          nome="coordenadas"
          rotulo="Coordenadas"
          dica="No Google Maps, segure o dedo sobre a casa e copie os números que aparecem. Com isso o Waze abre no portão certo, não no meio da rua."
        >
          <input
            id="coordenadas"
            name="coordenadas"
            defaultValue={coordenadasIniciais}
            className="campo font-mono text-sm"
            placeholder="-19.9227, -43.9451"
          />
        </Campo>

        <Campo
          nome="referencia"
          rotulo="Ponto de referência"
          dica="O que ajuda o voluntário a achar a casa."
        >
          <input
            id="referencia"
            name="referencia"
            defaultValue={assistida?.referencia ?? ''}
            className="campo"
            placeholder="Casa azul, ao lado da padaria"
          />
        </Campo>
      </section>

      <section className="cartao p-5 space-y-3" style={{ '--cor': PALETA[cor].base }}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold text-sm">Pessoas da família</h2>
          <button
            type="button"
            onClick={() => setFamiliares((linhas) => [...linhas, linhaDeFamiliar()])}
            className="botao-secundario inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            <IconeMais tamanho={14} />
            Adicionar
          </button>
        </div>

        {familiares.map((linha) => (
          <div key={linha.chave} className="bloco-doacao rounded-xl p-3 space-y-2">
            <div className="flex gap-2">
              <input
                name="familiar_nome"
                value={linha.nome}
                onChange={(evento) => alterarFamiliar(linha.chave, 'nome', evento.target.value)}
                className="campo flex-1"
                placeholder="Nome"
                aria-label="Nome do familiar"
              />
              <button
                type="button"
                onClick={() =>
                  setFamiliares((linhas) => linhas.filter((item) => item.chave !== linha.chave))
                }
                className="botao-secundario px-3 shrink-0"
                aria-label="Remover familiar"
              >
                <IconeLixeira tamanho={15} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="familiar_parentesco"
                value={linha.parentesco}
                onChange={(evento) => alterarFamiliar(linha.chave, 'parentesco', evento.target.value)}
                className="campo"
                placeholder="Parentesco"
                aria-label="Parentesco"
              />
              <input
                name="familiar_idade"
                type="number"
                min="0"
                max="129"
                value={linha.idade}
                onChange={(evento) => alterarFamiliar(linha.chave, 'idade', evento.target.value)}
                className="campo"
                placeholder="Idade"
                aria-label="Idade"
              />
            </div>
            <input
              name="familiar_observacao"
              value={linha.observacao}
              onChange={(evento) => alterarFamiliar(linha.chave, 'observacao', evento.target.value)}
              className="campo"
              placeholder="Observação (opcional)"
              aria-label="Observação sobre o familiar"
            />
          </div>
        ))}

        {familiares.length === 0 && (
          <p className="text-sm text-tinta-suave">Nenhum familiar cadastrado.</p>
        )}
      </section>

      <section className="cartao p-5 space-y-4" style={{ '--cor': PALETA[cor].base }}>
        <Campo
          nome="itens_doacao"
          rotulo="Itens especiais de doação"
          dica="O que esta família precisa com regularidade."
        >
          <textarea
            id="itens_doacao"
            name="itens_doacao"
            rows={3}
            defaultValue={assistida?.itens_doacao ?? ''}
            className="campo resize-y"
            placeholder="Fralda geriátrica tamanho G, leite sem lactose…"
          />
        </Campo>

        <Campo
          nome="necessidades_emergenciais"
          rotulo="Necessidade emergencial"
          dica="Aparece em destaque e piscando no cartão. Apague quando estiver resolvido."
        >
          <textarea
            id="necessidades_emergenciais"
            name="necessidades_emergenciais"
            rows={2}
            defaultValue={assistida?.necessidades_emergenciais ?? ''}
            className="campo resize-y"
            placeholder="O botijão de gás acabou"
          />
        </Campo>

        <Campo nome="observacoes" rotulo="Observações gerais">
          <textarea
            id="observacoes"
            name="observacoes"
            rows={3}
            defaultValue={assistida?.observacoes ?? ''}
            className="campo resize-y"
            placeholder="Informações úteis para os voluntários"
          />
        </Campo>

        <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            name="ativa"
            defaultChecked={assistida ? assistida.ativa : true}
            className="w-4 h-4 accent-current"
          />
          Família ativa no projeto
          <span className="text-xs text-tinta-suave font-normal">
            (desmarque para esconder o cartão sem apagar o histórico)
          </span>
        </label>
      </section>

      <div className="flex gap-3 sticky bottom-4">
        <button type="submit" disabled={pendente} className="botao-primario flex-1 py-3">
          {pendente ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
