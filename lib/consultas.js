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
  return comDetalhes(assistidas);
}

/** "Familias atendidas": as desligadas, da mais recente para a mais antiga. */
export async function listarFamiliasAtendidas() {
  const assistidas = await consultar(`
    SELECT *
      FROM assistidas
     WHERE NOT ativa
     ORDER BY desligada_em DESC NULLS LAST, nome_completo
  `);
  return comDetalhes(assistidas);
}

/** Junta familiares, triagens e necessidades de cada familia da lista. */
async function comDetalhes(assistidas) {
  if (assistidas.length === 0) return [];

  const ids = assistidas.map((a) => a.id);
  const [familiares, triagens, emergencias] = await Promise.all([
    consultar('SELECT * FROM familiares WHERE assistida_id = ANY($1::int[]) ORDER BY ordem, id', [ids]),
    consultar('SELECT * FROM triagens WHERE assistida_id = ANY($1::int[]) ORDER BY data', [ids]),
    consultar('SELECT * FROM emergencias WHERE assistida_id = ANY($1::int[]) ORDER BY id', [ids]),
  ]);

  const porFamiliar = agruparPorAssistida(assistidas, familiares);
  const porTriagem = agruparPorAssistida(assistidas, triagens);
  const porEmergencia = agruparPorAssistida(assistidas, emergencias);

  return assistidas.map((a) => ({
    ...a,
    familiares: porFamiliar.get(a.id) ?? [],
    triagens: porTriagem.get(a.id) ?? [],
    emergencias: porEmergencia.get(a.id) ?? [],
  }));
}

export async function obterAssistida(id) {
  const assistida = await consultarUm('SELECT * FROM assistidas WHERE id = $1', [id]);
  if (!assistida) return null;

  const [familiares, triagens, emergencias] = await Promise.all([
    consultar('SELECT * FROM familiares WHERE assistida_id = $1 ORDER BY ordem, id', [id]),
    consultar('SELECT * FROM triagens WHERE assistida_id = $1 ORDER BY data', [id]),
    consultar('SELECT * FROM emergencias WHERE assistida_id = $1 ORDER BY id', [id]),
  ]);

  return { ...assistida, familiares, triagens, emergencias };
}

export async function criarAssistida(dados) {
  const linha = await consultarUm(
    `INSERT INTO assistidas
       (nome_completo, telefone, endereco, referencia, latitude, longitude,
        itens_doacao, observacoes, cor, ativa, link_mapa)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [
      dados.nome_completo, dados.telefone, dados.endereco, dados.referencia,
      dados.latitude, dados.longitude, dados.itens_doacao,
      dados.observacoes, dados.cor, dados.ativa, dados.link_mapa,
    ],
  );
  return linha.id;
}

export async function atualizarAssistida(id, dados) {
  await consultar(
    `UPDATE assistidas
        SET nome_completo = $2, telefone = $3, endereco = $4, referencia = $5,
            latitude = $6, longitude = $7, itens_doacao = $8,
            observacoes = $9, cor = $10, ativa = $11, link_mapa = $12,
            -- A caixa "familia ativa" do cadastro tambem desliga e reativa.
            desligada_em = CASE WHEN $11 THEN NULL
                                ELSE COALESCE(desligada_em, (now() AT TIME ZONE 'America/Sao_Paulo')::date) END,
            atualizada_em = now()
      WHERE id = $1`,
    [
      id, dados.nome_completo, dados.telefone, dados.endereco, dados.referencia,
      dados.latitude, dados.longitude, dados.itens_doacao,
      dados.observacoes, dados.cor, dados.ativa, dados.link_mapa,
    ],
  );
}

/** Desliga do programa: sai dos cartoes e vai para "Familias atendidas". */
export async function desligarAssistida(id, dia) {
  await consultar(
    'UPDATE assistidas SET ativa = FALSE, desligada_em = $2, atualizada_em = now() WHERE id = $1',
    [id, dia],
  );
}

/** Volta para os cartoes (raro, mas acontece). */
export async function reativarAssistida(id) {
  await consultar(
    'UPDATE assistidas SET ativa = TRUE, desligada_em = NULL, atualizada_em = now() WHERE id = $1',
    [id],
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

/**
 * Necessidades emergenciais: cada uma fica aberta ate ser concluida, e depois
 * permanece no historico da familia. As funcoes devolvem o id da familia, para
 * a tela dela ser atualizada.
 */
export async function registrarEmergencia(assistidaId, texto, dia) {
  await consultar(
    'INSERT INTO emergencias (assistida_id, texto, registrada_em) VALUES ($1, $2, $3)',
    [assistidaId, texto, dia],
  );
}

export async function concluirEmergencia(id, dia) {
  const linha = await consultarUm(
    `UPDATE emergencias SET concluida_em = $2
      WHERE id = $1 AND concluida_em IS NULL
      RETURNING assistida_id`,
    [id, dia],
  );
  return linha?.assistida_id ?? null;
}

export async function reabrirEmergencia(id) {
  const linha = await consultarUm(
    'UPDATE emergencias SET concluida_em = NULL WHERE id = $1 RETURNING assistida_id',
    [id],
  );
  return linha?.assistida_id ?? null;
}

/** Apaga de vez: some do cartao e do historico. */
export async function excluirEmergencia(id) {
  const linha = await consultarUm('DELETE FROM emergencias WHERE id = $1 RETURNING assistida_id', [id]);
  return linha?.assistida_id ?? null;
}

/** Excecoes do calendario: mes sem visita, ou visita em outro dia. */
export async function listarExcecoesCalendario() {
  return consultar('SELECT * FROM calendario_excecoes ORDER BY mes');
}

/** Vira o mapa "AAAA-MM" -> data (nulo quando nao houve visita). */
export function mapaDeExcecoes(linhas) {
  const mapa = {};
  for (const linha of linhas) mapa[linha.mes] = linha.data;
  return mapa;
}

export async function salvarExcecaoCalendario(mes, data, motivo) {
  await consultar(
    `INSERT INTO calendario_excecoes (mes, data, motivo)
     VALUES ($1, $2, $3)
     ON CONFLICT (mes) DO UPDATE SET data = EXCLUDED.data, motivo = EXCLUDED.motivo`,
    [mes, data, motivo || null],
  );
}

export async function removerExcecaoCalendario(mes) {
  await consultar('DELETE FROM calendario_excecoes WHERE mes = $1', [mes]);
}
