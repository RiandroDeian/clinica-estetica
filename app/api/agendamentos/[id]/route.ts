export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";
import { registrarLog } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("agendamentos")
    .select("*, pacientes(nome, telefone), procedimentos(nome, cor, duracao_minutos), funcionarios(nome, cor)")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessao = await getSessao();
    if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

    const body = await request.json();

    // ✅ Permite editar procedimento, profissional, status, datas e observações
    const atualizacao: Record<string, any> = {};
    if (body.status      !== undefined) atualizacao.status       = body.status;
    if (body.observacoes !== undefined) atualizacao.observacoes  = body.observacoes;
    if (body.inicio      !== undefined) atualizacao.inicio       = body.inicio;
    if (body.fim         !== undefined) atualizacao.fim          = body.fim;
    if (body.procedimento_id !== undefined) atualizacao.procedimento_id = body.procedimento_id || null;
    if (body.funcionario_id  !== undefined) atualizacao.funcionario_id  = body.funcionario_id  || null;

    const anterior = await supabaseAdmin
      .from("agendamentos")
      .select("*")
      .eq("id", params.id)
      .single();

    const { data, error } = await supabaseAdmin
      .from("agendamentos")
      .update(atualizacao)
      .eq("id", params.id)
      .select("*, pacientes(nome, telefone), procedimentos(nome, cor), funcionarios(nome, cor)")
      .single();

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

    await registrarLog(
      sessao, "editar", "agendamentos", params.id,
      `Editou agendamento de ${data.pacientes?.nome ?? data.nome_temporario ?? "paciente"}`,
      anterior.data, data
    );

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessao = await getSessao();
    if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

    const anterior = await supabaseAdmin
      .from("agendamentos")
      .select("*, pacientes(nome)")
      .eq("id", params.id)
      .single();

    const { error } = await supabaseAdmin
      .from("agendamentos")
      .delete()
      .eq("id", params.id);

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

    await registrarLog(
      sessao, "excluir", "agendamentos", params.id,
      `Excluiu agendamento de ${anterior.data?.pacientes?.nome ?? "paciente"}`,
      anterior.data, null
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 });
  }
}