// As visitas acontecem sempre no 4o sabado do mes. Tudo aqui trabalha com datas
// no formato "AAAA-MM-DD" (sem hora), para nao haver escorregao de fuso.
const FUSO = 'America/Sao_Paulo';

// Com acento: estes nomes aparecem na tela ("sábado, 24 de outubro").
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
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

/** "outubro" (o mes de uma data "2026-10-08" ou de um "2026-10"). */
export function nomeDoMes(iso) {
  const mes = Number(String(iso ?? '').split('-')[1]);
  return MESES[mes - 1] ?? '';
}

/** "sábado, 24 de outubro" */
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

/** A data "iso" mais "dias" dias. */
export function somarDias(iso, dias) {
  const data = new Date(`${iso}T00:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

/**
 * A ultima visita que ja aconteceu (o proprio dia conta), pelo calendario:
 * pula mes sem visita e respeita data mudada a mao. E por ela que a caixa
 * "Visita de <mes> registrada" pergunta — o registro e feito dias depois da
 * visita, muitas vezes ja no mes seguinte.
 */
export function ultimaVisitaFeita(hoje = hojeIso(), excecoes = {}) {
  let [ano, mes] = hoje.split('-').map(Number);
  for (let i = 0; i < 14; i++) {
    const dia = diaDeVisita(ano, mes, excecoes);
    if (dia && dia <= hoje) return dia;
    mes -= 1;
    if (mes === 0) { mes = 12; ano -= 1; }
  }
  return null;
}

/** O almoxarifado pede o registro da visita em ate 14 dias. */
export const PRAZO_REGISTRO_DIAS = 14;
/** O aviso aparece quando faltam estes dias (ou menos) para o prazo. */
export const AVISO_PRAZO_DIAS = 3;

/**
 * Situacao do prazo do almoxarifado para uma visita ainda nao registrada:
 * null (folgado), 'perto' (ultimos dias) ou 'vencido'.
 */
export function situacaoDoPrazo(visita, hoje = hojeIso()) {
  const faltam = diasAte(somarDias(visita, PRAZO_REGISTRO_DIAS), hoje);
  if (faltam < 0) return 'vencido';
  if (faltam <= AVISO_PRAZO_DIAS) return 'perto';
  return null;
}

/** O lembrete por e-mail sai no 10o dia apos a visita (o prazo e o 14o). */
export const DIA_DO_LEMBRETE = 10;

/**
 * A visita cujo lembrete de registro deve sair hoje: a ultima visita, se hoje
 * estiver entre o 10o dia depois dela e o fim do prazo. Do 11o ao 14o dia so
 * vale se o envio do 10o nao aconteceu (servidor fora do ar, por exemplo) — o
 * envio e registrado no banco e nunca se repete para a mesma visita.
 */
export function visitaParaLembrar(hoje = hojeIso(), excecoes = {}) {
  const visita = ultimaVisitaFeita(hoje, excecoes);
  if (!visita) return null;
  const inicio = somarDias(visita, DIA_DO_LEMBRETE);
  const fim = somarDias(visita, PRAZO_REGISTRO_DIAS);
  return hoje >= inicio && hoje <= fim ? visita : null;
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

/** Quantas visitas uma familia costuma ter, contando a triagem. */
export const VISITAS_DO_CICLO = 7;

/**
 * Em que ponto do ciclo a familia esta. So avisa, nao encerra nada: com 6
 * visitas 'falta-uma'; da 7a em diante 'ciclo-completo', e o aviso continua
 * enquanto ela seguir no programa (ha familias, como a Carmen, que passam
 * das 7). Desligar a familia e decisao da administradora.
 */
export function etapaDoCiclo(visitas) {
  if (visitas >= VISITAS_DO_CICLO) return 'ciclo-completo';
  if (visitas === VISITAS_DO_CICLO - 1) return 'falta-uma';
  return 'normal';
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
