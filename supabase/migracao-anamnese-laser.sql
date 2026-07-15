-- ─────────────────────────────────────────────────────────────
-- Migração — Anamnese exclusiva do Laser
-- Rode no Supabase → SQL Editor → Run ANTES do deploy.
-- Seguro rodar mais de uma vez.
--
-- Guarda a ficha de anamnese (versão enxuta do laser) dentro do
-- próprio pacote de laser:
--   anamnese = { queixa_principal, respostas: { chave: { resposta, obs } }, observacoes_gerais }
-- ─────────────────────────────────────────────────────────────

alter table laser_pacotes
  add column if not exists anamnese jsonb;
