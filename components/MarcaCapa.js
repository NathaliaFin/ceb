import { IconeCoracao } from './Icones';

/** Coracao, nome do grupo e instituicao: o topo da capa escura, igual na tela
 *  principal e no login. */
export default function MarcaCapa() {
  return (
    <>
      <span className="capa__icone inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-white/12 border border-white/25 text-white">
        <IconeCoracao tamanho={27} />
      </span>
      <h1>
        <span className="capa__grupo">Paranoá04</span>
        Atendimento às Famílias
      </h1>
      {/* So no computador: no celular o .modo-app esconde esta linha. */}
      <p className="capa__instituicao">
        Diretoria de Promoção Social - Comunhão Espírita de Brasília
      </p>
    </>
  );
}
