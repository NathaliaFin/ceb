// Lembrete por e-mail do registro das visitas. No 10o dia apos a visita (o
// prazo do almoxarifado e o 14o), se alguma familia ainda estiver com a caixa
// "Visita de <mes> registrada" desmarcada, sai UM e-mail para o grupo. O envio
// e feito pelo Brevo (o Railway bloqueia SMTP) e configurado pelas variaveis:
//   BREVO_API_KEY            chave de API do Brevo
//   LEMBRETE_REMETENTE       e-mail do grupo, ja confirmado no Brevo
//   LEMBRETE_DESTINATARIOS   e-mails separados por virgula (vao em copia oculta)
//   LEMBRETE_NOME            nome do remetente (padrao "Paranoá04")
// Sem as tres primeiras, nada e enviado.
import { consultar, consultarUm } from './db.js';
import { hojeIso, nomeDoMes, visitaParaLembrar } from './datas.js';

const URL_BREVO = process.env.BREVO_URL || 'https://api.brevo.com/v3/smtp/email';
const HORA_DO_ENVIO = 8; // a partir das 8h de Brasilia
const ENDERECO_DO_APP = process.env.APP_URL || 'https://paranoa04.up.railway.app';

function configuracao() {
  const chave = String(process.env.BREVO_API_KEY ?? '').trim();
  const remetente = String(process.env.LEMBRETE_REMETENTE ?? '').trim();
  const destinatarios = String(process.env.LEMBRETE_DESTINATARIOS ?? '')
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter((e) => e.includes('@'));
  if (!chave || !remetente || destinatarios.length === 0) return null;
  return { chave, remetente, destinatarios, nome: process.env.LEMBRETE_NOME || 'Paranoá04' };
}

function horaEmBrasilia() {
  return Number(new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false }).format(new Date()));
}

/** Familias ativas, ja visitadas nesta visita, com a caixa ainda desmarcada. */
async function quantasSemRegistro(visita) {
  const linha = await consultarUm(
    `SELECT count(*)::int AS total
       FROM assistidas a
      WHERE a.ativa
        AND (SELECT min(t.data) FROM triagens t WHERE t.assistida_id = a.id) <= $1
        AND NOT EXISTS (SELECT 1 FROM registros_visita r WHERE r.assistida_id = a.id AND r.mes = $2)`,
    [visita, visita.slice(0, 7)],
  );
  return linha?.total ?? 0;
}

async function enviarEmail(config, mes) {
  const texto = `Lembre-se de registrar as suas visitas do mês de ${mes}. O prazo do almoxarifado está se esgotando.`;
  const resposta = await fetch(URL_BREVO, {
    method: 'POST',
    headers: { 'api-key': config.chave, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: config.nome, email: config.remetente },
      // O grupo recebe em copia oculta: ninguem ve o endereco dos outros.
      to: [{ email: config.remetente, name: config.nome }],
      bcc: config.destinatarios.map((email) => ({ email })),
      subject: `Lembrete: registro das visitas de ${mes}`,
      textContent: `${texto}\n\n${ENDERECO_DO_APP}`,
      htmlContent: `<p style="font-size:16px">${texto}</p><p><a href="${ENDERECO_DO_APP}">Abrir o Paranoá04</a></p>`,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!resposta.ok) throw new Error(`Brevo respondeu ${resposta.status}: ${(await resposta.text()).slice(0, 200)}`);
}

/** Uma checagem: envia o lembrete se hoje for o dia e ainda nao foi enviado. */
export async function verificarLembrete({ ignorarHora = false } = {}) {
  const config = configuracao();
  if (!config) return 'sem configuracao';
  if (!ignorarHora && horaEmBrasilia() < HORA_DO_ENVIO) return 'cedo';

  const linhas = await consultar('SELECT mes, data FROM calendario_excecoes');
  const excecoes = Object.fromEntries(linhas.map((l) => [l.mes, l.data]));
  const visita = visitaParaLembrar(hojeIso(), excecoes);
  if (!visita) return 'nao e dia';

  const ja = await consultarUm('SELECT 1 FROM lembretes_enviados WHERE visita = $1', [visita]);
  if (ja) return 'ja tratado';

  const pendentes = await quantasSemRegistro(visita);
  if (pendentes > 0) await enviarEmail(config, nomeDoMes(visita));
  await consultar(
    'INSERT INTO lembretes_enviados (visita, enviado) VALUES ($1, $2) ON CONFLICT (visita) DO NOTHING',
    [visita, pendentes > 0],
  );
  if (pendentes > 0) console.log(`lembrete: enviado para a visita de ${visita} (${pendentes} familia(s) sem registro)`);
  return pendentes > 0 ? 'enviado' : 'tudo registrado';
}

/** Liga a checagem de hora em hora (chamado uma vez, ao subir o servidor). */
export function iniciarLembretes() {
  if (globalThis.__cebLembretes) return;
  globalThis.__cebLembretes = true;
  const checar = () => verificarLembrete().catch((erro) => console.warn('lembrete: falhou:', erro.message));
  setTimeout(checar, 60_000); // da tempo de o servidor terminar de subir
  setInterval(checar, 60 * 60 * 1000).unref?.();
}
