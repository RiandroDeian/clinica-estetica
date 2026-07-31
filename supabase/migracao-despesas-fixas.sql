-- ─────────────────────────────────────────────────────────────
-- Migração — Despesas fixas da clínica
-- Rode no Supabase → SQL Editor → Run ANTES do deploy. Seguro rodar de novo.
--
-- Modelos de despesa fixa (internet, contador, aluguel...) com valor fixo.
-- Ao clicar "Registrar", o sistema lança um custo (saída) com esse valor,
-- que cai no extrato/lucro do período.
-- ─────────────────────────────────────────────────────────────

create table if not exists despesas_fixas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  valor      numeric not null default 0,
  categoria  text,
  ativo      boolean default true,
  criado_em  timestamptz not null default now()
);
