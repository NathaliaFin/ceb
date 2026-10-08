// Le a situacao que o sistema da DPS mostra para cada familia e diz se a
// visita do mes ja foi registrada la. Funcoes puras (sem rede nem banco),
// usadas no cartao, na ficha e nos testes.
import { diaDeVisita } from './datas.js';

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** Nome sem acento, minusculo e com espacos simples: liga a DPS ao cadastro. */
export function normalizarNome(nome) {
  return String(nome ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * "Pendente de inicio de registro da Visita do mes de Outubro/2026" -> o mes
 * que ainda falta registrar ({ ano: 2026, mes: 10 }). Outra frase -> null.
 */
export function mesPendenteNaDps(situacao) {
  const texto = normalizarNome(situacao);
  if (!texto.startsWith('pendente')) return null;
  const achado = texto.match(/(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\/(\d{4})/);
  if (!achado) return null;
  const mes = MESES.map((m) => normalizarNome(m)).indexOf(achado[1]) + 1;
  return { ano: Number(achado[2]), mes };
}

/** O mes da ultima visita que ja aconteceu, respeitando o calendario. */
export function mesDaUltimaVisita(hoje, excecoes = {}) {
  let [ano, mes] = hoje.split('-').map(Number);
  for (let i = 0; i < 14; i++) {
    const dia = diaDeVisita(ano, mes, excecoes);
    if (dia && dia <= hoje) return { ano, mes };
    mes -= 1;
    if (mes === 0) { mes = 12; ano -= 1; }
  }
  return null;
}

const ordem = ({ ano, mes }) => ano * 12 + (mes - 1);

/**
 * { registrada, mes } para o cartao, ou null quando nao da para afirmar nada
 * (sem dado da DPS, ou frase que nao conhecemos).
 * Pendente o mes M quer dizer que ate M-1 esta registrado.
 */
export function registroDaVisita(situacao, hoje, excecoes = {}) {
  const pendente = mesPendenteNaDps(situacao);
  const ultima = mesDaUltimaVisita(hoje, excecoes);
  if (!pendente || !ultima) return null;
  return {
    registrada: ordem(pendente) - 1 >= ordem(ultima),
    mes: MESES[ultima.mes - 1],
  };
}
