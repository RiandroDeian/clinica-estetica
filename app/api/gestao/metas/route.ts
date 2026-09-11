export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

// Metas vinculadas ao CICLO da clínica (não ao mês-calendário).
export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const ciclo_inicio = searchParams.get("ciclo_inicio"); // "YYYY-MM-DD" (dia 15)

  let query = supabaseAdmin
    .from("gestao_metas")
    .select("*, funcionarios(nome)")
    .order("criado_em", { ascending: false });
  if (ciclo_inicio) query = query.eq("ciclo_inicio", ciclo_inicio);

  const { data, error } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const body = await request.json();
  if (!body.ciclo_inicio || !body.ciclo_fim || !body.indicador) {
    return NextResponse.json({ erro: "ciclo_inicio, ciclo_fim e indicador sao obrigatorios" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin.from("gestao_metas").insert({
    ciclo_inicio: body.ciclo_inicio,
    ciclo_fim: body.ciclo_fim,
    indicador: body.indicador,
    meta_valor: Number(body.meta_valor) || 0,
    responsavel_id: body.responsavel_id || null,
    observacao: body.observacao || null,
  }).select("*, funcionarios(nome)").single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ erro: "id obrigatorio" }, { status: 400 });
  const { error } = await supabaseAdmin.from("gestao_metas").delete().eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
