// Aplica, em ordem, os arquivos .sql de db/migrations que ainda nao rodaram.
// Roda automaticamente no "npm start", ou seja, a cada deploy no Railway.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const pastaMigrations = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

function configuracaoSsl(url) {
  return /[?&]sslmode=(require|verify-ca|verify-full)/.test(url)
    ? { rejectUnauthorized: false }
    : false;
}

async function migrar() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL nao esta definida — nao da para migrar o banco.');
    process.exit(1);
  }

  const cliente = new pg.Client({ connectionString: url, ssl: configuracaoSsl(url) });
  await cliente.connect();

  try {
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS _migracoes (
        nome       TEXT PRIMARY KEY,
        aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await cliente.query('SELECT nome FROM _migracoes');
    const jaAplicadas = new Set(rows.map((r) => r.nome));

    const arquivos = readdirSync(pastaMigrations)
      .filter((nome) => nome.endsWith('.sql'))
      .sort();

    let aplicadas = 0;
    for (const arquivo of arquivos) {
      if (jaAplicadas.has(arquivo)) continue;

      const sql = readFileSync(join(pastaMigrations, arquivo), 'utf8');
      await cliente.query('BEGIN');
      try {
        await cliente.query(sql);
        await cliente.query('INSERT INTO _migracoes (nome) VALUES ($1)', [arquivo]);
        await cliente.query('COMMIT');
        console.log(`migracao aplicada: ${arquivo}`);
        aplicadas += 1;
      } catch (erro) {
        await cliente.query('ROLLBACK');
        throw new Error(`falha na migracao ${arquivo}: ${erro.message}`);
      }
    }

    console.log(aplicadas === 0 ? 'banco ja estava atualizado' : `${aplicadas} migracao(oes) aplicada(s)`);
  } finally {
    await cliente.end();
  }
}

migrar().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});
