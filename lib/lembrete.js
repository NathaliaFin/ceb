// Lembrete por e-mail do registro das visitas, grupo a grupo. A partir do 10o
// dia apos a visita (o prazo do almoxarifado e o 14o), se alguma familia do
// grupo ainda estiver com a caixa "Visita de <mes> registrada" desmarcada, sai
// UM e-mail para os e-mails daquele grupo (cadastrados no painel). O envio e
// feito pelo Brevo (o Railway bloqueia SMTP) e configurado pelas variaveis:
//   BREVO_API_KEY            chave de API do Brevo
//   LEMBRETE_REMETENTE       e-mail remetente, ja confirmado no Brevo
//   LEMBRETE_NOME            nome do remetente (padrao "Visita DPS")
//   LEMBRETE_DESTINATARIOS   so para o Paranoa04, enquanto ele nao tiver
//                            e-mails cadastrados no painel (como era antes)
// Sem a chave e o remetente, nada e enviado.
import { consultar, consultarUm } from './db.js';
import { hojeIso, nomeDoMes, ultimaVisitaFeita, visitaParaLembrar } from './datas.js';

const URL_BREVO = process.env.BREVO_URL || 'https://api.brevo.com/v3/smtp/email';
const HORA_DO_ENVIO = 8; // a partir das 8h de Brasilia

function configuracao() {
  const chave = String(process.env.BREVO_API_KEY ?? '').trim();
  const remetente = String(process.env.LEMBRETE_REMETENTE ?? '').trim();
  if (!chave || !remetente) return null;
  return { chave, remetente, nome: process.env.LEMBRETE_NOME || 'Visita DPS' };
}

function separarEmails(texto) {
  return String(texto ?? '')
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter((e) => e.includes('@'));
}

/** Os e-mails do grupo; o Paranoa04 ainda aceita a lista da variavel antiga. */
function destinatariosDoGrupo(grupo) {
  const doPainel = separarEmails(grupo.lembrete_destinatarios);
  if (doPainel.length > 0) return doPainel;
  return grupo.slug === 'paranoa04' ? separarEmails(process.env.LEMBRETE_DESTINATARIOS) : [];
}

function horaEmBrasilia() {
  return Number(new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false }).format(new Date()));
}

