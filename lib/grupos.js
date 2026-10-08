// Os grupos do sistema (Paranoa04, Riacho Fundo...): cada um e uma "caixinha"
// com as proprias familias, calendario, senha e lembretes.
import { cache } from 'react';
import { consultar, consultarUm } from './db';

/** Enderecos que ja sao paginas do sistema e nao podem virar grupo. */
const RESERVADOS = new Set(['painel', 'login', 'admin', 'atendidas', 'api', 'entrar', 'gerenciar', 'sair']);

export { sugerirEndereco } from './enderecos';

export function enderecoValido(slug) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && !RESERVADOS.has(slug);
}

/** Para a pagina principal e o painel, com o numero de familias de cada um. */
export async function listarGrupos({ incluirInativos = false } = {}) {
  return consultar(`
    SELECT g.*,
           (SELECT count(*)::int FROM assistidas a WHERE a.grupo_id = g.id AND a.ativa) AS familias
      FROM grupos g
     ${incluirInativos ? '' : 'WHERE g.ativo'}
     ORDER BY g.nome
  `);
}

/** Um grupo pelo endereco. Em cache por requisicao: varias partes da pagina pedem. */
export const obterGrupoPorSlug = cache(async (slug) =>
  consultarUm('SELECT * FROM grupos WHERE slug = $1', [String(slug ?? '').toLowerCase()]),
);

export async function obterGrupo(id) {
  return consultarUm('SELECT * FROM grupos WHERE id = $1', [id]);
}

export async function criarGrupo({ slug, nome, cor, senhaHash, destinatarios, ativo }) {
  const linha = await consultarUm(
    `INSERT INTO grupos (slug, nome, cor, senha_hash, lembrete_destinatarios, ativo)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [slug, nome, cor, senhaHash, destinatarios, ativo],
  );
  return linha.id;
}

/** senhaHash nulo = mantem a senha atual. */
export async function atualizarGrupo(id, { slug, nome, cor, senhaHash, destinatarios, ativo }) {
  await consultar(
    `UPDATE grupos
        SET slug = $2, nome = $3, cor = $4, lembrete_destinatarios = $5, ativo = $6,
            senha_hash = COALESCE($7, senha_hash)
      WHERE id = $1`,
    [id, slug, nome, cor, destinatarios, ativo, senhaHash],
  );
}

/** O grupo dono de uma familia (para conferir o acesso antes de alterar). */
export async function grupoDaAssistida(assistidaId) {
  return consultarUm(
    'SELECT g.* FROM assistidas a JOIN grupos g ON g.id = a.grupo_id WHERE a.id = $1',
    [assistidaId],
  );
}

/** O grupo dono de uma necessidade emergencial. */
export async function grupoDaEmergencia(emergenciaId) {
  return consultarUm(
    `SELECT g.* FROM emergencias e
       JOIN assistidas a ON a.id = e.assistida_id
       JOIN grupos g ON g.id = a.grupo_id
      WHERE e.id = $1`,
    [emergenciaId],
  );
}
