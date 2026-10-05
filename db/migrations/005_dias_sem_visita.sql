-- Meses em que o grupo nao foi a campo. Como a visita e coletiva, isso vale
-- para todas as familias: a data marcada aqui deixa de somar na contagem de
-- qualquer cartao.
CREATE TABLE IF NOT EXISTS dias_sem_visita (
  data       DATE PRIMARY KEY,
  motivo     TEXT,
  criada_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);
