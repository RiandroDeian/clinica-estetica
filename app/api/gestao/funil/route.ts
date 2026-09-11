export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

// Funil: Lead → Agendado → Compareceu → Orçamento → Fechado → Perdido.
export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  if (!inicio || !fim) return NextResponse.json({ erro: "inicio e fim obrigatorios" }, { status: 400 });
  const inicioDate = inicio.slice(0, 10);
  const fimDate = fim.slice(0, 10);

  const [leads, agendamentos, orcs, fechados] = await Promise.all([
    supabaseAdmin.from("crm_leads").select("id").gte("criado_em", inicio).lt("criado_em", fim),
    supabaseAdmin.from("agendamentos").select("paciente_id, status").gte("inicio", inicio).lt("inicio", fim),
    supabaseAdmin.from("orcamentos").select("id, status, valor_final").gte("criado_em", inicio).lt("criado_em", fim),
    supabaseAdmin.from("orcamentos").select("id, valor_final").eq("status", "aprovado").gte("data_fechamento", inicioDate).lt("data_fechamento", fimDate),
  ]);

  const ags = agendamentos.data ?? [];
  const agendados = new Set(ags.map(a => a.paciente_id).filter(Boolean));
  const compareceram = new Set(ags.filter(a => a.status === "finalizado").map(a => a.paciente_id).filter(Boolean));
  const propostas = (orcs.data ?? []).filter(o => o.status !== "rascunho");
  const perdidos = (orcs.data ?? []).filter(o => o.status === "recusado" || o.status === "expirado");
  const fech = fechados.data ?? [];

  const soma = (arr: any[]) => arr.reduce((s, x) => s + Number(x.valor_final ?? 0), 0);

  const etapas = [
    { key: "lead",       label: "Lead",       qtd: (leads.data ?? []).length, valor: 0 },
    { key: "agendado",   label: "Agendado",   qtd: agendados.size,            valor: 0 },
    { key: "compareceu", label: "Compareceu", qtd: compareceram.size,         valor: 0 },
    { key: "orcamento",  label: "Orçamento",  qtd: propostas.length,          valor: soma(propostas) },
    { key: "fechado",    label: "Fechado",    qtd: fech.length,               valor: soma(fech) },
    { key: "perdido",    label: "Perdido",    qtd: perdidos.length,           valor: soma(perdidos) },
  ];

  // Conversão entre etapas (topo do funil até "fechado"; "perdido" fica à parte).
  const principais = etapas.filter(e => e.key !== "perdido");
  const comConversao = etapas.map(e => {
    const idx = principais.findIndex(p => p.key === e.key);
    let conversao: number | null = null;
    if (idx > 0) {
      const ant = principais[idx - 1];
      conversao = ant.qtd > 0 ? (e.qtd / ant.qtd) * 100 : null;
    }
    return { ...e, conversao };
  });

  const topo = principais[0]?.qtd ?? 0;
  const fechadoQtd = principais.find(p => p.key === "fechado")?.qtd ?? 0;
  const conversaoTotal = topo > 0 ? (fechadoQtd / topo) * 100 : null;
  const valorMovimentado = soma(propostas);

  return NextResponse.json({ etapas: comConversao, conversaoTotal, valorMovimentado });
}
