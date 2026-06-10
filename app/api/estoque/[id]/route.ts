export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const { tipo, quantidade, motivo, ...itemData } = body;
  if (tipo === "entrada" || tipo === "saida") {
    const { data: item } = await supabaseAdmin.from("estoque").select("quantidade").eq("id", id).single();
    const novaQtd = tipo === "entrada"
      ? Number(item?.quantidade ?? 0) + Number(quantidade)
      : Number(item?.quantidade ?? 0) - Number(quantidade);
    await supabaseAdmin.from("estoque").update({ quantidade: novaQtd }).eq("id", id);
    await supabaseAdmin.from("estoque_movimentacoes").insert({
      estoque_id: id, tipo, quantidade, motivo,
      funcionario_id: sessao.id,
      profissional_nome: body.profissional_nome ?? null,
      paciente_nome: body.paciente_nome ?? null,
      ambiente: body.ambiente ?? "geral",
    });
    return NextResponse.json({ ok: true, quantidade: novaQtd });
  }
  const { data, error } = await supabaseAdmin.from("estoque").update(itemData).eq("id", id).select().single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("estoque")
    .update({
      nome: body.nome,
      categoria: body.categoria || null,
      unidade: body.unidade,
      quantidade_minima: Number(body.quantidade_minima),
      custo_medio: body.custo_medio ? Number(body.custo_medio) : null,
      fornecedor: body.fornecedor || null,
      validade: body.validade || null,
      ambiente: body.ambiente || "geral",
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { id } = await params;
  const { error } = await supabaseAdmin.from("estoque").update({ ativo: false }).eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}