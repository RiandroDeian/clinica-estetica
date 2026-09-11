export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

// Histórico dos últimos ciclos. O cliente envia os ciclos já resolvidos (lib/ciclo.ts):
// ?ranges=[{"label":"15/08 → 15/09","inicio":"ISO","fim":"ISO"}, ...]
export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  let ranges: { label: string; inicio: string; fim: string }[] = [];
  try { ranges = JSON.parse(searchParams.get("ranges") || "[]"); } catch { ranges = []; }
  if (!Array.isArray(ranges) || ranges.length === 0) {
    return NextResponse.json({ erro: "ranges obrigatorio" }, { status: 400 });
  }

  const resultado = await Promise.all(ranges.map(async (r) => {
    const inicioDate = r.inicio.slice(0, 10);
    const fimDate = r.fim.slice(0, 10);
    const [lp, pc, fat, parc, sess] = await Promise.all([
      supabaseAdmin.from("laser_pacotes").select("valor").gte("criado_em", r.inicio).lt("criado_em", r.fim),
      supabaseAdmin.from("pacotes").select("valor").gte("comprado_em", r.inicio).lt("comprado_em", r.fim),
      supabaseAdmin.from("faturamentos").select("valor_final, status_pagamento").gte("criado_em", r.inicio).lt("criado_em", r.fim),
      supabaseAdmin.from("laser_parcelas").select("valor").gte("data_pagamento", inicioDate).lt("data_pagamento", fimDate),
      supabaseAdmin.from("laser_sessoes").select("pacote_id").gte("realizada_em", r.inicio).lt("realizada_em", r.fim),
    ]);

    const fechado = (lp.data ?? []).reduce((s, x) => s + Number(x.valor ?? 0), 0)
      + (pc.data ?? []).reduce((s, x) => s + Number(x.valor ?? 0), 0);
    const recebido = (fat.data ?? []).filter(x => x.status_pagamento === "pago").reduce((s, x) => s + Number(x.valor_final ?? 0), 0)
      + (parc.data ?? []).reduce((s, x) => s + Number(x.valor ?? 0), 0);

    let executado = 0;
    const sessoes = sess.data ?? [];
    if (sessoes.length) {
      const ids = Array.from(new Set(sessoes.map(s => s.pacote_id).filter(Boolean)));
      const { data: pcsSess } = await supabaseAdmin.from("laser_pacotes").select("id, valor, total_sessoes").in("id", ids as string[]);
      const mapa: Record<string, number> = {};
      for (const p of pcsSess ?? []) mapa[p.id] = Number(p.valor ?? 0) / ((Number(p.total_sessoes ?? 0)) || 1);
      executado = sessoes.reduce((s, x) => s + (mapa[x.pacote_id] ?? 0), 0);
    }

    return { label: r.label, fechado, recebido, executado };
  }));

  return NextResponse.json(resultado);
}
