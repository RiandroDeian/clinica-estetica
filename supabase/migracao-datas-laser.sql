-- ─────────────────────────────────────────────────────────────
-- Migração — 3 datas no pacote de laser
-- Rode no Supabase → SQL Editor → Run ANTES de usar o novo cadastro.
-- Seguro rodar mais de uma vez.
--
-- Passa a existir "Início do Pacote" (1º atendimento) para todos os pacotes.
-- As colunas de pagamento já existiam:
--   data_inicio  -> agora rotulada "Início do Pagamento" (boleto)
--   data_acerto  -> agora rotulada "Último Pagamento"   (boleto)
-- ─────────────────────────────────────────────────────────────

alter table laser_pacotes
  add column if not exists data_inicio_pacote date;
