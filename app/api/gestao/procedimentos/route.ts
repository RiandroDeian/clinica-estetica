export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

// Ranking de procedimentos no ciclo (por valor vendido).
export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  if (!inicio || !fim) return NextResponse.json({ erro: "inicio e fim obrigatorios" }, { status: 400 });

  const [procs, agendamentos, faturamentos, laserPacotes, laserSessoes] = await Promise.all([
    supabaseAdmin.from("procedimentos").select("id, nome, preco"),
    supabaseAdmin.from("agendamentos").select("procedimento, procedimento_id, status").gte("inicio", inicio).lt("inicio", fim),
    supabaseAdmin.from("faturamentos").select("procedimento_id, valor_final, status_pagamento").gte("criado_em", inicio).lt("criado_em", fim),
    supabaseAdmin.from("laser_pacotes").select("id, procedimento, valor").gte("criado_em", inicio).lt("criado_em", fim),
    supabaseAdmin.from("laser_sessoes").select("pacote_id, realizada_em").gte("realizada_em", inicio).lt("realizada_em", fim),
  ]);

  const nomePorId: Record<string, string> = {};
  for (const p of procs.data ?? []) nomePorId[p.id] = p.nome;

  // acumula por nome de procedimento
  const mapa: Record<string, { nome: string; qtd: number; sessoes: number; valor: number }> = {};
  const get = (nome: string) => (mapa[nome] ??= { nome, qtd: 0, sessoes: 0, valor: 0 });

  // Vendas (qtd) = agendamentos finalizados
  for (const a of agendamentos.data ?? []) {
    if (a.status !== "finalizado") continue;
    const nome = (a.procedimento_id && nomePorId[a.procedimento_id]) || a.procedimento || "Sem procedimento";
    get(nome).qtd += 1;
  }
  // Valor vendido = faturamentos pagos
  for (const f of faturamentos.data ?? []) {
    if (f.status_pagamento !== "pago") continue;
    const nome = (f.procedimento_id && nomePorId[f.procedimento_id]) || "Avulso";
    get(nome).valor += Number(f.valor_final ?? 0);
  }
  // Laser: valor do pacote + sessões
  const valorPorPacote: Record<string, { nome: string }> = {};
  for (const lp of laserPacotes.data ?? []) {
    const nome = lp.procedimento || "Laser";
    get(nome).valor += Number(lp.valor ?? 0);
    get(nome).qtd += 1;
    valorPorPacote[lp.id] = { nome };
  }
  // sessões de laser no ciclo -> conta como "sessões" no procedimento do pacote
  if ((laserSessoes.data ?? []).length) {
    const ids = Array.from(new Set((laserSessoes.data ?? []).map(s => s.pacote_id).filter(Boolean)));
    const faltantes = ids.filter(id => !valorPorPacote[id]);
    if (faltantes.length) {
      const { data } = await supabaseAdmin.from("laser_pacotes").select("id, procedimento").in("id", faltantes as string[]);
      for (const lp of data ?? []) valorPorPacote[lp.id] = { nome: lp.procedimento || "Laser" };
    }
    for (const s of laserSessoes.data ?? []) {
      const nome = valorPorPacote[s.pacote_id]?.nome ?? "Laser";
      get(nome).sessoes += 1;
    }
  }

  const ranking = Object.values(mapa)
    .map(r => ({ ...r, ticket: r.qtd > 0 ? r.valor / r.qtd : null }))
    .sort((a, b) => b.valor - a.valor);

  return NextResponse.json(ranking);
}
