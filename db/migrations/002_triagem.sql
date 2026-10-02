-- A contagem de visitas deixa de depender de alguem confirmar e passa a ser
-- calculada pelo calendario: a triagem e a 1a visita e cada 4o sabado seguinte
-- e a proxima. Por isso a tabela de visitas sai de cena.
ALTER TABLE assistidas ADD COLUMN IF NOT EXISTS data_triagem DATE;

DROP TABLE IF EXISTS visitas;
