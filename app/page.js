import { exigirSessao } from '@/lib/auth';
import { listarAssistidas, listarDiasSemVisita } from '@/lib/consultas';
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
  let diasSemVisita;
  try {
    [assistidas, diasSemVisita] = await Promise.all([listarAssistidas(), listarDiasSemVisita()]);
  } catch (erro) {
    return (
      <main className="px-4 py-6 max-w-6xl mx-auto">
        <AvisoDeBanco mensagem={erro.message} />
      </main>
    );
  }

  // Meses em que o grupo nao foi a campo nao contam para familia nenhuma.
  const pulados = diasSemVisita.map((dia) => dia.data);
  const proxima = proximaVisita(hoje, pulados);

  return (
    <main className="pb-10">
      <Cabecalho papel={papel} hoje={hoje} proximaVisita={proxima} />

      {/* Os cartoes encavalam a capa escura — e dai que vem a profundidade. */}
      <div className="px-4 max-w-6xl mx-auto">
        <PainelAssistidas
          assistidas={assistidas}
          hoje={hoje}
          proximaVisita={proxima}
          diasSemVisita={pulados}
          podeEditar={papel === 'admin'}
        />
      </div>
    </main>
  );
}
