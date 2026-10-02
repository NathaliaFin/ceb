// Cada assistida tem uma cor de destaque, para o voluntario reconhecer o card
// de relance. Os tons foram escolhidos para ter contraste suficiente tanto no
// fundo claro quanto no escuro.
export const PALETA = {
  rosa: { nome: 'Rosa', base: '#e0376f' },
  terracota: { nome: 'Terracota', base: '#d4572a' },
  ambar: { nome: 'Âmbar', base: '#c98200' },
  esmeralda: { nome: 'Esmeralda', base: '#0f9372' },
  ceu: { nome: 'Céu', base: '#1584c0' },
  violeta: { nome: 'Violeta', base: '#7b5ce0' },
};

export const CHAVES_CORES = Object.keys(PALETA);

export function corDe(chave) {
  return PALETA[chave] ?? PALETA.rosa;
}

/** Iniciais para o avatar: "Maria da Silva" -> "MS". */
export function iniciais(nomeCompleto) {
  const partes = String(nomeCompleto ?? '')
    .trim()
    .split(/\s+/)
    .filter((parte) => parte.length > 2 || /^[A-ZÀ-Ý]/.test(parte));
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
