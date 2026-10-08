-- Familia desligada do programa (ja atendida como devia): sai dos cartoes e
-- vai para "Familias atendidas". A marcacao continua sendo ativa = false; aqui
-- so entra a data do desligamento. Familias que ja estavam inativas ficam sem
-- data, que nao ha como saber.
ALTER TABLE assistidas ADD COLUMN IF NOT EXISTS desligada_em DATE;
