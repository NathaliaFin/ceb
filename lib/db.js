import pg from 'pg';

// O driver devolve DATE como string "YYYY-MM-DD" em vez de Date, para o dia da
// visita nao escorregar por causa de fuso horario.
pg.types.setTypeParser(1082, (valor) => valor);

function configuracaoSsl(url) {
  return /[?&]sslmode=(require|verify-ca|verify-full)/.test(url)
    ? { rejectUnauthorized: false }
    : false;
}

// Em desenvolvimento o Next recarrega os modulos a cada alteracao; guardar o
// pool no globalThis evita abrir uma conexao nova a cada hot reload.
const global_ = globalThis;

function criarPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL nao esta definida');
  return new pg.Pool({ connectionString: url, ssl: configuracaoSsl(url), max: 5 });
}

export function pool() {
  if (!global_.__cebPool) global_.__cebPool = criarPool();
  return global_.__cebPool;
}

export async function consultar(sql, parametros = []) {
  const { rows } = await pool().query(sql, parametros);
  return rows;
}

export async function consultarUm(sql, parametros = []) {
  const linhas = await consultar(sql, parametros);
  return linhas[0] ?? null;
}
