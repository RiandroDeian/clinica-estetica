export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

// Visão por origem do paciente no ciclo. Popula à medida que os cadastros ganham origem.
export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  if (!inicio || !fim) return NextResponse.json({ erro: "inicio e fim obrigatorios" }, { status: 400 });

  const [pacientesNovos, agendamentos, laserPacotes, pacotes, faturamentos] = await Promise.all([
    supabaseAdmin.from("pacientes").select("id, origem").gte("criado_em", inicio).lt("criado_em", fim),
    supabaseAdmin.from("agendamentos").select("paciente_id, status").gte("inicio", inicio).lt("inicio", fim),
    supabaseAdmin.from("laser_pacotes").select("paciente_id, valor").gte("criado_em", inicio).lt("criado_em", fim),
    supabaseAdmin.from("pacotes").select("paciente_id, valor").gte("comprado_em", inicio).lt("comprado_em", fim),
    supabaseAdmin.from("faturamentos").select("paciente_id, valor_final, status_pagamento").gte("criado_em", inicio).lt("criado_em", fim),
  ]);

  // Mapa paciente -> origem (para todos os pacientes envolvidos no ciclo)
  const idsEnvolvidos = new Set<string>();
  for (const a of agendamentos.data ?? []) if (a.paciente_id) idsEnvolvidos.add(a.paciente_id);
  for (const l of laserPacotes.data ?? []) if (l.paciente_id) idsEnvolvidos.add(l.paciente_id);
  for (const p of pacotes.data ?? []) if (p.paciente_id) idsEnvolvidos.add(p.paciente_id);
  for (const f of faturamentos.data ?? []) if (f.paciente_id) idsEnvolvidos.add(f.paciente_id);

  const origemPorPaciente: Record<string, string> = {};
  if (idsEnvolvidos.size) {
    const { data } = await supabaseAdmin.from("pacientes").select("id, origem").in("id", Array.from(idsEnvolvidos));
    for (const p of data ?? []) origemPorPaciente[p.id] = p.origem || "Não informado";
  }
  const origemDe = (id?: string | null) => (id && origemPorPaciente[id]) || "Não informado";

  type Linha = { origem: string; novos: number; agendados: Set<string>; compareceram: Set<string>; fechamentos: number; valor: number };
  const mapa: Record<string, Linha> = {};
  const get = (o: string) => (mapa[o] ??= { origem: o, novos: 0, agendados: new Set(), compareceram: new Set(), fechamentos: 0, valor: 0 });

  for (const p of pacientesNovos.data ?? []) get(p.origem || "Não informado").novos += 1;
  for (const a of agendamentos.data ?? []) {
    const o = origemDe(a.paciente_id);
    if (a.paciente_id) get(o).agendados.add(a.paciente_id);
    if (a.status === "finalizado" && a.paciente_id) get(o).compareceram.add(a.paciente_id);
  }
  for (const l of laserPacotes.data ?? []) { const o = origemDe(l.paciente_id); get(o).fechamentos += 1; get(o).valor += Number(l.valor ?? 0); }
  for (const p of pacotes.data ?? []) { const o = origemDe(p.paciente_id); get(o).fechamentos += 1; get(o).valor += Number(p.valor ?? 0); }
  for (const f of faturamentos.data ?? []) { if (f.status_pagamento === "pago") { const o = origemDe(f.paciente_id); get(o).valor += Number(f.valor_final ?? 0); } }

  const linhas = Object.values(mapa)
    .map(l => ({
      origem: l.origem,
      novos: l.novos,
      agendados: l.agendados.size,
      compareceram: l.compareceram.size,
      fechamentos: l.fechamentos,
      conversao: l.agendados.size > 0 ? (l.fechamentos / l.agendados.size) * 100 : null,
      valor: l.valor,
    }))
    .sort((a, b) => b.valor - a.valor);

  return NextResponse.json(linhas);
}
