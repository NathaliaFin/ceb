import Link from 'next/link';
import { sair } from '@/app/actions';
import { diasAte, formatarData, formatarDataPorExtenso } from '@/lib/datas';
import { IconeLapis, IconeSair } from './Icones';
import MarcaCapa from './MarcaCapa';

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
        <div className="capa__acoes flex items-center gap-2 justify-end mb-6">
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
          <MarcaCapa />
          <p className="capa__nota">
            {/* Cada pedaco quebra inteiro, para a data nao partir no meio no celular. */}
            <span className="whitespace-nowrap">{textoDaProximaVisita(dias)} ·</span>{' '}
            <span className="whitespace-nowrap">
              <strong>{formatarDataPorExtenso(proximaVisita)}</strong>
              <span className="capa__nota-numero">, {formatarData(proximaVisita)}</span>
            </span>
          </p>
        </div>
      </div>
    </header>
  );
}
