import Link from 'next/link';
import { sair } from '@/app/actions';
import { diasAte, formatarData, formatarDataPorExtenso } from '@/lib/datas';
import { IconeCalendario, IconeCoracao, IconeLapis, IconeSair } from './Icones';

function textoDaProximaVisita(dias) {
  if (dias === 0) return 'Hoje é dia de visita';
  if (dias === 1) return 'A próxima visita é amanhã';
  return `Próxima visita em ${dias} dias`;
}

export default function Cabecalho({ papel, hoje, proximaVisita }) {
  const dias = diasAte(proximaVisita, hoje);
  const ehHoje = dias === 0;

  return (
    <header className="mb-6">
      <div className="flex items-center gap-3 mb-5">
        <div
          className="avatar w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ '--cor': '#e0376f' }}
        >
          <IconeCoracao tamanho={19} />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold leading-none tracking-tight">CEB</h1>
          <p className="text-xs text-tinta-suave mt-1">Cartões das famílias atendidas</p>
        </div>

        {papel === 'admin' && (
          <Link
            href="/admin"
            className="botao-secundario inline-flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            <IconeLapis tamanho={14} />
            <span className="hidden sm:inline">Gerenciar</span>
          </Link>
        )}

        <form action={sair}>
          <button
            type="submit"
            className="botao-secundario inline-flex items-center gap-1.5 px-3 py-2 text-xs"
            title="Sair"
          >
            <IconeSair tamanho={14} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </form>
      </div>

      <div
        className={`rounded-2xl px-4 py-3.5 flex items-center gap-3 entrada ${
          ehHoje ? 'faixa-hoje' : 'cartao'
        }`}
        style={ehHoje ? undefined : { '--cor': '#1584c0' }}
      >
        <span className={ehHoje ? 'relative z-10' : 'text-tinta-suave'}>
          <IconeCalendario tamanho={20} />
        </span>
        <div className={`min-w-0 ${ehHoje ? 'relative z-10' : ''}`}>
          <p className="font-bold text-sm leading-tight">{textoDaProximaVisita(dias)}</p>
          <p className={`text-xs mt-0.5 ${ehHoje ? 'opacity-90' : 'text-tinta-suave'}`}>
            {formatarDataPorExtenso(proximaVisita)} · {formatarData(proximaVisita)} — sempre no 4º sábado
          </p>
        </div>
      </div>
    </header>
  );
}
