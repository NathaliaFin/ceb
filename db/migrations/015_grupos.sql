-- O sistema passa a atender varios grupos (Paranoa04, Riacho Fundo, Recanto
-- das Emas...), cada um na sua "caixinha": as proprias familias, o proprio
-- calendario, a propria senha e os proprios lembretes. A pagina principal
-- lista os grupos; cada grupo mora em /<endereco> (ex.: /paranoa04).
CREATE TABLE IF NOT EXISTS grupos (
  id                      SERIAL PRIMARY KEY,
  -- O pedaco do endereco: minusculas, numeros e hifen ("riacho-fundo").
  slug                    TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nome                    TEXT NOT NULL,
  cor                     TEXT NOT NULL DEFAULT 'rosa',
  -- "scrypt$sal$hash". Nulo no Paranoa04 enquanto a senha vier da variavel
  -- SENHA_VOLUNTARIO, como antes; ao definir uma senha no painel, passa a valer esta.
  senha_hash              TEXT,
  -- E-mails do lembrete de registro, separados por virgula.
  lembrete_destinatarios  TEXT,
  ativo                   BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- O grupo que ja existia: tudo o que esta no banco e dele.
INSERT INTO grupos (slug, nome, cor) VALUES ('paranoa04', 'Paranoá04', 'violeta')
ON CONFLICT (slug) DO NOTHING;

-- Familias
ALTER TABLE assistidas ADD COLUMN IF NOT EXISTS grupo_id INTEGER REFERENCES grupos(id);
UPDATE assistidas SET grupo_id = (SELECT id FROM grupos WHERE slug = 'paranoa04') WHERE grupo_id IS NULL;
ALTER TABLE assistidas ALTER COLUMN grupo_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS assistidas_grupo_idx ON assistidas (grupo_id, ativa, nome_completo);

-- Calendario: cada grupo corrige os proprios meses.
ALTER TABLE calendario_excecoes ADD COLUMN IF NOT EXISTS grupo_id INTEGER REFERENCES grupos(id) ON DELETE CASCADE;
UPDATE calendario_excecoes SET grupo_id = (SELECT id FROM grupos WHERE slug = 'paranoa04') WHERE grupo_id IS NULL;
ALTER TABLE calendario_excecoes ALTER COLUMN grupo_id SET NOT NULL;
ALTER TABLE calendario_excecoes DROP CONSTRAINT IF EXISTS calendario_excecoes_pkey;
ALTER TABLE calendario_excecoes ADD PRIMARY KEY (grupo_id, mes);

-- Lembretes: um por grupo e por visita.
ALTER TABLE lembretes_enviados ADD COLUMN IF NOT EXISTS grupo_id INTEGER REFERENCES grupos(id) ON DELETE CASCADE;
UPDATE lembretes_enviados SET grupo_id = (SELECT id FROM grupos WHERE slug = 'paranoa04') WHERE grupo_id IS NULL;
ALTER TABLE lembretes_enviados ALTER COLUMN grupo_id SET NOT NULL;
ALTER TABLE lembretes_enviados DROP CONSTRAINT IF EXISTS lembretes_enviados_pkey;
ALTER TABLE lembretes_enviados ADD PRIMARY KEY (grupo_id, visita);
