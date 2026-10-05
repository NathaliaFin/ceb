'use client';

/**
 * Sem isto, uma falha ao salvar nao aparece na tela: o botao volta ao normal e
 * a alteracao simplesmente nao acontece. O caso mais comum e a pagina estar
 * aberta desde antes de uma atualizacao do sistema — recarregar resolve.
 */
export default function Erro({ error, reset }) {
  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-10">
      <div className="cartao p-6 max-w-sm w-full text-center" style={{ '--cor': '#c2362a' }}>
        <h1 className="font-bold text-lg">Não consegui concluir</h1>
        <p className="text-sm text-tinta-suave mt-2 leading-relaxed">
          A alteração pode não ter sido salva. Se esta página estava aberta há bastante tempo,
          recarregue e tente de novo — é o motivo mais comum.
        </p>

        <div className="flex flex-col gap-2 mt-5">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="botao-primario w-full py-3"
          >
            Recarregar a página
          </button>
          <button type="button" onClick={() => reset()} className="botao-secundario w-full py-2.5 text-sm">
            Tentar de novo
          </button>
        </div>

        {error?.digest && (
          <p className="text-[11px] text-tinta-suave mt-4 font-mono opacity-70">
            código: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
