import { exigirSessao } from '@/lib/auth';
import { listarAssistidas } from '@/lib/consultas';
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
  const proxima = proximaVisita(hoje);

  let assistidas;
  try {
    assistidas = await listarAssistidas();
  } catch (erro) {
    return (
      <main className="px-4 py-6 max-w-6xl mx-auto">
        <AvisoDeBanco mensagem={erro.message} />
      </main>
    );
  }

  return (
    <main className="pb-10">
      <Cabecalho papel={papel} hoje={hoje} proximaVisita={proxima} />

      {/* Os cartoes encavalam a capa escura — e dai que vem a profundidade. */}
      <div className="px-4 max-w-6xl mx-auto">
        <PainelAssistidas
          assistidas={assistidas}
          hoje={hoje}
          proximaVisita={proxima}
          podeEditar={papel === 'admin'}
        />
      </div>
    </main>
  );
}
