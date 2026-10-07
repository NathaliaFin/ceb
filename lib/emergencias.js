// Separacao usada pelo cartao, pela ficha e pelo cadastro. Fica fora de
// lib/consultas.js porque aquele arquivo fala com o banco e nao pode ir para
// o navegador.

/** As que ainda aparecem no cartao, da mais antiga para a mais nova. */
export function emergenciasAbertas(assistida) {
  return (assistida?.emergencias ?? []).filter((e) => !e.concluida_em);
}

/** O historico: as ja concluidas, da conclusao mais recente para a mais antiga. */
export function emergenciasConcluidas(assistida) {
  return (assistida?.emergencias ?? [])
    .filter((e) => e.concluida_em)
    .sort((a, b) => (a.concluida_em === b.concluida_em ? b.id - a.id : a.concluida_em < b.concluida_em ? 1 : -1));
}
