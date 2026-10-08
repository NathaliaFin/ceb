-- Lembrete por e-mail do registro das visitas (10o dia apos a visita): uma
-- linha por visita ja tratada, para o e-mail nunca sair duas vezes — nem
-- depois de um deploy. "enviado" e falso quando, no dia, tudo ja estava
-- registrado e nao havia o que lembrar.
CREATE TABLE IF NOT EXISTS lembretes_enviados (
  visita        DATE PRIMARY KEY,
  enviado       BOOLEAN NOT NULL,
  tratado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);
