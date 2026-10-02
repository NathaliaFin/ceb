'use client';

import { useState } from 'react';
import { corDe, iniciais } from '@/lib/cores';
import { formatarData, formatarDataCurta, ordinal } from '@/lib/datas';
import { linkGoogleMaps, linkTelefone, linkWaze, linkWhatsapp, telefoneFormatado } from '@/lib/links';
import BotaoRegistrarVisita from './BotaoRegistrarVisita';
import {
  IconeAlerta, IconeCalendario, IconeCasa, IconeConversa, IconeNavegacao,
  IconeNota, IconePessoas, IconePino, IconePresente, IconeSeta,
} from './Icones';

function BotaoAcao({ href, classe, rotulo, children }) {
  if (!href) {
    return (
      <span className={`botao-acao ${classe}`} aria-disabled="true" title="Sem informação cadastrada">
        {children}
        <span>{rotulo}</span>
      </span>
    );
  }
  return (
    <a className={`botao-acao ${classe}`} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span>{rotulo}</span>
    </a>
  );
}

function Rotulo({ icone, children }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-tinta-suave">
      {icone}
      {children}
    </div>
  );
}

export default function CardAssistida({ assistida, hoje, proximaVisita, indice = 0 }) {
  const [aberto, setAberto] = useState(false);

  const cor = corDe(assistida.cor);
  const total = assistida.total_visitas ?? 0;
  const registradaHoje = assistida.ultima_visita === hoje;
  const ehDiaDeVisita = proximaVisita === hoje;
  const temEmergencia = Boolean(assistida.necessidades_emergenciais);

  const temDetalhesExtras = Boolean(assistida.referencia || assistida.observacoes || assistida.telefone);

  return (
    <article
      className={`cartao entrada ${assistida.ativa ? '' : 'cartao-inativo'}`}
      style={{ '--cor': cor.base, animationDelay: `${Math.min(indice, 8) * 70}ms` }}
    >
      <div className="p-4 sm:p-5">
        <header className="flex items-start gap-3">
          <div className="avatar w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
            {iniciais(assistida.nome_completo)}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-[15px] leading-snug break-words">
              {assistida.nome_completo}
            </h2>
            {assistida.endereco && (
              <p className="text-xs text-tinta-suave mt-1 flex items-start gap-1.5 leading-snug">
                <span className="mt-px shrink-0">
                  <IconeCasa tamanho={13} />
                </span>
                <span className="break-words">{assistida.endereco}</span>
              </p>
            )}
          </div>

          <div className="selo-visitas rounded-xl px-2.5 py-1.5 text-center shrink-0">
            <div className="text-lg font-bold leading-none">{total}</div>
            <div className="text-[9px] uppercase tracking-wide font-bold mt-0.5">
              {total === 1 ? 'visita' : 'visitas'}
            </div>
          </div>
        </header>

        {temEmergencia && (
          <div className="bloco-alerta rounded-xl p-3 mt-4 pulsa">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide">
              <IconeAlerta tamanho={14} />
              Necessidade emergencial
            </div>
            <p className="text-sm mt-1.5 leading-snug whitespace-pre-line text-tinta font-medium">
              {assistida.necessidades_emergenciais}
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mt-4">
          <BotaoAcao href={linkWhatsapp(assistida.telefone)} classe="botao-whatsapp" rotulo="WhatsApp">
            <IconeConversa tamanho={16} />
          </BotaoAcao>
          <BotaoAcao href={linkWaze(assistida)} classe="botao-waze" rotulo="Waze">
            <IconeNavegacao tamanho={16} />
          </BotaoAcao>
          <BotaoAcao href={linkGoogleMaps(assistida)} classe="botao-maps" rotulo="Maps">
            <IconePino tamanho={16} />
          </BotaoAcao>
        </div>

        {assistida.familiares?.length > 0 && (
          <div className="mt-4">
            <Rotulo icone={<IconePessoas tamanho={13} />}>Família</Rotulo>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {assistida.familiares.map((familiar) => (
                <span key={familiar.id} className="bloco-doacao rounded-lg px-2 py-1 text-xs">
                  <strong className="font-semibold">{familiar.nome}</strong>
                  {(familiar.parentesco || familiar.idade !== null) && (
                    <span className="text-tinta-suave">
                      {' · '}
                      {[
                        familiar.parentesco,
                        familiar.idade !== null ? `${familiar.idade} anos` : null,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {assistida.itens_doacao && (
          <div className="bloco-doacao rounded-xl p-3 mt-3">
            <Rotulo icone={<IconePresente tamanho={13} />}>Itens especiais de doação</Rotulo>
            <p className="text-sm mt-1.5 leading-snug whitespace-pre-line">{assistida.itens_doacao}</p>
          </div>
        )}

        {temDetalhesExtras && (
          <>
            <button
              type="button"
              onClick={() => setAberto((valor) => !valor)}
              aria-expanded={aberto}
              className="mt-3 w-full flex items-center justify-center gap-1 text-xs font-semibold text-tinta-suave py-1.5"
            >
              {aberto ? 'Menos detalhes' : 'Mais detalhes'}
              <span
                className="transition-transform duration-200"
                style={{ transform: aberto ? 'rotate(180deg)' : 'none' }}
              >
                <IconeSeta tamanho={14} />
              </span>
            </button>

            {aberto && (
              <div className="space-y-3 pt-1 entrada">
                {assistida.telefone && (
                  <div>
                    <Rotulo icone={<IconeConversa tamanho={13} />}>Telefone</Rotulo>
                    <a
                      href={linkTelefone(assistida.telefone)}
                      className="text-sm mt-1 inline-block font-medium underline underline-offset-2"
                    >
                      {telefoneFormatado(assistida.telefone)}
                    </a>
                  </div>
                )}
                {assistida.referencia && (
                  <div>
                    <Rotulo icone={<IconePino tamanho={13} />}>Ponto de referência</Rotulo>
                    <p className="text-sm mt-1 leading-snug whitespace-pre-line">{assistida.referencia}</p>
                  </div>
                )}
                {assistida.observacoes && (
                  <div>
                    <Rotulo icone={<IconeNota tamanho={13} />}>Observações</Rotulo>
                    <p className="text-sm mt-1 leading-snug whitespace-pre-line">{assistida.observacoes}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-borda bg-superficie-2">
        <div className="text-[11px] text-tinta-suave leading-tight min-w-0">
          {registradaHoje ? (
            <span>
              <span className="font-semibold text-tinta">{ordinal(total)} visita</span> registrada hoje
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <IconeCalendario tamanho={12} />
              <span>
                {ehDiaDeVisita ? 'Hoje' : formatarDataCurta(proximaVisita)}
                {' · '}
                <span className="font-semibold text-tinta">será a {ordinal(total + 1)}</span>
              </span>
            </span>
          )}
          {assistida.ultima_visita && !registradaHoje && (
            <div className="mt-0.5 opacity-80">última: {formatarData(assistida.ultima_visita)}</div>
          )}
        </div>

        <BotaoRegistrarVisita
          assistidaId={assistida.id}
          data={hoje}
          jaRegistrada={registradaHoje}
          numero={ordinal(total + 1)}
          destaque={ehDiaDeVisita}
        />
      </footer>
    </article>
  );
}
