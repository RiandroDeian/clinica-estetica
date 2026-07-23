-- ─────────────────────────────────────────────────────────────
-- Migração — Recepção: "Paciente liberado para chamar"
-- Rode no Supabase → SQL Editor → Run ANTES do deploy. Seguro rodar de novo.
--
-- Fluxo: Chegou → (recepção prepara) → LIBERADO (notifica o profissional) →
-- profissional escolhe consultório (Em Atendimento) → Finalizado.
-- ─────────────────────────────────────────────────────────────

alter table agendamentos add column if not exists liberado boolean default false;
alter table agendamentos add column if not exists liberado_em timestamptz;