/** Familias ativas do grupo, ja visitadas nesta visita, com a caixa desmarcada. */
async function quantasSemRegistro(grupoId, visita) {
  const linha = await consultarUm(
    `SELECT count(*)::int AS total
       FROM assistidas a
      WHERE a.grupo_id = $1
        AND a.ativa
        AND (SELECT min(t.data) FROM triagens t WHERE t.assistida_id = a.id) <= $2
        AND NOT EXISTS (SELECT 1 FROM registros_visita r WHERE r.assistida_id = a.id AND r.mes = $3)`,
    [grupoId, visita, visita.slice(0, 7)],
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

async function enviarEmail(config, destinatarios, grupo, mes, { teste = false } = {}) {
  const { html, texto } = mensagem(mes);
  const resposta = await fetch(URL_BREVO, {
    method: 'POST',
    headers: { 'api-key': config.chave, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: config.nome, email: config.remetente },
      // Com remetente Gmail, o Brevo troca o endereco exibido por um dele
      // (...@...brevosend.com) por causa das regras do Gmail. As respostas,
      // pelo menos, voltam para o e-mail do remetente.
      replyTo: { email: config.remetente, name: config.nome },
      // O grupo recebe em copia oculta: ninguem ve o endereco dos outros.
      to: [{ email: config.remetente, name: config.nome }],
      bcc: destinatarios.map((email) => ({ email })),
      subject: `${teste ? '[Teste] ' : ''}Lembrete: registro das visitas de ${mes} — ${grupo.nome}`,
      textContent: texto,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!resposta.ok) throw new Error(`Brevo respondeu ${resposta.status}: ${(await resposta.text()).slice(0, 200)}`);
}

/** Um grupo: envia o lembrete se hoje for o dia e ainda nao foi enviado. */
async function verificarGrupo(config, grupo) {
  const destinatarios = destinatariosDoGrupo(grupo);
  if (destinatarios.length === 0) return 'sem e-mails';

  const linhas = await consultar('SELECT mes, data FROM calendario_excecoes WHERE grupo_id = $1', [grupo.id]);
  const excecoes = Object.fromEntries(linhas.map((l) => [l.mes, l.data]));
  const visita = visitaParaLembrar(hojeIso(), excecoes);
  if (!visita) return 'nao e dia';

  const ja = await consultarUm('SELECT 1 FROM lembretes_enviados WHERE grupo_id = $1 AND visita = $2', [grupo.id, visita]);
  if (ja) return 'ja tratado';

  // Tudo registrado agora nao encerra a visita: se alguem desmarcar depois,
  // a checagem da hora seguinte ainda envia, dentro do prazo.
  const pendentes = await quantasSemRegistro(grupo.id, visita);
  if (pendentes === 0) return 'tudo registrado';

  await enviarEmail(config, destinatarios, grupo, nomeDoMes(visita));
  await consultar(
    `INSERT INTO lembretes_enviados (grupo_id, visita, enviado) VALUES ($1, $2, TRUE)
     ON CONFLICT (grupo_id, visita) DO NOTHING`,
    [grupo.id, visita],
  );
  console.log(`lembrete: ${grupo.slug}: enviado para a visita de ${visita} (${pendentes} familia(s) sem registro)`);
  return 'enviado';
}

/**
 * Botao "Enviar lembrete de teste" do painel: manda agora, para os e-mails do
 * grupo, o mesmo texto do lembrete (assunto com "[Teste]"), sobre a ultima
 * visita. Nao conta como o lembrete do mes: o envio automatico segue igual.
 * Devolve { ok, mensagem } para mostrar na tela.
 */
export async function enviarLembreteDeTeste(grupo) {
  const config = configuracao();
  if (!config) return { ok: false, mensagem: 'Faltam as variáveis BREVO_API_KEY e LEMBRETE_REMETENTE no Railway.' };
  const destinatarios = destinatariosDoGrupo(grupo);
  if (destinatarios.length === 0) return { ok: false, mensagem: 'Este grupo não tem e-mails de lembrete cadastrados.' };

  const linhas = await consultar('SELECT mes, data FROM calendario_excecoes WHERE grupo_id = $1', [grupo.id]);
  const excecoes = Object.fromEntries(linhas.map((l) => [l.mes, l.data]));
  const visita = ultimaVisitaFeita(hojeIso(), excecoes);
  try {
    await enviarEmail(config, destinatarios, grupo, visita ? nomeDoMes(visita) : 'este mês', { teste: true });
  } catch (erro) {
    return { ok: false, mensagem: `O Brevo recusou o envio: ${erro.message}` };
  }
  console.log(`lembrete: ${grupo.slug}: teste enviado para ${destinatarios.length} e-mail(s)`);
  return { ok: true, mensagem: `Enviado para ${destinatarios.length} e-mail(s): ${destinatarios.join(', ')}.` };
}

/** Uma checagem de todos os grupos. Devolve { slug: resultado }. */
export async function verificarLembrete({ ignorarHora = false } = {}) {
  const config = configuracao();
  if (!config) return 'sem configuracao';
  if (!ignorarHora && horaEmBrasilia() < HORA_DO_ENVIO) return 'cedo';

  const resultados = {};
  for (const grupo of await consultar('SELECT * FROM grupos WHERE ativo ORDER BY id')) {
    // Um grupo com problema nao impede o lembrete dos outros.
    resultados[grupo.slug] = await verificarGrupo(config, grupo).catch((erro) => {
      console.warn(`lembrete: ${grupo.slug}: falhou:`, erro.message);
      return 'falhou';
    });
  }
  return resultados;
}

/** Liga a checagem de hora em hora (chamado uma vez, ao subir o servidor). */
export function iniciarLembretes() {
  if (globalThis.__cebLembretes) return;
  globalThis.__cebLembretes = true;
  const checar = () => verificarLembrete().catch((erro) => console.warn('lembrete: falhou:', erro.message));
  setTimeout(checar, 60_000); // da tempo de o servidor terminar de subir
  setInterval(checar, 60 * 60 * 1000).unref?.();
}
