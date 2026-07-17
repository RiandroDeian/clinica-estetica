-- ─────────────────────────────────────────────────────────────
-- Migração — Contato dos pacientes Gratuitos (laser)
-- Rode no Supabase → SQL Editor → Run ANTES do deploy.
-- Seguro rodar mais de uma vez.
--
-- Registra se já entraram em contato com o paciente gratuito e a data,
-- para poder re-contatar depois de um tempo (ex.: ~2 meses).
-- ─────────────────────────────────────────────────────────────

alter table laser_pacotes
  add column if not exists contatado boolean default false;

alter table laser_pacotes
  add column if not exists contato_em date;
