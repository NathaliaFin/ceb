-- Ultima leitura do relatorio de visitas do sistema da DPS (dpsfamilia.com.br):
-- a situacao de cada familia, que diz se a visita do mes ja foi registrada la.
-- Uma linha so, trocada a cada consulta.
CREATE TABLE IF NOT EXISTS dps_relatorio (
  id             INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  linhas         JSONB NOT NULL DEFAULT '[]'::jsonb,
  consultado_em  TIMESTAMPTZ,
  tentado_em     TIMESTAMPTZ,
  erro           TEXT
);
