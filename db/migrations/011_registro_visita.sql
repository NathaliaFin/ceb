-- Registro da visita do mes, marcado no cartao pelo grupo. Uma linha por
-- familia e por mes ("2026-10"): o cartao pergunta sempre pelo mes corrente,
-- entao, quando o mes vira, a caixa aparece desmarcada para o novo mes sem
-- ninguem apagar nada — e os meses anteriores ficam guardados.
CREATE TABLE IF NOT EXISTS registros_visita (
  assistida_id  INTEGER NOT NULL REFERENCES assistidas(id) ON DELETE CASCADE,
  mes           TEXT NOT NULL CHECK (mes ~ '^\d{4}-\d{2}$'),
  marcado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (assistida_id, mes)
);
