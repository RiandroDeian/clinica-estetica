export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

// Pacientes acionáveis AGORA (não depende de ciclo):
// 1) em tratamento sem agendamento futuro
// 2) orçamento enviado sem resposta
// 3) parcela de boleto vencida e não paga
export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const agora = new Date().toISOString();
  const hojeData = agora.slice(0, 10);

  const [laserAtivos, agsFuturos, orcsEnviados, parcelasVencidas] = await Promise.all([
    supabaseAdmin.from("laser_pacotes").select("paciente_id, sessoes_feitas, total_sessoes, pacientes(nome, telefone)").eq("status", "em_tratamento"),
    supabaseAdmin.from("agendamentos").select("paciente_id, status").gte("inicio", agora),
    supabaseAdmin.from("orcamentos").select("id, nome, telefone, valor_final, criado_em, pacientes(nome, telefone)").eq("status", "enviado").order("criado_em", { ascending: true }),
    supabaseAdmin.from("laser_parcelas").select("valor, vencimento, pacote_id").is("data_pagamento", null).lt("vencimento", hojeData).order("vencimento", { ascending: true }),
  ]);

  // 1) sem agendamento futuro
  const comFuturo = new Set((agsFuturos.data ?? []).filter(a => a.status !== "cancelado").map(a => a.paciente_id).filter(Boolean));
  const semAgenda = (laserAtivos.data ?? [])
    .filter((p: any) => (p.sessoes_feitas ?? 0) < (p.total_sessoes ?? 0) && p.paciente_id && !comFuturo.has(p.paciente_id))
    .map((p: any) => ({ nome: p.pacientes?.nome ?? "Paciente", telefone: p.pacientes?.telefone ?? "", info: `${p.sessoes_feitas}/${p.total_sessoes} sessões` }));

  // 2) orçamento enviado sem resposta
  const orcamentos = (orcsEnviados.data ?? []).map((o: any) => ({
    nome: o.pacientes?.nome ?? o.nome ?? "—",
    telefone: o.pacientes?.telefone ?? o.telefone ?? "",
    info: `R$ ${Number(o.valor_final ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · enviado ${new Date(o.criado_em).toLocaleDateString("pt-BR")}`,
  }));

  // 3) parcela vencida e não paga -> paciente do pacote
  let parcelas: any[] = [];
  const vencidas = parcelasVencidas.data ?? [];
  if (vencidas.length) {
    const ids = Array.from(new Set(vencidas.map(p => p.pacote_id).filter(Boolean)));
    const { data: pacs } = await supabaseAdmin.from("laser_pacotes").select("id, pacientes(nome, telefone)").in("id", ids as string[]);
    const pacMap: Record<string, any> = {};
    for (const p of pacs ?? []) pacMap[p.id] = (p as any).pacientes;
    parcelas = vencidas.map((v: any) => ({
      nome: pacMap[v.pacote_id]?.nome ?? "Paciente",
      telefone: pacMap[v.pacote_id]?.telefone ?? "",
      info: `R$ ${Number(v.valor ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · venceu ${new Date(v.vencimento + "T12:00:00").toLocaleDateString("pt-BR")}`,
    }));
  }

  return NextResponse.json({ semAgenda, orcamentos, parcelas });
}
