export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("laser_pacotes")
    .select("*, pacientes(nome, telefone, cpf), funcionarios(nome, cor)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const body = await request.json();

  const atualizacao: Record<string, any> = {};
  if (body.procedimento     !== undefined) atualizacao.procedimento     = Array.isArray(body.procedimento) ? body.procedimento.join(", ") : body.procedimento;
  if (body.areas            !== undefined) atualizacao.procedimento     = Array.isArray(body.areas) ? body.areas.join(", ") : body.areas;
  if (body.categoria        !== undefined) atualizacao.categoria        = body.categoria;
  if (body.total_sessoes    !== undefined) atualizacao.total_sessoes    = body.total_sessoes;
  if (body.valor            !== undefined) atualizacao.valor            = body.valor;
  if (body.valor_mensal     !== undefined) atualizacao.valor_mensal     = body.valor_mensal;
  if (body.forma_pagamento  !== undefined) atualizacao.forma_pagamento  = body.forma_pagamento;
  if (body.status_pagamento !== undefined) atualizacao.status_pagamento = body.status_pagamento;
  if (body.status           !== undefined) atualizacao.status           = body.status;
  if (body.data_inicio        !== undefined) atualizacao.data_inicio        = body.data_inicio || null;
  if (body.data_inicio_pacote !== undefined) atualizacao.data_inicio_pacote = body.data_inicio_pacote || null;
  if (body.data_acerto      !== undefined) atualizacao.data_acerto      = body.data_acerto || null;
  // ✅ Dia de vencimento do boleto
  if (body.dia_vencimento_boleto !== undefined) atualizacao.dia_vencimento_boleto = body.dia_vencimento_boleto ? Number(body.dia_vencimento_boleto) : null;
  if (body.assinou_contrato !== undefined) atualizacao.assinou_contrato = body.assinou_contrato;
  if (body.assinou_termo    !== undefined) atualizacao.assinou_termo    = body.assinou_termo;
  if (body.observacoes      !== undefined) atualizacao.observacoes      = body.observacoes;
  if (body.funcionario_id   !== undefined) atualizacao.funcionario_id   = body.funcionario_id || null;
  if (body.sessoes_feitas   !== undefined) atualizacao.sessoes_feitas   = body.sessoes_feitas;

  const { data, error } = await supabaseAdmin
    .from("laser_pacotes")
    .update(atualizacao)
    .eq("id", id)
    .select("*, pacientes(nome, telefone, cpf), funcionarios(nome, cor)")
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { error } = await supabaseAdmin
    .from("laser_pacotes")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}