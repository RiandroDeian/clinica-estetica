export const dynamic = "force-dynamic";
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

  const patch: any = { ...body };
  // Só recalcula os valores quando os itens forem realmente enviados (edição do
  // orçamento). Numa troca de status (sem itens) preserva os valores existentes.
  if (body.itens !== undefined) {
    const itens = body.itens ?? [];
    patch.itens = itens;
    patch.valor_total = itens.reduce((acc: number, i: any) => acc + (Number(i.preco) * Number(i.quantidade)), 0);
    patch.desconto = Number(body.desconto ?? 0);
    patch.valor_final = patch.valor_total - patch.desconto;
  }
  // A data de fechamento (quando aprovado) determina o ciclo da venda.
  if (body.status === "aprovado" && !body.data_fechamento) {
    patch.data_fechamento = new Date().toISOString().slice(0, 10);
  }

  const { data, error } = await supabaseAdmin
    .from("orcamentos")
    .update(patch)
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