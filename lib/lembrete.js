// Lembrete por e-mail do registro das visitas. A partir do 10o dia apos a visita (o
// prazo do almoxarifado e o 14o), se alguma familia ainda estiver com a caixa
// "Visita de <mes> registrada" desmarcada, sai UM e-mail para o grupo. O envio
// e feito pelo Brevo (o Railway bloqueia SMTP) e configurado pelas variaveis:
//   BREVO_API_KEY            chave de API do Brevo
//   LEMBRETE_REMETENTE       e-mail do grupo, ja confirmado no Brevo
//   LEMBRETE_DESTINATARIOS   e-mails separados por virgula (vao em copia oculta)
//   LEMBRETE_NOME            nome do remetente (padrao "Visita DPS")
// Sem as tres primeiras, nada e enviado.
import { consultar, consultarUm } from './db.js';
import { hojeIso, nomeDoMes, visitaParaLembrar } from './datas.js';

const URL_BREVO = process.env.BREVO_URL || 'https://api.brevo.com/v3/smtp/email';
const HORA_DO_ENVIO = 8; // a partir das 8h de Brasilia

function configuracao() {
  const chave = String(process.env.BREVO_API_KEY ?? '').trim();
  const remetente = String(process.env.LEMBRETE_REMETENTE ?? '').trim();
  const destinatarios = String(process.env.LEMBRETE_DESTINATARIOS ?? '')
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter((e) => e.includes('@'));
  if (!chave || !remetente || destinatarios.length === 0) return null;
  return { chave, remetente, destinatarios, nome: process.env.LEMBRETE_NOME || 'Visita DPS' };
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

/** O texto do lembrete; "mes" e o mes da visita a registrar ("setembro"). */
function mensagem(mes) {
  const paragrafos = [
    'Olá, pessoal!',
    `Passando para lembrar que as <strong>visitas realizadas no mês de ${mes}</strong> precisam ser registradas.`,
    'O prazo solicitado pelo Almoxarifado está chegando ao fim, então, quem ainda não fez o registro, pedimos que o realize o quanto antes.',
    'Agradecemos a colaboração de todos!',
  ];
  return {
    html: paragrafos.map((p) => `<p style="font-size:16px;line-height:1.5;margin:0 0 14px">${p}</p>`).join(''),
    texto: paragrafos.map((p) => p.replace(/<\/?strong>/g, '')).join('\n\n'),
  };
}

async function enviarEmail(config, mes) {
  const { html, texto } = mensagem(mes);
  const resposta = await fetch(URL_BREVO, {
    method: 'POST',
    headers: { 'api-key': config.chave, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: config.nome, email: config.remetente },
      // Com remetente Gmail, o Brevo troca o endereco exibido por um dele
      // (...@...brevosend.com) por causa das regras do Gmail. As respostas,
      // pelo menos, voltam para o e-mail do grupo.
      replyTo: { email: config.remetente, name: config.nome },
      // O grupo recebe em copia oculta: ninguem ve o endereco dos outros.
      to: [{ email: config.remetente, name: config.nome }],
      bcc: config.destinatarios.map((email) => ({ email })),
      subject: `Lembrete: registro das visitas de ${mes}`,
      textContent: texto,
      htmlContent: html,
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

  // Tudo registrado agora nao encerra a visita: se alguem desmarcar depois,
  // a checagem da hora seguinte ainda envia, dentro do prazo.
  const pendentes = await quantasSemRegistro(visita);
  if (pendentes === 0) return 'tudo registrado';

  await enviarEmail(config, nomeDoMes(visita));
  await consultar(
    'INSERT INTO lembretes_enviados (visita, enviado) VALUES ($1, TRUE) ON CONFLICT (visita) DO NOTHING',
    [visita],
  );
  console.log(`lembrete: enviado para a visita de ${visita} (${pendentes} familia(s) sem registro)`);
  return 'enviado';
}

/** Liga a checagem de hora em hora (chamado uma vez, ao subir o servidor). */
export function iniciarLembretes() {
  if (globalThis.__cebLembretes) return;
  globalThis.__cebLembretes = true;
  const checar = () => verificarLembrete().catch((erro) => console.warn('lembrete: falhou:', erro.message));
  setTimeout(checar, 60_000); // da tempo de o servidor terminar de subir
  setInterval(checar, 60 * 60 * 1000).unref?.();
}
