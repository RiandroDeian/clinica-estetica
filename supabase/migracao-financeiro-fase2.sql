-- ─────────────────────────────────────────────────────────────
-- Migração — Financeiro Fase 2: repasse e custo por pagamento
-- Rode no Supabase → SQL Editor → Run ANTES do deploy. Seguro rodar de novo.
--
-- Ao lançar/finalizar um pagamento, o sistema grava um "retrato" (snapshot):
--   repasse_valor = valor_final × repasse_percentual do procedimento
--   custo_total   = soma dos custos de materiais do procedimento
-- Assim o extrato/lucro/repasse ficam fixos mesmo que o procedimento mude depois.
-- ─────────────────────────────────────────────────────────────

alter table faturamentos add column if not exists repasse_valor numeric;
alter table faturamentos add column if not exists custo_total numeric;
