import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const hoje = new Date();
  const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();
  const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59).toISOString();

  const [pacientes, agendamentosHoje, proximosAgendamentos, procedimentos] = await Promise.all([
    supabaseAdmin.from("pacientes").select("id", { count: "exact" }),
    supabaseAdmin.from("agendamentos").select("*, pacientes(nome), procedimentos(nome, cor)").gte("inicio", inicioDia).lte("inicio", fimDia).order("inicio"),
    supabaseAdmin.from("agendamentos").select("*, pacientes(nome), procedimentos(nome, cor)").gte("inicio", new Date().toISOString()).order("inicio").limit(5),
    supabaseAdmin.from("agendamentos").select("procedimentos(nome)").eq("status", "finalizado"),
  ]);

  const contadorProcedimentos: Record<string, number> = {};
  procedimentos.data?.forEach((a: any) => {
    const nome = a.procedimentos?.nome;
    if (nome) contadorProcedimentos[nome] = (contadorProcedimentos[nome] || 0) + 1;
  });
  const topProcedimentos = Object.entries(contadorProcedimentos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, total]) => ({ nome, total }));

  return NextResponse.json({
    totalPacientes: pacientes.count ?? 0,
    agendamentosHoje: agendamentosHoje.data ?? [],
    proximosAgendamentos: proximosAgendamentos.data ?? [],
    topProcedimentos,
  });
}