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
    supabaseAdmin.from("crm_leads").select("id, nome").gte("criado_em", inicio).lt("criado_em", fim),
    supabaseAdmin.from("agendamentos").select("paciente_id, nome, status").gte("inicio", inicio).lt("inicio", fim),
    supabaseAdmin.from("orcamentos").select("id, nome, status, valor_final, pacientes(nome)").gte("criado_em", inicio).lt("criado_em", fim),
    supabaseAdmin.from("orcamentos").select("id, nome, valor_final, pacientes(nome)").eq("status", "aprovado").gte("data_fechamento", inicioDate).lt("data_fechamento", fimDate),
  ]);

  const ags = agendamentos.data ?? [];
  // dedup por paciente, guardando um nome para o drill
  const agMap = new Map<string, string>();
  const compMap = new Map<string, string>();
  for (const a of ags) {
    if (!a.paciente_id) continue;
    if (!agMap.has(a.paciente_id)) agMap.set(a.paciente_id, a.nome || "Paciente");
    if (a.status === "finalizado" && !compMap.has(a.paciente_id)) compMap.set(a.paciente_id, a.nome || "Paciente");
  }
  const propostas = (orcs.data ?? []).filter(o => o.status !== "rascunho");
  const perdidos = (orcs.data ?? []).filter(o => o.status === "recusado" || o.status === "expirado");
  const fech = fechados.data ?? [];

  const soma = (arr: any[]) => arr.reduce((s, x) => s + Number(x.valor_final ?? 0), 0);
  const nomeOrc = (o: any) => (o.pacientes?.nome || o.nome || "—");
  const money = (v: number) => "R$ " + Number(v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  const drill: Record<string, { nome: string; extra: string }[]> = {
    lead:       (leads.data ?? []).map(l => ({ nome: l.nome || "Lead", extra: "" })),
    agendado:   Array.from(agMap.values()).map(n => ({ nome: n, extra: "" })),
    compareceu: Array.from(compMap.values()).map(n => ({ nome: n, extra: "" })),
    orcamento:  propostas.map(o => ({ nome: nomeOrc(o), extra: money(o.valor_final) })),
    fechado:    fech.map(o => ({ nome: nomeOrc(o), extra: money(o.valor_final) })),
    perdido:    perdidos.map(o => ({ nome: nomeOrc(o), extra: money(o.valor_final) })),
  };

  const etapas = [
    { key: "lead",       label: "Lead",       qtd: (leads.data ?? []).length, valor: 0 },
    { key: "agendado",   label: "Agendado",   qtd: agMap.size,                valor: 0 },
    { key: "compareceu", label: "Compareceu", qtd: compMap.size,              valor: 0 },
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

  return NextResponse.json({ etapas: comConversao, conversaoTotal, valorMovimentado, drill });
}
