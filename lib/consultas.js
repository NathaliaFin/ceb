import { consultar, consultarUm } from './db';

function agruparFamiliares(assistidas, familiares) {
  const porAssistida = new Map(assistidas.map((a) => [a.id, []]));
  for (const familiar of familiares) {
    porAssistida.get(familiar.assistida_id)?.push(familiar);
  }
  return assistidas.map((a) => ({ ...a, familiares: porAssistida.get(a.id) ?? [] }));
}

/**
 * Lista para a tela principal. A contagem de visitas vem do proprio historico,
 * entao nunca dessincroniza, e os familiares vem em uma consulta so.
 */
export async function listarAssistidas({ incluirInativas = false } = {}) {
  const assistidas = await consultar(`
    SELECT a.*,
           COALESCE(v.total, 0) AS total_visitas,
           v.ultima_visita
      FROM assistidas a
      LEFT JOIN (
             SELECT assistida_id, COUNT(*)::int AS total, MAX(data) AS ultima_visita
               FROM visitas
              GROUP BY assistida_id
           ) v ON v.assistida_id = a.id
     ${incluirInativas ? '' : 'WHERE a.ativa'}
     ORDER BY a.ativa DESC, a.nome_completo
  `);

  if (assistidas.length === 0) return [];

  const familiares = await consultar(
    `SELECT * FROM familiares WHERE assistida_id = ANY($1::int[]) ORDER BY ordem, id`,
    [assistidas.map((a) => a.id)],
  );

  return agruparFamiliares(assistidas, familiares);
}

export async function obterAssistida(id) {
  const assistida = await consultarUm(
    `SELECT a.*,
            COALESCE(v.total, 0) AS total_visitas,
            v.ultima_visita
       FROM assistidas a
       LEFT JOIN (
              SELECT assistida_id, COUNT(*)::int AS total, MAX(data) AS ultima_visita
                FROM visitas
               WHERE assistida_id = $1
               GROUP BY assistida_id
            ) v ON v.assistida_id = a.id
      WHERE a.id = $1`,
    [id],
  );
  if (!assistida) return null;

  const [familiares, visitas] = await Promise.all([
    consultar('SELECT * FROM familiares WHERE assistida_id = $1 ORDER BY ordem, id', [id]),
    consultar('SELECT * FROM visitas WHERE assistida_id = $1 ORDER BY data DESC', [id]),
  ]);

  return { ...assistida, familiares, visitas };
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

/**
 * Registra a visita do dia. Se dois voluntarios tocarem no botao na mesma
 * visita, a segunda gravacao e ignorada em vez de virar visita duplicada.
 */
export async function registrarVisita(assistidaId, data, observacao) {
  try {
    const linha = await consultarUm(
      `INSERT INTO visitas (assistida_id, data, observacao)
       VALUES ($1, $2, $3)
       ON CONFLICT (assistida_id, data) DO NOTHING
       RETURNING id`,
      [assistidaId, data, observacao || null],
    );
    return linha !== null;
  } catch (erro) {
    // 23503 = chave estrangeira. Acontece quando a assistida foi apagada
    // enquanto o voluntario estava com o cartao aberto no celular: nao ha o
    // que registrar, entao a acao nao faz nada em vez de quebrar a tela.
    if (erro.code === '23503') return false;
    throw erro;
  }
}

export async function excluirVisita(id) {
  await consultar('DELETE FROM visitas WHERE id = $1', [id]);
}
