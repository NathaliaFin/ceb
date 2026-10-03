'use client';

import { useState } from 'react';
import { corDe, iniciais } from '@/lib/cores';
import {
  formatarData, formatarDataCurta, primeiraTriagem, visitasDepoisDaTriagem,
} from '@/lib/datas';
import { linkGoogleMaps, linkWaze, linkWhatsapp, telefoneFormatado } from '@/lib/links';
import {
  IconeAlerta, IconeCalendario, IconeCasa, IconeCheck, IconeConversa,
  IconeNavegacao, IconeNota, IconePino, IconePresente, IconeSeta,
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

function descreverFamiliar(familiar) {
  const complemento = [familiar.parentesco, familiar.idade !== null ? `${familiar.idade} anos` : null]
    .filter(Boolean)
    .join(', ');
  return complemento ? `${familiar.nome} (${complemento})` : familiar.nome;
}

/** "Triagem em 27/06/2026" ou, com mais de uma, "2 triagens · 27/06 e 25/07". */
function textoDasTriagens(triagens) {
  if (triagens.length === 1) return `Triagem em ${formatarData(triagens[0].data)}`;
  const datas = triagens.map((t) => formatarDataCurta(t.data));
  const ultima = datas.pop();
  return `${triagens.length} triagens · ${datas.join(', ')} e ${ultima}`;
}

export default function CardAssistida({ assistida, hoje, proximaVisita, indice = 0 }) {
  const [aberto, setAberto] = useState(false);

  const cor = corDe(assistida.cor);
  const temEmergencia = Boolean(assistida.necessidades_emergenciais);
  const ehDiaDeVisita = proximaVisita === hoje;

  // A contagem sai do calendario, a partir da PRIMEIRA triagem. As demais ficam
  // registradas, mas nao mudam o numero.
  const triagens = assistida.triagens ?? [];
  const triagem = primeiraTriagem(triagens);
  const visitas = visitasDepoisDaTriagem(triagem, hoje);
  const triagemNoFuturo = Boolean(triagem) && triagem > hoje;

  const familiares = assistida.familiares ?? [];
  const temDetalhes = Boolean(assistida.referencia || assistida.observacoes);

  return (
    <article
      className={`cartao cartao--capa entrada ${assistida.ativa ? '' : 'cartao-inativo'}`}
      style={{ '--cor': cor.base, animationDelay: `${Math.min(indice, 8) * 70}ms` }}
    >
      <div className="cartao__capa">
        <span className="cartao__selo">
          {!triagem ? (
            <>
              <strong>—</strong>
              <span>sem triagem</span>
            </>
          ) : triagemNoFuturo ? (
            <>
              <strong>—</strong>
              <span>a fazer</span>
            </>
          ) : (
            <>
              <strong>{visitas}</strong>
              <span>{visitas === 1 ? 'visita' : 'visitas'}</span>
            </>
          )}
        </span>

        <div className="cartao__sobre">
          <h2>{assistida.nome_completo}</h2>
          {assistida.endereco && (
            <p className="cartao__endereco">
              <span className="mt-px shrink-0">
                <IconeCasa tamanho={12} />
              </span>
              <span className="break-words">{assistida.endereco}</span>
            </p>
          )}
        </div>
      </div>

      <div className="cartao__corpo">
        {temEmergencia && (
          <div className="bloco-alerta rounded-xl p-3 mb-3 pulsa">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide">
              <IconeAlerta tamanho={14} />
              Necessidade emergencial
            </div>
            <p className="text-sm mt-1.5 leading-snug whitespace-pre-line text-tinta font-medium">
              {assistida.necessidades_emergenciais}
            </p>
          </div>
        )}

        <ul className="cartao__dados">
          <li>
            <IconeCalendario tamanho={16} />
            <span>
              {ehDiaDeVisita ? (
                <strong className="font-semibold text-tinta">Hoje é dia de visita</strong>
              ) : (
                <>
                  Próxima visita em{' '}
                  <strong className="font-semibold text-tinta">
                    {formatarDataCurta(proximaVisita)}
                  </strong>
                </>
              )}
            </span>
          </li>

          <li>
            <IconeCheck tamanho={16} />
            <span>
              {triagens.length === 0
                ? 'Falta registrar a triagem'
                : textoDasTriagens(triagens)}
            </span>
          </li>

          {assistida.telefone && (
            <li>
              <IconeConversa tamanho={16} />
              <span>{telefoneFormatado(assistida.telefone)}</span>
            </li>
          )}
        </ul>

        {/* Aparece sempre, mesmo sem nada cadastrado: e informacao que o
            voluntario procura no cartao, e a ausencia tambem diz algo. */}
        <div className="bloco-doacao rounded-xl p-3 mt-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-tinta-suave">
            <IconePresente tamanho={13} />
            Itens especiais de doação
          </div>
          {assistida.itens_doacao ? (
            <p className="text-sm mt-1.5 leading-snug whitespace-pre-line">{assistida.itens_doacao}</p>
          ) : (
            <p className="text-sm mt-1.5 leading-snug text-tinta-suave italic opacity-70">
              Nada registrado para esta família.
            </p>
          )}
        </div>

        {familiares.length > 0 && (
          <div className="cartao__gente">
            <span className="cartao__gente-rotulo">Família</span>
            <div className="cartao__gente-linha">
              <span className="cartao__avatares">
                {familiares.slice(0, 4).map((familiar) => (
                  <span key={familiar.id} className="cartao__avatar" title={descreverFamiliar(familiar)}>
                    {iniciais(familiar.nome)}
                  </span>
                ))}
              </span>
              <span className="cartao__nomes">
                {familiares.map((familiar) => familiar.nome.split(/\s+/)[0]).join(', ')}
              </span>
            </div>
          </div>
        )}

        {temDetalhes && (
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
                {assistida.referencia && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-tinta-suave">
                      <IconePino tamanho={13} />
                      Ponto de referência
                    </div>
                    <p className="text-sm mt-1 leading-snug whitespace-pre-line">{assistida.referencia}</p>
                  </div>
                )}
                {assistida.observacoes && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-tinta-suave">
                      <IconeNota tamanho={13} />
                      Observações
                    </div>
                    <p className="text-sm mt-1 leading-snug whitespace-pre-line">{assistida.observacoes}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="cartao__pe grid grid-cols-3 gap-2">
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
      </div>
    </article>
  );
}
