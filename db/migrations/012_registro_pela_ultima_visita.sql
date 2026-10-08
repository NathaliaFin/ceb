-- A caixa "Visita de <mes> registrada" passou a perguntar pela ultima visita
-- que ja aconteceu, e nao pelo mes do calendario. A versao anterior ficou no
-- ar so em 08/10/2026 e perguntava por "outubro" quando a visita a registrar
-- era a de setembro (26/09): o que foi marcado ali e de setembro.
INSERT INTO registros_visita (assistida_id, mes, marcado_em)
SELECT assistida_id, '2026-09', marcado_em
  FROM registros_visita
 WHERE mes = '2026-10'
ON CONFLICT (assistida_id, mes) DO NOTHING;

DELETE FROM registros_visita WHERE mes = '2026-10';
