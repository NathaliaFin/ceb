'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Keyboard, Navigation, Pagination } from 'swiper/modules';
import CardAssistida from './CardAssistida';
import { IconeMais, IconeSeta } from './Icones';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function PainelAssistidas({ assistidas, hoje, proximaVisita, calendario = {}, podeEditar }) {
  const [filtro, setFiltro] = useState('todas');

  const comEmergencia = assistidas.filter((a) => a.necessidades_emergenciais).length;
  const semTriagem = assistidas.filter((a) => !a.triagens?.length).length;

  const visiveis = useMemo(
    () =>
      assistidas.filter((assistida) => {
        if (filtro === 'emergencia') return Boolean(assistida.necessidades_emergenciais);
        if (filtro === 'semtriagem') return !assistida.triagens?.length;
        return true;
      }),
    [assistidas, filtro],
  );

  const filtros = [
    { chave: 'todas', rotulo: 'Todas', contagem: assistidas.length },
    { chave: 'emergencia', rotulo: '🚨 Com emergência', contagem: comEmergencia },
    // So aparece enquanto houver familia sem a data da triagem preenchida.
    ...(semTriagem > 0
      ? [{ chave: 'semtriagem', rotulo: 'Sem triagem', contagem: semTriagem }]
      : []),
  ];

  if (assistidas.length === 0) {
    return (
      <div className="cartao faixa-cartoes p-8 text-center entrada" style={{ '--cor': '#e0376f' }}>
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
      <div className="controles-capa mb-5">
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
          <p className="text-sm text-tinta-suave">Nenhum cartão neste filtro.</p>
        </div>
      ) : (
        <div className="carrossel faixa-cartoes">
          <Swiper
            // Recria o carrossel quando a lista muda, para voltar ao primeiro cartao.
            key={`${filtro}-${visiveis.length}`}
            modules={[Navigation, Pagination, Keyboard, A11y]}
            spaceBetween={16}
            slidesPerView={1.04}
            grabCursor
            watchOverflow
            keyboard={{ enabled: true }}
            navigation={{ nextEl: '.carrossel-proximo', prevEl: '.carrossel-anterior' }}
            pagination={{ clickable: true }}
            a11y={{
              prevSlideMessage: 'Cartão anterior',
              nextSlideMessage: 'Próximo cartão',
              paginationBulletMessage: 'Ir para o cartão {{index}}',
            }}
            breakpoints={{
              768: { slidesPerView: 2, spaceBetween: 18 },
              1280: { slidesPerView: 3, spaceBetween: 22 },
            }}
          >
            {visiveis.map((assistida, indice) => (
              <SwiperSlide key={assistida.id}>
                <CardAssistida
                  assistida={assistida}
                  hoje={hoje}
                  proximaVisita={proximaVisita}
                  calendario={calendario}
                  indice={indice}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              type="button"
              className="carrossel-anterior seta-carrossel"
              aria-label="Cartão anterior"
            >
              <span className="rotate-90 inline-flex">
                <IconeSeta tamanho={18} />
              </span>
            </button>
            <button
              type="button"
              className="carrossel-proximo seta-carrossel"
              aria-label="Próximo cartão"
            >
              <span className="-rotate-90 inline-flex">
                <IconeSeta tamanho={18} />
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
