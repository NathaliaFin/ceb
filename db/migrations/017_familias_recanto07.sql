-- Cadastro das 3 primeiras familias do Recanto07, pelas fichas da DPS (1461,
-- 1484 e 1487). Cada uma entrou no programa num mes diferente, e a triagem e o
-- dia de visita daquele mes: 25/07, 26/09 e 24/10 de 2026.
-- O grupo e procurado pelo endereco sem hifen ("recanto07" ou "recanto-07").
-- Se ele nao existir, nada e gravado, mas o deploy segue: um erro aqui
-- derrubaria o app de todos os grupos. Familia ja cadastrada (mesmo nome) e pulada.
DO $$
DECLARE
  g  INTEGER;
  a  INTEGER;
BEGIN
  SELECT id INTO g FROM grupos WHERE replace(slug, '-', '') = 'recanto07';
  IF g IS NULL THEN
    RAISE NOTICE 'grupo recanto07 nao encontrado: familias nao cadastradas';
    RETURN;
  END IF;

  -- 1461
  IF NOT EXISTS (SELECT 1 FROM assistidas WHERE grupo_id = g AND nome_completo = 'Maria de Fátima Pereira de Sousa') THEN
    INSERT INTO assistidas (grupo_id, nome_completo, telefone, endereco, referencia, observacoes, cor, ativa)
    VALUES (g, 'Maria de Fátima Pereira de Sousa', '(61) 98324-2679',
            'Quadra 509 Conjunto 07 Casa 30 - Recanto das Emas, DF',
            'Próximo ao Supermercado Manos',
            'Família DPS 1461, cadastrada em 03/06/2026. Casa própria de alvenaria, 5 cômodos. Recebe Bolsa Família de R$ 700,00 e pensão dos filhos de R$ 320,00. Todos com boas condições de saúde.',
            'terracota', TRUE)
    RETURNING id INTO a;
    INSERT INTO familiares (assistida_id, nome, parentesco, idade, observacao, ordem) VALUES
      (a, 'Raissa Rocha de Sousa', 'Filha', 17, 'Estudando', 0),
      (a, 'Ryan Rocha de Sousa', 'Filho', 14, 'Estudando', 1),
      (a, 'Bruno Pereira de Sousa', 'Filho', 30, 'Preso no momento', 2);
    INSERT INTO triagens (assistida_id, data) VALUES (a, DATE '2026-07-25');
  END IF;

  -- 1484
  IF NOT EXISTS (SELECT 1 FROM assistidas WHERE grupo_id = g AND nome_completo = 'Benvinda Pereira da Silva') THEN
    INSERT INTO assistidas (grupo_id, nome_completo, telefone, endereco, referencia, observacoes, cor, ativa)
    VALUES (g, 'Benvinda Pereira da Silva', '(61) 99386-7016',
            'Residencial Tamanduá Quadra 07 Conjunto B Lote 25 - Recanto das Emas, DF',
            'Próximo ao batalhão',
            'Família DPS 1484, cadastrada em 08/09/2026. Casa própria de alvenaria, 5 cômodos. Recebe Bolsa Família. Benvinda tem trombose, depressão e ansiedade.',
            'ambar', TRUE)
    RETURNING id INTO a;
    INSERT INTO familiares (assistida_id, nome, parentesco, idade, observacao, ordem) VALUES
      (a, 'Gabriel Leon Moreira Santana', 'Neto', 19, 'Estudando', 0);
    INSERT INTO triagens (assistida_id, data) VALUES (a, DATE '2026-09-26');
  END IF;

  -- 1487
  IF NOT EXISTS (SELECT 1 FROM assistidas WHERE grupo_id = g AND nome_completo = 'Jonathan Duarte dos Reis Carvalho') THEN
    INSERT INTO assistidas (grupo_id, nome_completo, telefone, endereco, referencia, observacoes, cor, ativa)
    VALUES (g, 'Jonathan Duarte dos Reis Carvalho', '(61) 98412-5652',
            'Quadra 105 Conjunto 05 Lote 03 - Recanto das Emas, DF',
            'Próximo ao Mercado Atacadão',
            'Família DPS 1487, cadastrada em 10/09/2026. Casa própria de alvenaria, 5 cômodos. Sem renda fixa: Jonathan e Juliana fazem bicos. Jonathan tem HIV positivo e faz tratamento no CAPS por alcoolismo. Segundo telefone: (61) 98189-1947.',
            'ceu', TRUE)
    RETURNING id INTO a;
    INSERT INTO familiares (assistida_id, nome, parentesco, idade, ordem) VALUES
      (a, 'Juliana da Costa Duarte', 'Irmã', 35, 0);
    INSERT INTO triagens (assistida_id, data) VALUES (a, DATE '2026-10-24');
  END IF;
END $$;
