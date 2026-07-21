-- ─────────────────────────────────────────────────────────────
-- Migração — Alertas de contato configuráveis por procedimento
-- Rode no Supabase → SQL Editor → Run ANTES do deploy.
-- Seguro rodar mais de uma vez.
--
-- alertas_contato guarda quais alertas de contato (pós-atendimento) aquele
-- procedimento dispara. Ex.: ["24h","48h","72h_feedback","7d"].
-- Lista vazia [] = sem alerta (ex.: Depilação a Laser).
-- (Os retornos por meses continuam em retornos_meses.)
-- ─────────────────────────────────────────────────────────────

alter table procedimentos
  add column if not exists alertas_contato jsonb;

-- Mantém o comportamento atual: procedimentos que já existem seguem com os
-- 4 alertas de contato ligados. Depois é só editar a Depilação a Laser e
-- desmarcar todos.
update procedimentos
  set alertas_contato = '["24h","48h","72h_feedback","7d"]'::jsonb
  where alertas_contato is null;
