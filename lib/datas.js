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

/** Proximo dia de visita a partir de hoje (inclui o proprio dia, se for sabado). */
export function proximaVisita(hoje = hojeIso()) {
  const [ano, mes] = hoje.split('-').map(Number);
  const desteMes = quartoSabado(ano, mes);
  if (desteMes >= hoje) return desteMes;
  return mes === 12 ? quartoSabado(ano + 1, 1) : quartoSabado(ano, mes + 1);
}

export function ehDiaDeVisita(data = hojeIso()) {
  const [ano, mes] = data.split('-').map(Number);
  return quartoSabado(ano, mes) === data;
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
export function numeroDaVisita(dataTriagem, dataReferencia) {
  if (!dataTriagem || !dataReferencia) return 0;
  if (dataReferencia < dataTriagem) return 0;

  const [anoTriagem, mesTriagem] = dataTriagem.split('-').map(Number);
  let ano = mesTriagem === 12 ? anoTriagem + 1 : anoTriagem;
  let mes = mesTriagem === 12 ? 1 : mesTriagem + 1;
  let total = 1; // a propria triagem

  for (;;) {
    if (quartoSabado(ano, mes) > dataReferencia) return total;
    total += 1;
    mes += 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
  }
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
