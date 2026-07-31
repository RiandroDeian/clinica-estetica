export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from("despesas_fixas")
    .select("*")
    .eq("ativo", true)
    .order("nome");
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const body = await request.json();
  if (!body.nome || !(Number(body.valor) >= 0)) {
    return NextResponse.json({ erro: "Nome e valor são obrigatórios" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("despesas_fixas")
    .insert({
      nome: String(body.nome).trim(),
      valor: Number(body.valor),
      categoria: body.categoria || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { id, ...campos } = await request.json();
  if (!id) return NextResponse.json({ erro: "id obrigatorio" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("despesas_fixas").update(campos).eq("id", id).select().single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ erro: "id obrigatorio" }, { status: 400 });
  // Soft delete (mantém o histórico de custos já registrados)
  const { error } = await supabaseAdmin.from("despesas_fixas").update({ ativo: false }).eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
