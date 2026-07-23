-- ─────────────────────────────────────────────────────────────
-- Migração — Pagamento com várias formas (split)
-- Rode no Supabase → SQL Editor → Run ANTES do deploy. Seguro rodar de novo.
--
-- formas_pagamento guarda a divisão: [{ "forma": "pix", "valor": 100 }, ...]
-- O total (valor / valor_final) é a soma das formas.
-- ─────────────────────────────────────────────────────────────

alter table faturamentos add column if not exists formas_pagamento jsonb;
