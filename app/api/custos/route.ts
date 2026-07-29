export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");

  let query = supabaseAdmin
    .from("custos")
    .select("*, funcionarios(nome)")
    .order("data", { ascending: false });

  if (inicio) query = query.gte("data", inicio.slice(0, 10));
  if (fim) query = query.lte("data", fim.slice(0, 10));

  const { data, error } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const body = await request.json();
  if (!body.descricao || !(Number(body.valor) > 0)) {
    return NextResponse.json({ erro: "Descrição e valor são obrigatórios" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("custos")
    .insert({
      descricao: String(body.descricao).trim(),
      categoria: body.categoria || null,
      valor: Number(body.valor),
      data: body.data || new Date().toISOString().slice(0, 10),
      observacoes: body.observacoes || null,
      funcionario_id: sessao.id,
    })
    .select("*, funcionarios(nome)")
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ erro: "id obrigatorio" }, { status: 400 });
  const { error } = await supabaseAdmin.from("custos").delete().eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
