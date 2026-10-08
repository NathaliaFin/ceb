// Roda uma vez quando o servidor sobe. Liga o lembrete por e-mail do registro
// das visitas (ver lib/lembrete.js) — so no servidor Node e fora do build.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  const { iniciarLembretes } = await import('./lib/lembrete.js');
  iniciarLembretes();
}
