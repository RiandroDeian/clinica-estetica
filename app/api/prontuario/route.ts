export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const paciente_id = searchParams.get("paciente_id");
  if (!paciente_id) return NextResponse.json({ erro: "paciente_id obrigatorio" }, { status: 400 });

  const [paciente, agendamentos, anotacoes, avaliacoes, faturamentos, pacotes, laser] = await Promise.all([
    supabaseAdmin.from("pacientes").select("*").eq("id", paciente_id).single(),
    supabaseAdmin.from("agendamentos").select("*, procedimentos(nome, cor), funcionarios(nome)").eq("paciente_id", paciente_id).order("inicio", { ascending: false }),
    supabaseAdmin.from("anotacoes").select("*, funcionarios(nome)").eq("paciente_id", paciente_id).order("criado_em", { ascending: false }),
    supabaseAdmin.from("avaliacoes").select("*").eq("paciente_id", paciente_id).order("criado_em", { ascending: false }),
    supabaseAdmin.from("faturamentos").select("*").eq("paciente_id", paciente_id).order("criado_em", { ascending: false }),
    supabaseAdmin.from("pacotes").select("*, procedimentos(nome)").eq("paciente_id", paciente_id).order("comprado_em", { ascending: false }),
    supabaseAdmin.from("laser_pacotes").select("*, laser_sessoes(*)").eq("paciente_id", paciente_id).order("criado_em", { ascending: false }),
  ]);

  if (paciente.error) return NextResponse.json({ erro: "Paciente nao encontrado" }, { status: 404 });

  return NextResponse.json({
    paciente: paciente.data,
    agendamentos: agendamentos.data ?? [],
    anotacoes: anotacoes.data ?? [],
    avaliacoes: avaliacoes.data ?? [],
    faturamentos: faturamentos.data ?? [],
    pacotes: pacotes.data ?? [],
    laser: laser.data ?? [],
  });
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const body = await request.json();
  const { acao } = body;

  if (acao === "anotacao") {
    const { data, error } = await supabaseAdmin.from("anotacoes").insert({
      paciente_id: body.paciente_id,
      funcionario_id: sessao.id,
      conteudo: body.conteudo,
      tipo: body.tipo ?? "geral",
      titulo: body.titulo ?? null,
    }).select("*, funcionarios(nome)").single();
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (acao === "atualizar_paciente") {
    const { data, error } = await supabaseAdmin.from("pacientes").update({
      alergias: body.alergias,
      contraindicacoes: body.contraindicacoes,
      medicamentos: body.medicamentos,
      historico_medico: body.historico_medico,
      tipo_sanguineo: body.tipo_sanguineo,
      fumante: body.fumante,
      gravida: body.gravida,
      amamentando: body.amamentando,
      observacoes: body.observacoes,
    }).eq("id", body.paciente_id).select().single();
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ erro: "Acao invalida" }, { status: 400 });
}
