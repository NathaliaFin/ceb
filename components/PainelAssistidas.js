'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import CardAssistida from './CardAssistida';
import { IconeBusca, IconeMais } from './Icones';

/** Busca sem acento, para "familia" encontrar "família". */
function semAcento(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function textoPesquisavel(assistida) {
  return semAcento(
    [
      assistida.nome_completo,
      assistida.endereco,
      assistida.referencia,
      assistida.telefone,
      assistida.itens_doacao,
      assistida.necessidades_emergenciais,
      assistida.observacoes,
      ...(assistida.familiares ?? []).map((familiar) => `${familiar.nome} ${familiar.parentesco ?? ''}`),
    ]
      .filter(Boolean)
      .join(' '),
  );
}

export default function PainelAssistidas({ assistidas, hoje, proximaVisita, podeEditar }) {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todas');

  const comEmergencia = assistidas.filter((a) => a.necessidades_emergenciais).length;
  const pendentes = assistidas.filter((a) => a.ultima_visita !== hoje).length;

  const visiveis = useMemo(() => {
    const termo = semAcento(busca.trim());
    return assistidas.filter((assistida) => {
      if (filtro === 'emergencia' && !assistida.necessidades_emergenciais) return false;
      if (filtro === 'pendentes' && assistida.ultima_visita === hoje) return false;
      if (!termo) return true;
      return textoPesquisavel(assistida).includes(termo);
    });
  }, [assistidas, busca, filtro, hoje]);

  const filtros = [
    { chave: 'todas', rotulo: 'Todas', contagem: assistidas.length },
    { chave: 'emergencia', rotulo: '🚨 Com emergência', contagem: comEmergencia },
    { chave: 'pendentes', rotulo: 'Falta registrar', contagem: pendentes },
  ];

  if (assistidas.length === 0) {
    return (
      <div className="cartao p-8 text-center entrada" style={{ '--cor': '#e0376f' }}>
        <p className="font-semibold">Nenhuma assistida cadastrada ainda.</p>
        <p className="text-sm text-tinta-suave mt-1.5">
          {podeEditar
            ? 'Cadastre a primeira família para os cartões aparecerem aqui.'
            : 'Peça para a administradora cadastrar as famílias do projeto.'}
        </p>
        {podeEditar && (
          <Link
            href="/admin/assistida/nova"
            className="botao-primario inline-flex items-center gap-1.5 px-4 py-2.5 mt-5 text-sm"
          >
            <IconeMais tamanho={16} />
            Cadastrar assistida
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 mb-5">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tinta-suave">
            <IconeBusca tamanho={17} />
          </span>
          <input
            type="search"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar por nome, endereço ou familiar…"
            aria-label="Buscar assistida"
            className="campo pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {filtros.map((opcao) => (
            <button
              key={opcao.chave}
              type="button"
              onClick={() => setFiltro(opcao.chave)}
              aria-pressed={filtro === opcao.chave}
              className="filtro"
            >
              {opcao.rotulo}
              <span className="ml-1.5 opacity-60">{opcao.contagem}</span>
            </button>
          ))}
        </div>
      </div>

      {visiveis.length === 0 ? (
        <div className="cartao p-8 text-center" style={{ '--cor': '#8a8178' }}>
          <p className="text-sm text-tinta-suave">
            Nenhum cartão corresponde ao que você procurou.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visiveis.map((assistida, indice) => (
            <CardAssistida
              key={assistida.id}
              assistida={assistida}
              hoje={hoje}
              proximaVisita={proximaVisita}
              indice={indice}
            />
          ))}
        </div>
      )}
    </>
  );
}
