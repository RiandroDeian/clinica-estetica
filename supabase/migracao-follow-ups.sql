-- ─────────────────────────────────────────────────────────────
-- Migração — Follow-ups pós-atendimento (24h / 48h / 72h feedback / 7 dias)
-- Rode no Supabase → SQL Editor → Run ANTES do deploy.
-- Seguro rodar mais de uma vez.
-- ─────────────────────────────────────────────────────────────

-- 1) Marca quais follow-ups já foram feitos (para o alerta sair da lista).
--    Um follow-up é único por (agendamento, tipo).
create table if not exists follow_ups_feitos (
  id              uuid primary key default gen_random_uuid(),
  agendamento_id  uuid not null,
  paciente_id     uuid,
  tipo            text not null,          -- '24h' | '48h' | '72h_feedback' | '7d'
  feito_em        timestamptz not null default now(),
  funcionario_id  uuid,
  unique (agendamento_id, tipo)
);

create index if not exists follow_ups_feitos_agendamento_idx
  on follow_ups_feitos (agendamento_id);

-- 2) Quem recebe os alertas de follow-up (ligar para Amanda, Riandro e Luan
--    em Configurações → funcionário → aba Perfil).
alter table funcionarios
  add column if not exists recebe_follow_ups boolean default false;
