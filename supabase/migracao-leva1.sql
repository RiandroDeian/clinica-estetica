-- ─────────────────────────────────────────────────────────────
-- Migração — Leva 1 (mostrar no site, zerar alerta por procedimento, obs termos)
-- Rode no Supabase → SQL Editor → Run ANTES do deploy. Seguro rodar de novo.
-- ─────────────────────────────────────────────────────────────

-- #10 Procedimentos: aparecer (ou não) no site público
alter table procedimentos add column if not exists mostrar_no_site boolean default true;
update procedimentos set mostrar_no_site = true where mostrar_no_site is null;

-- #2 Procedimentos: se um novo agendamento zera os alertas de contato deste procedimento
alter table procedimentos add column if not exists zerar_por_agendamento boolean default true;
update procedimentos set zerar_por_agendamento = true where zerar_por_agendamento is null;

-- #3 Pacientes: observação de quais termos assinou / faltam
alter table pacientes add column if not exists termos_observacao text;
