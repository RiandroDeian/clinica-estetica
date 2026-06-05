import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    await supabaseAdmin.from("pacote_procedimentos").delete().eq("pacote_id", id);
    const { error } = await supabaseAdmin.from("pacotes").delete().eq("id", id);
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json({ sucesso: true });
  } catch (err: any) {
    return NextResponse.json({ erro: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const campos: any = {};
    if (body.nome_pacote !== undefined)    campos.nome_pacote    = body.nome_pacote;
    if (body.categoria !== undefined)      campos.categoria      = body.categoria;
    if (body.total_sessoes !== undefined)  campos.total_sessoes  = Number(body.total_sessoes);
    if (body.sessoes_usadas !== undefined) campos.sessoes_usadas = Number(body.sessoes_usadas);
    if (body.sessoes_bonus !== undefined)  campos.sessoes_bonus  = Number(body.sessoes_bonus);
    if (body.valor !== undefined)          campos.valor          = body.valor ? Number(body.valor) : null;
    if (body.validade !== undefined)       campos.validade       = body.validade || null;
    if (body.observacoes !== undefined)    campos.observacoes    = body.observacoes || null;
    if (body.status !== undefined)         campos.status         = body.status;
    const { data, error } = await supabaseAdmin
      .from("pacotes").update(campos).eq("id", id).select().single();
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ erro: err.message }, { status: 500 });
  }
}