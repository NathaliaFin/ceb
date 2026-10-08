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
  // Unico filtro que sobrou: liga e desliga. A emergencia nao precisa de
  // filtro, ja aparece em destaque na frente do cartao.
  const [soSemTriagem, setSoSemTriagem] = useState(false);
  const semTriagem = assistidas.filter((a) => !a.triagens?.length).length;
  const filtrando = soSemTriagem && semTriagem > 0;

  const visiveis = useMemo(
    () => (filtrando ? assistidas.filter((a) => !a.triagens?.length) : assistidas),
    [assistidas, filtrando],
  );

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
      {/* Ocupa sempre a mesma altura, com ou sem o filtro, para os cartoes
          ficarem no mesmo ponto da faixa cinza. So aparece enquanto houver
          familia sem triagem registrada. */}
      <div className="controles-capa mb-5">
        {semTriagem > 0 && (
          <button
            type="button"
            onClick={() => setSoSemTriagem((ligado) => !ligado)}
            aria-pressed={filtrando}
            className="filtro"
          >
            Sem triagem
            <span className="ml-1.5 opacity-60">{semTriagem}</span>
          </button>
        )}
      </div>

      {visiveis.length === 0 ? (
        <div className="cartao p-8 text-center" style={{ '--cor': '#8a8178' }}>
          <p className="text-sm text-tinta-suave">Nenhum cartão neste filtro.</p>
        </div>
      ) : (
        <div className="carrossel faixa-cartoes">
          <Swiper
            // Recria o carrossel quando a lista muda, para voltar ao primeiro cartao.
            key={`${filtrando}-${visiveis.length}`}
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
                  podeEditar={podeEditar}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="carrossel-setas flex items-center justify-center gap-3 mt-4">
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
