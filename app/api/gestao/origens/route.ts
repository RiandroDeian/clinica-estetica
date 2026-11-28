export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

// Lista editável de origens (como o paciente conheceu a clínica), incluindo parceiros.
export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const todos = searchParams.get("todos") === "1";

  let query = supabaseAdmin.from("gestao_origens").select("*").order("ordem", { ascending: true }).order("nome", { ascending: true });
  if (!todos) query = query.eq("ativo", true);
  const { data, error } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const body = await request.json();
  const nome = (body.nome || "").trim();
  if (!nome) return NextResponse.json({ erro: "nome obrigatorio" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("gestao_origens").insert({ nome, ordem: Number(body.ordem) || 99 }).select("*").single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const body = await request.json();
  if (!body.id) return NextResponse.json({ erro: "id obrigatorio" }, { status: 400 });
  const campos: Record<string, unknown> = {};
  if (body.nome !== undefined) campos.nome = String(body.nome).trim();
  if (body.ativo !== undefined) campos.ativo = !!body.ativo;
  if (body.ordem !== undefined) campos.ordem = Number(body.ordem) || 0;
  const { data, error } = await supabaseAdmin.from("gestao_origens").update(campos).eq("id", body.id).select("*").single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ erro: "id obrigatorio" }, { status: 400 });
  const { error } = await supabaseAdmin.from("gestao_origens").delete().eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
