-- Cadastro das familias atendidas pelo projeto.
CREATE TABLE IF NOT EXISTS assistidas (
  id                         SERIAL PRIMARY KEY,
  nome_completo              TEXT NOT NULL,
  telefone                   TEXT,
  endereco                   TEXT,
  referencia                 TEXT,
  latitude                   DOUBLE PRECISION,
  longitude                  DOUBLE PRECISION,
  itens_doacao               TEXT,
  necessidades_emergenciais  TEXT,
  observacoes                TEXT,
  cor                        TEXT NOT NULL DEFAULT 'rosa',
  ativa                      BOOLEAN NOT NULL DEFAULT TRUE,
  criada_em                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizada_em              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pessoas que moram com a assistida.
CREATE TABLE IF NOT EXISTS familiares (
  id            SERIAL PRIMARY KEY,
  assistida_id  INTEGER NOT NULL REFERENCES assistidas(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  parentesco    TEXT,
  idade         INTEGER,
  observacao    TEXT,
  ordem         INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS familiares_assistida_idx ON familiares (assistida_id, ordem, id);

-- Historico de visitas. A contagem exibida no card ("7a visita") e o numero de
-- linhas aqui, por isso nunca sai do lugar. A chave unica por data impede que
-- dois voluntarios registrem a mesma visita em duplicidade.
CREATE TABLE IF NOT EXISTS visitas (
  id             SERIAL PRIMARY KEY,
  assistida_id   INTEGER NOT NULL REFERENCES assistidas(id) ON DELETE CASCADE,
  data           DATE NOT NULL,
  observacao     TEXT,
  criada_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assistida_id, data)
);

CREATE INDEX IF NOT EXISTS visitas_assistida_idx ON visitas (assistida_id, data DESC);
