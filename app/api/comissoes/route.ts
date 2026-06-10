export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get("mes") ?? new Date().toISOString().slice(0, 7);
  const inicio = mes + "-01T00:00:00.000Z";
  const fim = new Date(new Date(inicio).setMonth(new Date(inicio).getMonth() + 1)).toISOString();

  const { data: funcionarios } = await supabaseAdmin
    .from("funcionarios")
    .select("id, nome, cargo, cor, comissao_percentual")
    .eq("ativo", true)
    .order("nome");

  const { data: agendamentos } = await supabaseAdmin
    .from("agendamentos")
    .select("*, faturamentos(valor_final, status_pagamento), procedimentos(nome)")
    .eq("status", "finalizado")
    .gte("inicio", inicio)
    .lt("inicio", fim);

  const resultado = (funcionarios ?? []).map(f => {
    const ags = (agendamentos ?? []).filter((a: any) => a.funcionario_id === f.id);
    const totalBruto = ags.reduce((acc: number, a: any) => {
      const fats = Array.isArray(a.faturamentos) ? a.faturamentos : a.faturamentos ? [a.faturamentos] : [];
      return acc + fats.filter((fat: any) => fat.status_pagamento === "pago").reduce((s: number, fat: any) => s + Number(fat.valor_final || 0), 0);
    }, 0);
    const comissao = (totalBruto * (Number(f.comissao_percentual) || 0)) / 100;
    return { ...f, atendimentos: ags.length, total_bruto: totalBruto, comissao_valor: comissao };
  });

  return NextResponse.json(resultado);
}

export async function PATCH(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const body = await request.json();
  const { funcionario_id, comissao_percentual } = body;
  const { data, error } = await supabaseAdmin
    .from("funcionarios")
    .update({ comissao_percentual })
    .eq("id", funcionario_id)
    .select()
    .single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}