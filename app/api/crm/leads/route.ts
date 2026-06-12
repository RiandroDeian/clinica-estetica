export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { data, error } = await supabaseAdmin.from("crm_leads").select("*, funcionarios(nome, cor), crm_colunas(nome, cor)").order("criado_em", { ascending: false });
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const body = await request.json();
  const { data, error } = await supabaseAdmin.from("crm_leads").insert({
    nome: body.nome, telefone: body.telefone || null,
    procedimento_interesse: body.procedimento_interesse || null,
    responsavel_id: body.responsavel_id || null,
    coluna_id: body.coluna_id, observacoes: body.observacoes || null,
  }).select("*, funcionarios(nome, cor), crm_colunas(nome, cor)").single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const body = await request.json();
  const { id, coluna_origem_id, ...updates } = body;
  updates.ultima_interacao = new Date().toISOString();
  const { data, error } = await supabaseAdmin.from("crm_leads").update(updates).eq("id", id).select("*, funcionarios(nome, cor), crm_colunas(nome, cor)").single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  if (updates.coluna_id && coluna_origem_id && coluna_origem_id !== updates.coluna_id) {
    await supabaseAdmin.from("crm_historico").insert({ lead_id: id, coluna_origem_id, coluna_destino_id: updates.coluna_id, usuario_id: sessao.id });
  }
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const { error } = await supabaseAdmin.from("crm_leads").delete().eq("id", id!);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}