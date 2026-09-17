export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

// Resumo diário de captação (preenchido manualmente pela recepção).
// Um registro por DIA. GET filtra pelo período do ciclo.
export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");

  let query = supabaseAdmin.from("gestao_resumo_diario").select("*").order("data", { ascending: false });
  if (inicio) query = query.gte("data", inicio.slice(0, 10));
  if (fim) query = query.lt("data", fim.slice(0, 10));

  const { data, error } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// Upsert por data (salvar o dia; se já existir, atualiza).
export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const body = await request.json();
  if (!body.data) return NextResponse.json({ erro: "data obrigatoria" }, { status: 400 });

  const row = {
    data: body.data,
    contatos_recebidos:   Number(body.contatos_recebidos) || 0,
    contatos_feitos:      Number(body.contatos_feitos) || 0,
    avaliacoes_agendadas: Number(body.avaliacoes_agendadas) || 0,
    avaliacoes_dia:       Number(body.avaliacoes_dia) || 0,
    fechamentos:          Number(body.fechamentos) || 0,
    observacao:           body.observacao || null,
  };

  const { data, error } = await supabaseAdmin
    .from("gestao_resumo_diario")
    .upsert(row, { onConflict: "data" })
    .select("*")
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
  const { error } = await supabaseAdmin.from("gestao_resumo_diario").delete().eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
