export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { data, error } = await supabaseAdmin.from("crm_colunas").select("*").order("ordem");
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const body = await request.json();
  const { data: max } = await supabaseAdmin.from("crm_colunas").select("ordem").order("ordem", { ascending: false }).limit(1).single();
  const { data, error } = await supabaseAdmin.from("crm_colunas").insert({ nome: body.nome, cor: body.cor ?? "#c8a078", ordem: (max?.ordem ?? -1) + 1 }).select().single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const body = await request.json();
  const { id, ...updates } = body;
  const { data, error } = await supabaseAdmin.from("crm_colunas").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const { error } = await supabaseAdmin.from("crm_colunas").delete().eq("id", id!);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}