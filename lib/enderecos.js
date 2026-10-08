// "Riacho Fundo II" -> "riacho-fundo-ii": sem acento, minusculo, com hifen.
// Sem banco: roda tambem no navegador, para mostrar o endereco do grupo
// enquanto o nome e digitado no painel.
export function sugerirEndereco(nome) {
  return String(nome ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
