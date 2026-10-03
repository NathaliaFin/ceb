-- Uma familia pode passar por mais de uma triagem. A contagem do cartao
-- continua saindo da PRIMEIRA delas; as demais ficam registradas.
CREATE TABLE IF NOT EXISTS triagens (
  id            SERIAL PRIMARY KEY,
  assistida_id  INTEGER NOT NULL REFERENCES assistidas(id) ON DELETE CASCADE,
  data          DATE NOT NULL,
  observacao    TEXT,
  UNIQUE (assistida_id, data)
);

CREATE INDEX IF NOT EXISTS triagens_assistida_idx ON triagens (assistida_id, data);

-- Leva para a tabela nova o que ja estava na coluna antiga, antes de remove-la.
INSERT INTO triagens (assistida_id, data)
SELECT id, data_triagem
  FROM assistidas
 WHERE data_triagem IS NOT NULL
ON CONFLICT (assistida_id, data) DO NOTHING;

ALTER TABLE assistidas DROP COLUMN IF EXISTS data_triagem;
