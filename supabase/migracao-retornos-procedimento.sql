-- ─────────────────────────────────────────────────────────────
-- Migração — Retornos por procedimento (Fase 2 dos follow-ups)
-- Rode no Supabase → SQL Editor → Run ANTES do deploy.
-- Seguro rodar mais de uma vez.
--
-- Guarda em quais meses após o atendimento deve aparecer o alerta de
-- "entrar em contato" para aquele procedimento. Ex.:
--   botox        -> [3, 6]
--   remodelação  -> [12]
--   (vazio/null) -> não gera alerta
--
-- Configurável na tela: Procedimentos → editar → "Lembrar retorno em (meses)".
-- ─────────────────────────────────────────────────────────────

alter table procedimentos
  add column if not exists retornos_meses jsonb;
