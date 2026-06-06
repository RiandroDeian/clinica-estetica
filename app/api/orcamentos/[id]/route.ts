import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("orcamentos")
    .select("*, pacientes(nome, telefone, cpf), funcionarios(nome)")
    .eq("id", id).single();
  if (error) return NextResponse.json({ erro: "Nao encontrado" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const itens = body.itens ?? [];
  const valor_total = itens.reduce((acc: number, i: any) => acc + (Number(i.preco) * Number(i.quantidade)), 0);
  const desconto    = Number(body.desconto ?? 0);
  const valor_final = valor_total - desconto;

  const { data, error } = await supabaseAdmin
    .from("orcamentos")
    .update({ ...body, itens, valor_total, desconto, valor_final })
    .eq("id", id)
    .select("*, pacientes(nome, telefone), funcionarios(nome)")
    .single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { id } = await params;
  const { error } = await supabaseAdmin.from("orcamentos").delete().eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}