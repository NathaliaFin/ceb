import Link from 'next/link';
import { sair } from '@/app/actions';
import { diasAte, formatarData, formatarDataPorExtenso } from '@/lib/datas';
import { IconeCoracao, IconeLapis, IconeSair } from './Icones';

function textoDaProximaVisita(dias) {
  if (dias === 0) return 'Hoje é dia de visita';
  if (dias === 1) return 'A próxima visita é amanhã';
  return `Próxima visita em ${dias} dias`;
}

export default function Cabecalho({ papel, hoje, proximaVisita }) {
  const dias = diasAte(proximaVisita, hoje);

  return (
    <header className="capa">
      <div className="px-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 justify-end mb-6">
          {papel === 'admin' && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-white/90 border border-white/25 hover:bg-white/10 transition-colors"
            >
              <IconeLapis tamanho={14} />
              <span className="hidden sm:inline">Gerenciar</span>
            </Link>
          )}
          <form action={sair}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-white/90 border border-white/25 hover:bg-white/10 transition-colors"
              title="Sair"
            >
              <IconeSair tamanho={14} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </form>
        </div>

        <div className="entrada">
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl mb-4 bg-white/12 border border-white/25 text-white">
            <IconeCoracao tamanho={21} />
          </span>
          <h1>CEB</h1>
          <p className="capa__sub">
            As famílias atendidas pelo projeto, à mão na hora da visita.
          </p>
          <p className="capa__nota">
            {textoDaProximaVisita(dias)} · <strong>{formatarDataPorExtenso(proximaVisita)}</strong>,{' '}
            {formatarData(proximaVisita)}
          </p>
        </div>
      </div>
    </header>
  );
}
