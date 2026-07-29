-- ─────────────────────────────────────────────────────────────
-- Migração — Financeiro Fase 1: custos e repasse no procedimento
-- Rode no Supabase → SQL Editor → Run ANTES do deploy. Seguro rodar de novo.
--
-- custo_materiais: [{ "material": "Luva", "quantidade": 2, "valor": 1.50 }, ...]
--   (valor = custo unitário; custo do item = quantidade × valor; total = soma)
-- repasse_percentual: % que o profissional ganha sobre o valor do procedimento
--   (padrão 25; procedimentos mais lucrativos podem ter %  maior)
-- ─────────────────────────────────────────────────────────────

alter table procedimentos add column if not exists custo_materiais jsonb;
alter table procedimentos add column if not exists repasse_percentual numeric default 25;
