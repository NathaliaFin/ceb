import { consultar, consultarUm } from './db';

function agruparPorAssistida(assistidas, linhas) {
  const porAssistida = new Map(assistidas.map((a) => [a.id, []]));
  for (const linha of linhas) {
    porAssistida.get(linha.assistida_id)?.push(linha);
  }
  return porAssistida;
}

/**
 * Lista para a tela principal. O numero da visita nao vem do banco: e calculado
 * a partir da primeira triagem, pelo calendario (ver lib/datas.js).
 */
export async function listarAssistidas({ incluirInativas = false } = {}) {
  const assistidas = await consultar(`
    SELECT *
      FROM assistidas
     ${incluirInativas ? '' : 'WHERE ativa'}
     ORDER BY ativa DESC, nome_completo
  `);

  if (assistidas.length === 0) return [];

  const ids = assistidas.map((a) => a.id);
  const [familiares, triagens] = await Promise.all([
    consultar('SELECT * FROM familiares WHERE assistida_id = ANY($1::int[]) ORDER BY ordem, id', [ids]),
    consultar('SELECT * FROM triagens WHERE assistida_id = ANY($1::int[]) ORDER BY data', [ids]),
  ]);

  const porFamiliar = agruparPorAssistida(assistidas, familiares);
  const porTriagem = agruparPorAssistida(assistidas, triagens);

  return assistidas.map((a) => ({
    ...a,
    familiares: porFamiliar.get(a.id) ?? [],
    triagens: porTriagem.get(a.id) ?? [],
  }));
}

export async function obterAssistida(id) {
  const assistida = await consultarUm('SELECT * FROM assistidas WHERE id = $1', [id]);
  if (!assistida) return null;

  const [familiares, triagens] = await Promise.all([
    consultar('SELECT * FROM familiares WHERE assistida_id = $1 ORDER BY ordem, id', [id]),
    consultar('SELECT * FROM triagens WHERE assistida_id = $1 ORDER BY data', [id]),
  ]);

  return { ...assistida, familiares, triagens };
}

export async function criarAssistida(dados) {
  const linha = await consultarUm(
    `INSERT INTO assistidas
       (nome_completo, telefone, endereco, referencia, latitude, longitude,
        itens_doacao, necessidades_emergenciais, observacoes, cor, ativa)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [
      dados.nome_completo, dados.telefone, dados.endereco, dados.referencia,
      dados.latitude, dados.longitude, dados.itens_doacao,
      dados.necessidades_emergenciais, dados.observacoes, dados.cor, dados.ativa,
    ],
  );
  return linha.id;
}

export async function atualizarAssistida(id, dados) {
  await consultar(
    `UPDATE assistidas
        SET nome_completo = $2, telefone = $3, endereco = $4, referencia = $5,
            latitude = $6, longitude = $7, itens_doacao = $8,
            necessidades_emergenciais = $9, observacoes = $10, cor = $11,
            ativa = $12, atualizada_em = now()
      WHERE id = $1`,
    [
      id, dados.nome_completo, dados.telefone, dados.endereco, dados.referencia,
      dados.latitude, dados.longitude, dados.itens_doacao,
      dados.necessidades_emergenciais, dados.observacoes, dados.cor, dados.ativa,
    ],
  );
}

export async function excluirAssistida(id) {
  await consultar('DELETE FROM assistidas WHERE id = $1', [id]);
}

/** Troca a lista inteira de familiares pela informada — o formulario envia tudo junto. */
export async function substituirFamiliares(assistidaId, familiares) {
  await consultar('DELETE FROM familiares WHERE assistida_id = $1', [assistidaId]);
  for (const [indice, familiar] of familiares.entries()) {
    await consultar(
      `INSERT INTO familiares (assistida_id, nome, parentesco, idade, observacao, ordem)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [assistidaId, familiar.nome, familiar.parentesco, familiar.idade, familiar.observacao, indice],
    );
  }
}

/** Troca a lista inteira de triagens pela informada — o formulario envia tudo junto. */
export async function substituirTriagens(assistidaId, triagens) {
  await consultar('DELETE FROM triagens WHERE assistida_id = $1', [assistidaId]);
  for (const triagem of triagens) {
    await consultar(
      `INSERT INTO triagens (assistida_id, data, observacao)
       VALUES ($1,$2,$3)
       ON CONFLICT (assistida_id, data) DO NOTHING`,
      [assistidaId, triagem.data, triagem.observacao],
    );
  }
}
