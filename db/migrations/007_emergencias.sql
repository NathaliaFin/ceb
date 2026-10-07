-- A necessidade emergencial deixa de ser um campo unico, que era apagado
-- quando resolvida. Cada uma vira uma linha: aberta enquanto concluida_em for
-- nula, e depois fica no historico da familia.
CREATE TABLE IF NOT EXISTS emergencias (
  id             SERIAL PRIMARY KEY,
  assistida_id   INTEGER NOT NULL REFERENCES assistidas(id) ON DELETE CASCADE,
  texto          TEXT NOT NULL,
  registrada_em  DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  concluida_em   DATE
);

CREATE INDEX IF NOT EXISTS emergencias_assistida_idx ON emergencias (assistida_id, id);

-- Leva para a tabela nova o que ja estava na coluna antiga, antes de remove-la.
-- A data de registro e a da ultima alteracao do cadastro: a melhor que existe.
INSERT INTO emergencias (assistida_id, texto, registrada_em)
SELECT id, btrim(necessidades_emergenciais), (atualizada_em AT TIME ZONE 'America/Sao_Paulo')::date
  FROM assistidas
 WHERE necessidades_emergenciais IS NOT NULL
   AND btrim(necessidades_emergenciais) <> '';

ALTER TABLE assistidas DROP COLUMN IF EXISTS necessidades_emergenciais;
