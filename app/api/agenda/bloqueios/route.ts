export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const funcionario_id = searchParams.get("funcionario_id");
  let query = supabaseAdmin.from("agenda_bloqueios").select("*, funcionarios(nome, cor)").order("data_inicio");
  if (funcionario_id) query = query.eq("funcionario_id", funcionario_id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const body = await request.json();
  const { data, error } = await supabaseAdmin.from("agenda_bloqueios").insert({
    funcionario_id: body.funcionario_id || null,
    data_inicio: body.data_inicio,
    data_fim: body.data_fim,
    motivo: body.motivo || "Bloqueado",
    tipo: body.tipo || "geral",
  }).select("*, funcionarios(nome, cor)").single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const { error } = await supabaseAdmin.from("agenda_bloqueios").delete().eq("id", id!);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}