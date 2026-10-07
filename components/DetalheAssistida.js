'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { corDe, iniciais } from '@/lib/cores';
import {
  VISITAS_DO_CICLO, etapaDoCiclo, formatarData, formatarDataPorExtenso, numeroDaVisita, primeiraTriagem,
} from '@/lib/datas';
import { linkTelefone, linkWhatsapp, telefoneFormatado } from '@/lib/links';
import { emergenciasAbertas, emergenciasConcluidas } from '@/lib/emergencias';
import BlocoEmergencias from './BlocoEmergencias';
import BotaoComoChegar from './BotaoComoChegar';
import {
  IconeCalendario, IconeCasa, IconeCheck, IconeConversa,
  IconeNota, IconePessoas, IconePino, IconePresente,
} from './Icones';

/** Campos em branco aparecem assim, em vez de sumirem: a falta tambem informa. */
function Vazio({ children }) {
  return <span className="text-tinta-suave italic opacity-70">{children}</span>;
}

function Secao({ icone, titulo, children }) {
  return (
    <section className="py-3.5 border-t border-borda first:border-t-0 first:pt-0">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-tinta-suave mb-2">
        {icone}
        {titulo}
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export default function DetalheAssistida({ assistida, hoje, proximaVisita, calendario = {}, aoFechar }) {
  // A ficha e levada para o fim do <body>. Sem isso ela nasce dentro do cartao,
  // que vive num contentor com transform (o carrossel) — e ali o position:fixed
  // passa a valer em relacao ao cartao, nao a tela, e o overflow dele corta a
  // ficha pelo topo.
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  useEffect(() => {
    function aoTeclar(evento) {
      if (evento.key === 'Escape') aoFechar();
    }
    document.addEventListener('keydown', aoTeclar);
    // Trava a rolagem do fundo enquanto a ficha esta aberta.
    const rolagemAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = rolagemAnterior;
    };
  }, [aoFechar]);

  const cor = corDe(assistida.cor);
  const triagens = assistida.triagens ?? [];
  const triagem = primeiraTriagem(triagens);
  const visitas = numeroDaVisita(triagem, hoje, calendario);
  const familiares = assistida.familiares ?? [];
  const temCoordenadas = assistida.latitude !== null && assistida.latitude !== undefined;

  if (!montado) return null;

  return createPortal(
    <div className="ficha-fundo" onClick={aoFechar} role="presentation">
      <div
        className="ficha"
        style={{ '--cor': cor.base }}
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha de ${assistida.nome_completo}`}
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="ficha__topo">
          <div className="flex items-start gap-3">
            <span className="ficha__avatar">{iniciais(assistida.nome_completo)}</span>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-lg leading-snug break-words text-white">
                {assistida.nome_completo}
              </h2>
              <p className="text-white/85 text-sm mt-0.5">
                {triagem ? `${visitas} ${visitas === 1 ? 'visita' : 'visitas'}` : 'sem triagem registrada'}
              </p>
            </div>
            <button type="button" onClick={aoFechar} className="ficha__fechar" aria-label="Fechar ficha">
              ✕
            </button>
          </div>
        </header>

        <div className="ficha__corpo">
          <BlocoEmergencias emergencias={emergenciasAbertas(assistida)} className="mb-3" />

          <Secao icone={<IconeCalendario tamanho={13} />} titulo="Visitas">
            {triagem ? (
              <>
                <p>
                  <strong>{visitas}</strong> {visitas === 1 ? 'visita' : 'visitas'} até hoje,
                  contando a triagem como a primeira.
                </p>
                <p className="text-tinta-suave mt-1">
                  Próxima: {formatarDataPorExtenso(proximaVisita)}
                </p>
                {etapaDoCiclo(visitas) === 'falta-uma' && (
                  <p className="mt-1.5 font-semibold" style={{ color: '#b9650a' }}>
                    Falta 1 para completar as {VISITAS_DO_CICLO} visitas.
                  </p>
                )}
              </>
            ) : (
              <Vazio>Nenhuma triagem registrada, então ainda não há contagem.</Vazio>
            )}
          </Secao>

          <Secao icone={<IconeCheck tamanho={13} />} titulo="Triagens">
            {triagens.length === 0 ? (
              <Vazio>Nenhuma triagem registrada.</Vazio>
            ) : (
              <ul className="space-y-1.5">
                {triagens.map((item, indice) => (
                  <li key={item.id} className="flex gap-2">
                    <span className="font-semibold shrink-0">{indice + 1}ª</span>
                    <span>
                      {formatarData(item.data)}
                      {item.observacao && <span className="text-tinta-suave"> — {item.observacao}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Secao>

          <Secao icone={<IconePessoas tamanho={13} />} titulo="Família">
            {familiares.length === 0 ? (
              <Vazio>Nenhuma pessoa da família cadastrada.</Vazio>
            ) : (
              <ul className="space-y-2">
                {familiares.map((familiar) => (
                  <li key={familiar.id} className="flex items-start gap-2.5">
                    <span className="cartao__avatar shrink-0">{iniciais(familiar.nome)}</span>
                    <span>
                      <strong className="font-semibold">{familiar.nome}</strong>
                      {(familiar.parentesco || familiar.idade !== null) && (
                        <span className="text-tinta-suave">
                          {' · '}
                          {[familiar.parentesco, familiar.idade !== null ? `${familiar.idade} anos` : null]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      )}
                      {familiar.observacao && (
                        <span className="block text-tinta-suave text-xs mt-0.5">{familiar.observacao}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Secao>

          <Secao icone={<IconeCasa tamanho={13} />} titulo="Onde fica">
            <p>{assistida.endereco || <Vazio>Endereço não informado.</Vazio>}</p>
            <p className="mt-1.5">
              <span className="text-tinta-suave">Referência: </span>
              {assistida.referencia || <Vazio>não informada</Vazio>}
            </p>
            {!temCoordenadas && (
              <p className="mt-1.5">
                <Vazio>
                  Sem link de mapa cadastrado — a rota vai pelo endereço escrito, que costuma parar
                  na rua e não na casa.
                </Vazio>
              </p>
            )}
            <div className="mt-3">
              <BotaoComoChegar assistida={assistida} classe="w-full" />
            </div>
          </Secao>

          <Secao icone={<IconeConversa tamanho={13} />} titulo="Contato">
            {assistida.telefone ? (
              <>
                <a href={linkTelefone(assistida.telefone)} className="underline underline-offset-2">
                  {telefoneFormatado(assistida.telefone)}
                </a>
                <a
                  className="botao-acao botao-whatsapp mt-3"
                  href={linkWhatsapp(assistida.telefone)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconeConversa tamanho={16} />
                  <span>Abrir no WhatsApp</span>
                </a>
              </>
            ) : (
              <Vazio>Telefone não informado — o botão do WhatsApp fica desligado.</Vazio>
            )}
          </Secao>

          <Secao icone={<IconePresente tamanho={13} />} titulo="Itens especiais para solicitar no almoxarifado">
            {assistida.itens_doacao ? (
              <p className="whitespace-pre-line">{assistida.itens_doacao}</p>
            ) : (
              <Vazio>Nada registrado para esta família.</Vazio>
            )}
          </Secao>

          <Secao icone={<IconeNota tamanho={13} />} titulo="Observações">
            {assistida.observacoes ? (
              <p className="whitespace-pre-line">{assistida.observacoes}</p>
            ) : (
              <Vazio>Nenhuma observação registrada.</Vazio>
            )}
          </Secao>

          {/* So aparece quando ja houve alguma: o que a familia precisou e foi atendido. */}
          {emergenciasConcluidas(assistida).length > 0 && (
            <Secao icone={<IconeCheck tamanho={13} />} titulo="Necessidades já atendidas">
              <ul className="space-y-2">
                {emergenciasConcluidas(assistida).map((emergencia) => (
                  <li key={emergencia.id}>
                    <p className="whitespace-pre-line">{emergencia.texto}</p>
                    <p className="text-xs text-tinta-suave">
                      Registrada em {formatarData(emergencia.registrada_em)} · concluída em{' '}
                      {formatarData(emergencia.concluida_em)}
                    </p>
                  </li>
                ))}
              </ul>
            </Secao>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
