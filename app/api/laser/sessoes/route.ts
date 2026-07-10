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
    .order("data_sessao", { ascending: false });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { pacote_id, paciente_id, areas_tratadas, observacoes, reacoes, data_sessao } = body;

  if (!pacote_id) return NextResponse.json({ erro: "pacote_id obrigatório" }, { status: 400 });

  // Insere a sessão
  const { data, error } = await supabaseAdmin
    .from("laser_sessoes")
    .insert({
      pacote_id,
      paciente_id: paciente_id || null,
      funcionario_id: sessao.id,
      data_sessao: data_sessao || new Date().toISOString(),
      areas_tratadas: areas_tratadas || null,
      observacoes: observacoes || null,
      reacoes: reacoes || null,
    })
    .select("*, funcionarios(nome, cor)")
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  // Incrementa sessoes_feitas no pacote
  const { data: pacoteAtual } = await supabaseAdmin
    .from("laser_pacotes")
    .select("sessoes_feitas")
    .eq("id", pacote_id)
    .single();

  await supabaseAdmin
    .from("laser_pacotes")
    .update({ sessoes_feitas: (pacoteAtual?.sessoes_feitas ?? 0) + 1 })
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

  // Decrementa sessoes_feitas
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