-- Guarda o link do mapa que a administradora cola (compartilhado do Google
-- Maps). As coordenadas continuam sendo extraidas dele e gravadas em latitude
-- e longitude, porque e disso que o Waze precisa para abrir no ponto certo.
ALTER TABLE assistidas ADD COLUMN IF NOT EXISTS link_mapa TEXT;
