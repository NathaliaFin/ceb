-- O calendario deixa de registrar so os meses cancelados e passa a guardar uma
-- excecao por mes: ou a visita nao aconteceu (data nula), ou aconteceu em outro
-- dia que nao o padrao. Dezembro, por exemplo, costuma cair no 3o sabado.
CREATE TABLE IF NOT EXISTS calendario_excecoes (
  mes        TEXT PRIMARY KEY,          -- "AAAA-MM"
  data       DATE,                      -- nulo = nao houve visita naquele mes
  motivo     TEXT,
  criada_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leva o que estava na tabela anterior: cada dia marcado la era um mes sem visita.
INSERT INTO calendario_excecoes (mes, data, motivo)
SELECT to_char(data, 'YYYY-MM'), NULL, motivo
  FROM dias_sem_visita
ON CONFLICT (mes) DO NOTHING;

DROP TABLE IF EXISTS dias_sem_visita;
