import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessao } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { id } = await params;

  const [paciente, agendamentos, pacotes, anotacoes] = await Promise.all([
    supabaseAdmin.from("pacientes").select("*").eq("id", id).single(),
    supabaseAdmin.from("agendamentos").select("*, procedimentos(nome, cor), funcionarios(nome)").eq("paciente_id", id).order("inicio", { ascending: false }),
    supabaseAdmin.from("pacotes").select("*, procedimentos(nome)").eq("paciente_id", id).order("comprado_em", { ascending: false }),
    supabaseAdmin.from("anotacoes").select("*, funcionarios(nome)").eq("paciente_id", id).order("criado_em", { ascending: false }),
  ]);

  if (paciente.error) return NextResponse.json({ erro: "Paciente nao encontrado" }, { status: 404 });

  return NextResponse.json({
    ...paciente.data,
    agendamentos: agendamentos.data ?? [],
    pacotes: pacotes.data ?? [],
    anotacoes: anotacoes.data ?? [],
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from("pacientes")
    .update(body)
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
  const { error } = await supabaseAdmin.from("pacientes").delete().eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}