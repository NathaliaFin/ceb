import Link from 'next/link';
import { exigirAdmin } from '@/lib/auth';
import FormularioAssistida from '@/components/FormularioAssistida';
import { IconeSeta } from '@/components/Icones';

export const dynamic = 'force-dynamic';

export default async function PaginaNovaAssistida() {
  await exigirAdmin();

  return (
    <main className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin"
          className="botao-secundario inline-flex items-center gap-1 px-3 py-2 text-xs shrink-0"
        >
          <span className="rotate-90 inline-flex">
            <IconeSeta tamanho={14} />
          </span>
          Voltar
        </Link>
        <h1 className="text-lg font-bold">Nova assistida</h1>
      </div>

      <FormularioAssistida assistida={null} />
    </main>
  );
}
