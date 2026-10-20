-- Cadastro das 3 primeiras familias do Samambaia02, pelas fichas da DPS (1399,
-- 1451 e 1455). A triagem das tres e no sabado 24/10/2026, a 1a visita.
-- O grupo e procurado pelo endereco sem hifen ("samambaia02" ou "samambaia-02").
-- Se ele nao existir, nada e gravado, mas o deploy segue: um erro aqui
-- derrubaria o app de todos os grupos. Familia ja cadastrada (mesmo nome) e pulada.
DO $$
DECLARE
  g  INTEGER;
  a  INTEGER;
BEGIN
  SELECT id INTO g FROM grupos WHERE replace(slug, '-', '') = 'samambaia02';
  IF g IS NULL THEN
    RAISE NOTICE 'grupo samambaia02 nao encontrado: familias nao cadastradas';
    RETURN;
  END IF;

  -- 1399
  IF NOT EXISTS (SELECT 1 FROM assistidas WHERE grupo_id = g AND nome_completo = 'Wanessa Cardozo dos Santos') THEN
    INSERT INTO assistidas (grupo_id, nome_completo, telefone, endereco, referencia, observacoes, cor, ativa)
    VALUES (g, 'Wanessa Cardozo dos Santos', '(61) 99409-8728',
            'QR 405 Conjunto 08 Casa 11 - Samambaia Norte, Samambaia - DF',
            'Próximo à igreja católica',
            'Família DPS 1399, cadastrada em 04/12/2025. Casa alugada de alvenaria, 3 cômodos, aluguel de R$ 550,00. Recebe Bolsa Família de R$ 900,00. Todos com boas condições de saúde.',
            'rosa', TRUE)
    RETURNING id INTO a;
    INSERT INTO familiares (assistida_id, nome, parentesco, idade, ordem) VALUES
      (a, 'Erick Guilhon Menez', 'Filho', 7, 0),
      (a, 'Cecília Guilhon Menez da Silva', 'Filha', 3, 1);
    INSERT INTO triagens (assistida_id, data) VALUES (a, DATE '2026-10-24');
  END IF;

  -- 1451
  IF NOT EXISTS (SELECT 1 FROM assistidas WHERE grupo_id = g AND nome_completo = 'Lindocesar dos Santos') THEN
    INSERT INTO assistidas (grupo_id, nome_completo, telefone, endereco, referencia, observacoes, cor, ativa)
    VALUES (g, 'Lindocesar dos Santos', '(61) 99133-6701',
            'QR 631 Conjunto 03 Casa 02 - Espação, Samambaia Norte, Samambaia - DF',
            'Próximo ao Mercado Corderão',
            'Família DPS 1451, cadastrada em 11/05/2026. Mora sozinho. Casa própria de alvenaria, 4 cômodos. Recebe auxílio-doença de R$ 1.400,00. Tem dependência de bebida alcoólica e não está podendo trabalhar por causa do joelho, que precisa de cirurgia.',
            'ceu', TRUE)
    RETURNING id INTO a;
    INSERT INTO triagens (assistida_id, data) VALUES (a, DATE '2026-10-24');
  END IF;

  -- 1455
  IF NOT EXISTS (SELECT 1 FROM assistidas WHERE grupo_id = g AND nome_completo = 'July Isabele Alves de Oliveira') THEN
    INSERT INTO assistidas (grupo_id, nome_completo, telefone, endereco, referencia, observacoes, cor, ativa)
    VALUES (g, 'July Isabele Alves de Oliveira', '(61) 99399-1136',
            'QR 833 Conjunto 04 Casa 15 - Samambaia Norte, Samambaia - DF',
            'Próximo à Escola 831',
            'Família DPS 1455, cadastrada em 19/05/2026. Casa alugada de alvenaria, 3 cômodos, aluguel de R$ 750,00. Recebe Bolsa Família de R$ 600,00. Todos bem de saúde.',
            'esmeralda', TRUE)
    RETURNING id INTO a;
    INSERT INTO familiares (assistida_id, nome, parentesco, idade, ordem) VALUES
      (a, 'Helena Sophia Alves dos Santos', 'Filha', 6, 0);
    INSERT INTO triagens (assistida_id, data) VALUES (a, DATE '2026-10-24');
  END IF;
END $$;
