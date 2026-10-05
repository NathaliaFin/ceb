// As visitas acontecem sempre no 4o sabado do mes. Tudo aqui trabalha com datas
// no formato "AAAA-MM-DD" (sem hora), para nao haver escorregao de fuso.
const FUSO = 'America/Sao_Paulo';

const DIAS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const MESES = [
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function hojeIso() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function paraIso(ano, mes, dia) {
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** 4o sabado do mes informado (mes de 1 a 12), como "AAAA-MM-DD". */
export function quartoSabado(ano, mes) {
  const primeiroDia = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay();
  const primeiroSabado = 1 + ((6 - primeiroDia + 7) % 7);
  return paraIso(ano, mes, primeiroSabado + 21);
}

/**
 * Proximo dia de visita a partir de hoje (inclui o proprio dia, se for sabado).
 * Pula os meses marcados como sem visita.
 */
/** 3o sabado do mes — e quando a visita de dezembro costuma acontecer. */
export function terceiroSabado(ano, mes) {
  const primeiroDia = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay();
  const primeiroSabado = 1 + ((6 - primeiroDia + 7) % 7);
  return paraIso(ano, mes, primeiroSabado + 14);
}

/** Dia da visita quando nada foi informado: 4o sabado, menos dezembro, que e o 3o. */
export function diaDeVisitaPadrao(ano, mes) {
  return mes === 12 ? terceiroSabado(ano, mes) : quartoSabado(ano, mes);
}

/**
 * A data da visita de um mes, ja com as excecoes aplicadas. `excecoes` e um
 * mapa "AAAA-MM" -> data, onde nulo quer dizer que nao houve visita no mes.
 */
export function diaDeVisita(ano, mes, excecoes = {}) {
  const chave = `${ano}-${String(mes).padStart(2, '0')}`;
  if (Object.prototype.hasOwnProperty.call(excecoes, chave)) return excecoes[chave];
  return diaDeVisitaPadrao(ano, mes);
}

export function proximaVisita(hoje = hojeIso(), excecoes = {}) {
  let [ano, mes] = hoje.split('-').map(Number);

  // Teto de 4 anos: so para nao girar para sempre se tudo estiver cancelado.
  for (let tentativa = 0; tentativa < 48; tentativa += 1) {
    const dia = diaDeVisita(ano, mes, excecoes);
    if (dia && dia >= hoje) return dia;
    mes += 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
  }
  return diaDeVisitaPadrao(ano, mes);
}

export function ehDiaDeVisita(data = hojeIso(), excecoes = {}) {
  const [ano, mes] = data.split('-').map(Number);
  return diaDeVisita(ano, mes, excecoes) === data;
}

/** "24/10/2026" */
export function formatarData(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

/** "sabado, 24 de outubro" */
export function formatarDataPorExtenso(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-').map(Number);
  const diaSemana = DIAS[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()];
  return `${diaSemana}, ${dia} de ${MESES[mes - 1]}`;
}

/** "24 out" */
export function formatarDataCurta(iso) {
  if (!iso) return '';
  const [, mes, dia] = iso.split('-').map(Number);
  return `${dia} ${MESES_CURTOS[mes - 1]}`;
}

/** Quantos dias faltam de hoje ate a data informada. */
export function diasAte(iso, hoje = hojeIso()) {
  const ms = Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

/** 1 -> "1a", 2 -> "2a" ... usado para "esta sera a 8a visita". */
export function ordinal(numero) {
  return `${numero}ª`;
}

/**
 * Numero da visita numa data de referencia, contado pelo calendario — nao
 * depende de ninguem confirmar nada.
 *
 * A triagem e a 1a visita e vale pelo mes em que aconteceu: se ela cair em
 * 20/12, o 4o sabado daquele mesmo dezembro nao conta de novo. A contagem
 * recomeca no mes seguinte, um por 4o sabado.
 */
export function numeroDaVisita(dataTriagem, dataReferencia, excecoes = {}) {
  if (!dataTriagem || !dataReferencia) return 0;
  if (dataReferencia < dataTriagem) return 0;

  const [anoRef, mesRef] = dataReferencia.split('-').map(Number);
  const limite = anoRef * 12 + (mesRef - 1);

  const [anoTriagem, mesTriagem] = dataTriagem.split('-').map(Number);
  let ano = mesTriagem === 12 ? anoTriagem + 1 : anoTriagem;
  let mes = mesTriagem === 12 ? 1 : mesTriagem + 1;
  let total = 1; // a propria triagem, que sempre aconteceu

  while (ano * 12 + (mes - 1) <= limite) {
    const dia = diaDeVisita(ano, mes, excecoes);
    if (dia && dia <= dataReferencia) total += 1;
    mes += 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
  }

  return total;
}

/**
 * Os meses de visita de um intervalo, para montar a tela do calendario. Cada
 * item traz a data em vigor, a data padrao e se foi alterada pela mao.
 */
export function mesesDeVisita(inicioIso, fimIso, excecoes = {}) {
  const meses = [];
  let [ano, mes] = inicioIso.split('-').map(Number);
  const [anoFim, mesFim] = fimIso.split('-').map(Number);
  const limite = anoFim * 12 + (mesFim - 1);

  while (ano * 12 + (mes - 1) <= limite) {
    const chave = `${ano}-${String(mes).padStart(2, '0')}`;
    const padrao = diaDeVisitaPadrao(ano, mes);
    const temExcecao = Object.prototype.hasOwnProperty.call(excecoes, chave);
    meses.push({
      chave,
      ano,
      mes,
      padrao,
      data: temExcecao ? excecoes[chave] : padrao,
      alterado: temExcecao,
    });
    mes += 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
  }
  return meses;
}

/** Soma meses a uma data ISO, mantendo o dia 01 — serve para montar intervalos. */
export function mesesDepois(iso, quantidade) {
  const [ano, mes] = iso.split('-').map(Number);
  const total = (ano * 12 + (mes - 1)) + quantidade;
  const novoAno = Math.floor(total / 12);
  const novoMes = (total % 12) + 1;
  return `${novoAno}-${String(novoMes).padStart(2, '0')}-01`;
}

/** Dia da visita mais recente que ja passou (o 4o sabado anterior ou o de hoje). */
export function visitaAnterior(hoje = hojeIso()) {
  const [ano, mes] = hoje.split('-').map(Number);
  const desteMes = quartoSabado(ano, mes);
  if (desteMes <= hoje) return desteMes;
  return mes === 1 ? quartoSabado(ano - 1, 12) : quartoSabado(ano, mes - 1);
}

/** A triagem que conta e a primeira; as demais ficam apenas registradas. */
export function primeiraTriagem(triagens) {
  if (!triagens || triagens.length === 0) return null;
  return triagens.reduce((menor, atual) => (atual.data < menor ? atual.data : menor), triagens[0].data);
}
