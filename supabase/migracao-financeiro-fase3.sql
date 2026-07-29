-- ─────────────────────────────────────────────────────────────
-- Migração — Financeiro Fase 3: custos avulsos + extrato
-- Rode no Supabase → SQL Editor → Run ANTES do deploy. Seguro rodar de novo.
--
-- custos = saídas lançadas à mão (aluguel, conta, compra de material geral...).
-- O extrato junta: entradas (pagamentos pagos) + saídas (custo de material,
-- repasse aos profissionais e estes custos avulsos).
-- ─────────────────────────────────────────────────────────────

create table if not exists custos (
  id             uuid primary key default gen_random_uuid(),
  descricao      text not null,
  categoria      text,
  valor          numeric not null default 0,
  data           date not null default current_date,
  funcionario_id uuid,
  observacoes    text,
  criado_em      timestamptz not null default now()
);

create index if not exists custos_data_idx on custos (data);
