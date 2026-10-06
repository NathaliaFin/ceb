import { exigirSessao } from '@/lib/auth';
import { listarAssistidas, listarExcecoesCalendario, mapaDeExcecoes } from '@/lib/consultas';
import { hojeIso, proximaVisita } from '@/lib/datas';
import Cabecalho from '@/components/Cabecalho';
import PainelAssistidas from '@/components/PainelAssistidas';

export const dynamic = 'force-dynamic';

function AvisoDeBanco({ mensagem }) {
  return (
    <div className="cartao p-6 max-w-lg mx-auto mt-10" style={{ '--cor': '#c2362a' }}>
      <h2 className="font-bold">Não foi possível falar com o banco de dados</h2>
      <p className="text-sm text-tinta-suave mt-2 leading-relaxed">
        Confira se a variável <code className="font-mono">DATABASE_URL</code> está configurada e se as
        migrações já rodaram (<code className="font-mono">npm run migrar</code>).
      </p>
      <p className="text-xs text-tinta-suave mt-3 font-mono break-words opacity-80">{mensagem}</p>
    </div>
  );
}

export default async function PaginaInicial() {
  const papel = await exigirSessao();
  const hoje = hojeIso();

  let assistidas;
  let excecoes;
  try {
    [assistidas, excecoes] = await Promise.all([listarAssistidas(), listarExcecoesCalendario()]);
  } catch (erro) {
    return (
      <main className="px-4 py-6 max-w-6xl mx-auto">
        <AvisoDeBanco mensagem={erro.message} />
      </main>
    );
  }

  // As excecoes do calendario valem para todas as familias de uma vez.
  const calendario = mapaDeExcecoes(excecoes);
  const proxima = proximaVisita(hoje, calendario);

  return (
    // overflow-x-clip: a folga do carrossel para a sombra passa da borda da
    // tela em tablet, e nao pode virar rolagem lateral.
    <main className="pb-10 overflow-x-clip">
      <Cabecalho papel={papel} hoje={hoje} proximaVisita={proxima} />

      {/* Os cartoes encavalam a capa escura — e dai que vem a profundidade. */}
      <div className="px-4 max-w-6xl mx-auto">
        <PainelAssistidas
          assistidas={assistidas}
          hoje={hoje}
          proximaVisita={proxima}
          calendario={calendario}
          podeEditar={papel === 'admin'}
        />
      </div>
    </main>
  );
}
