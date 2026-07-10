export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const pacote_id = searchParams.get("pacote_id");
  if (!pacote_id) return NextResponse.json({ erro: "pacote_id obrigatório" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("laser_sessoes")
    .select("*, funcionarios(nome, cor)")
    .eq("pacote_id", pacote_id)
    .order("numero_sessao", { ascending: false });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { pacote_id, observacoes, intercorrencias, data_sessao } = body;

  if (!pacote_id) return NextResponse.json({ erro: "pacote_id obrigatório" }, { status: 400 });

  // Pega o número da próxima sessão
  const { data: pacoteAtual } = await supabaseAdmin
    .from("laser_pacotes")
    .select("sessoes_feitas")
    .eq("id", pacote_id)
    .single();

  const proximaSessao = (pacoteAtual?.sessoes_feitas ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from("laser_sessoes")
    .insert({
      pacote_id,
      paciente_id: body.paciente_id || null,
      funcionario_id: sessao.id,
      numero_sessao: proximaSessao,
      realizada_em: data_sessao ? new Date(data_sessao).toISOString() : new Date().toISOString(),
      observacoes: observacoes || null,
      intercorrencias: intercorrencias || null,
    })
    .select("*, funcionarios(nome, cor)")
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  // Incrementa sessoes_feitas
  await supabaseAdmin
    .from("laser_pacotes")
    .update({ sessoes_feitas: proximaSessao })
    .eq("id", pacote_id);

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const pacote_id = searchParams.get("pacote_id");
  if (!id || !pacote_id) return NextResponse.json({ erro: "id e pacote_id obrigatórios" }, { status: 400 });

  await supabaseAdmin.from("laser_sessoes").delete().eq("id", id);

  const { data: pacoteAtual } = await supabaseAdmin
    .from("laser_pacotes")
    .select("sessoes_feitas")
    .eq("id", pacote_id)
    .single();

  await supabaseAdmin
    .from("laser_pacotes")
    .update({ sessoes_feitas: Math.max(0, (pacoteAtual?.sessoes_feitas ?? 1) - 1) })
    .eq("id", pacote_id);

  return NextResponse.json({ ok: true });
}