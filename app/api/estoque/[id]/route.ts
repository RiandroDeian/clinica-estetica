export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessao = await getSessao();
    if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("estoque")
      .update({
        nome:               body.nome,
        categoria:          body.categoria || null,
        quantidade:         Number(body.quantidade),
        unidade:            body.unidade,
        quantidade_minima:  Number(body.quantidade_minima),
        custo_medio:        body.custo_medio ? Number(body.custo_medio) : null,
        fornecedor:         body.fornecedor || null,
        validade:           body.validade || null,
        ambiente:           body.ambiente || "geral",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessao = await getSessao();
    if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const { tipo, quantidade, motivo, profissional_nome, paciente_nome, ambiente } = body;

    // Busca quantidade atual
    const { data: item } = await supabaseAdmin
      .from("estoque")
      .select("quantidade, unidade")
      .eq("id", id)
      .single();

    if (!item) return NextResponse.json({ erro: "Item não encontrado" }, { status: 404 });

    const novaQtd = tipo === "entrada"
      ? item.quantidade + Number(quantidade)
      : item.quantidade - Number(quantidade);

    if (novaQtd < 0) return NextResponse.json({ erro: "Quantidade insuficiente" }, { status: 400 });

    // Atualiza quantidade
    await supabaseAdmin
      .from("estoque")
      .update({ quantidade: novaQtd })
      .eq("id", id);

    // Registra movimentação no histórico.
    // ⚠️ A tabela é "estoque_movimentacoes" (é dela que o histórico lê).
    // Antes gravava em "estoque_historico", que não existe — e sem checar o
    // erro, a movimentação sumia silenciosamente do histórico.
    const { error: erroHist } = await supabaseAdmin
      .from("estoque_movimentacoes")
      .insert({
        estoque_id:        id,
        tipo,
        quantidade:        Number(quantidade),
        motivo:            motivo || null,
        profissional_nome: profissional_nome || null,
        paciente_nome:     paciente_nome || null,
        ambiente:          ambiente || "geral",
        funcionario_id:    sessao.id,
      });

    if (erroHist) {
      return NextResponse.json(
        { erro: "Quantidade atualizada, mas falhou ao registrar no histórico: " + erroHist.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, quantidade: novaQtd });
  } catch {
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessao = await getSessao();
    if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

    const { error } = await supabaseAdmin
      .from("estoque")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 });
  }
}