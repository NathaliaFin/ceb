import { IconeAlerta } from './Icones';

/** Bloco vermelho das necessidades emergenciais ABERTAS, no cartao e na ficha. */
export default function BlocoEmergencias({ emergencias, className = '' }) {
  if (emergencias.length === 0) return null;
  const varias = emergencias.length > 1;

  return (
    <div className={`bloco-alerta rounded-xl p-3 ${className}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide">
        <IconeAlerta tamanho={14} />
        {varias ? `Necessidades emergenciais (${emergencias.length})` : 'Necessidade emergencial'}
      </div>
      {varias ? (
        <ul className="mt-1.5 space-y-1 list-disc pl-4 text-sm leading-snug text-tinta font-medium">
          {emergencias.map((emergencia) => (
            <li key={emergencia.id} className="whitespace-pre-line">{emergencia.texto}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm mt-1.5 leading-snug whitespace-pre-line text-tinta font-medium">
          {emergencias[0].texto}
        </p>
      )}
    </div>
  );
}
