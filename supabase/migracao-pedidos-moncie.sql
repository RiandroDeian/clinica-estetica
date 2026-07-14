-- ─────────────────────────────────────────────────────────────
-- Migração — pedidos da clínica Moncié
-- Rode este script no Supabase → SQL Editor ANTES de usar as novas
-- funcionalidades de boleto (valor mensal) e da nova anamnese.
-- É seguro rodar mais de uma vez (usa IF NOT EXISTS).
-- ─────────────────────────────────────────────────────────────

-- 1) Laser: valor mensal / parcela do boleto
--    (o campo "valor" continua sendo o valor total do pacote)
alter table laser_pacotes
  add column if not exists valor_mensal numeric;

-- 2) Anamnese estruturada (Ficha de Anamnese Facial)
--    respostas = { chave: { resposta: "sim"|"nao", obs: "texto" } }
alter table prontuario_anamneses
  add column if not exists respostas jsonb;

alter table prontuario_anamneses
  add column if not exists observacoes_gerais text;
