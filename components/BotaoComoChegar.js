'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { linkGoogleMaps, linkWaze } from '@/lib/links';
import { IconeNavegacao, IconePino } from './Icones';

/**
 * Um botao so para traçar rota: pergunta o aplicativo e abre nele. Os endereços
 * usados sao links https comuns, que o celular entrega ao aplicativo instalado
 * e, quando nao houver, abrem no navegador.
 */
export default function BotaoComoChegar({ assistida, classe = '' }) {
  const [aberto, setAberto] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto) return undefined;
    function aoTeclar(evento) {
      if (evento.key === 'Escape') setAberto(false);
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto]);

  const waze = linkWaze(assistida);
  const maps = linkGoogleMaps(assistida);
  const semRota = !waze && !maps;

  // Sem coordenadas o Waze cai na busca pelo texto do endereco, o que costuma
  // parar na rua errada. Vale avisar em vez de deixar o voluntario descobrir
  // no meio da visita.
  const wazePorEndereco = Boolean(waze) && assistida.latitude === null;

  function abrir(evento) {
    evento.stopPropagation();
    if (!semRota) setAberto(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        disabled={semRota}
        aria-disabled={semRota}
        className={`botao-acao botao-rota ${classe}`}
        title={semRota ? 'Sem endereço nem link de mapa cadastrados' : 'Abrir rota'}
      >
        <IconeNavegacao tamanho={16} />
        <span>Como chegar</span>
      </button>

      {montado &&
        aberto &&
        createPortal(
          <div
            className="ficha-fundo"
            onClick={() => setAberto(false)}
            role="presentation"
          >
            <div
              className="escolha-rota"
              role="dialog"
              aria-modal="true"
              aria-label="Escolher aplicativo de rota"
              onClick={(evento) => evento.stopPropagation()}
            >
              <p className="escolha-rota__titulo">Abrir rota para</p>
              <p className="escolha-rota__nome">{assistida.nome_completo}</p>

              <div className="grid gap-2 mt-4">
                {waze && (
                  <a
                    className="botao-acao botao-waze py-3.5"
                    href={waze}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setAberto(false)}
                  >
                    <IconeNavegacao tamanho={18} />
                    <span>Waze</span>
                  </a>
                )}
                {maps && (
                  <a
                    className="botao-acao botao-maps py-3.5"
                    href={maps}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setAberto(false)}
                  >
                    <IconePino tamanho={18} />
                    <span>Google Maps</span>
                  </a>
                )}
              </div>

              {wazePorEndereco && (
                <p className="escolha-rota__aviso">
                  O Waze vai procurar pelo endereço escrito, porque o link cadastrado não trouxe as
                  coordenadas. O Google Maps abre no ponto exato.
                </p>
              )}

              <button
                type="button"
                onClick={() => setAberto(false)}
                className="botao-secundario w-full py-2.5 text-sm mt-3"
              >
                Cancelar
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
