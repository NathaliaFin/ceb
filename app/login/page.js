import { redirect } from 'next/navigation';
import { papelAtual } from '@/lib/auth';
import FormularioLogin from '@/components/FormularioLogin';

export const dynamic = 'force-dynamic';

export default async function PaginaLogin() {
  if (await papelAtual()) redirect('/');

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-10">
      <FormularioLogin />
    </main>
  );
}
