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

  const [paciente, agendamentos, anotacoes, avaliacoes, faturamentos, pacotes, consultas, anamneses, prescricoes, exames] = await Promise.all([
    supabaseAdmin.from("pacientes").select("*").eq("id", paciente_id).single(),
    supabaseAdmin.from("agendamentos").select("*, procedimentos(nome, cor), funcionarios(nome)").eq("paciente_id", paciente_id).order("inicio", { ascending: false }),
    supabaseAdmin.from("anotacoes").select("*, funcionarios(nome)").eq("paciente_id", paciente_id).order("criado_em", { ascending: false }),
    supabaseAdmin.from("avaliacoes").select("*").eq("paciente_id", paciente_id).order("criado_em", { ascending: false }),
    supabaseAdmin.from("faturamentos").select("*").eq("paciente_id", paciente_id).order("criado_em", { ascending: false }),
    supabaseAdmin.from("pacotes").select("*, procedimentos(nome)").eq("paciente_id", paciente_id).order("comprado_em", { ascending: false }),
    supabaseAdmin.from("prontuario_consultas").select("*, funcionarios(nome)").eq("paciente_id", paciente_id).order("criado_em", { ascending: false }),
    supabaseAdmin.from("prontuario_anamneses").select("*, funcionarios(nome)").eq("paciente_id", paciente_id).order("criado_em", { ascending: false }),
    supabaseAdmin.from("prontuario_prescricoes").select("*, funcionarios(nome)").eq("paciente_id", paciente_id).order("criado_em", { ascending: false }),
    supabaseAdmin.from("prontuario_exames").select("*, funcionarios(nome)").eq("paciente_id", paciente_id).order("criado_em", { ascending: false }),
    supabaseAdmin.from("prontuario_fotos").select("*, funcionarios(nome)").eq("paciente_id", paciente_id).order("criado_em", { ascending: false }),
  ]);

  if (paciente.error) return NextResponse.json({ erro: "Paciente nao encontrado" }, { status: 404 });

  return NextResponse.json({
    paciente: paciente.data,
    agendamentos: agendamentos.data ?? [],
    anotacoes: anotacoes.data ?? [],
    avaliacoes: avaliacoes.data ?? [],
    faturamentos: faturamentos.data ?? [],
    pacotes: pacotes.data ?? [],
    consultas: consultas.data ?? [],
    anamneses: anamneses.data ?? [],
    prescricoes: prescricoes.data ?? [],
    exames: exames.data ?? [],
    fotos: (await supabaseAdmin.from("prontuario_fotos").select("*, funcionarios(nome)").eq("paciente_id", paciente_id).order("criado_em", { ascending: false })).data ?? [],
  });
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const body = await request.json();
  const { acao, paciente_id } = body;

  if (acao === "anotacao") {
    const { data, error } = await supabaseAdmin.from("anotacoes").insert({
      paciente_id, funcionario_id: sessao.id,
      conteudo: body.conteudo, tipo: body.tipo ?? "geral", titulo: body.titulo || null,
    }).select("*, funcionarios(nome)").single();
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (acao === "consulta") {
    const { data, error } = await supabaseAdmin.from("prontuario_consultas").insert({
      paciente_id, funcionario_id: sessao.id,
      tipo: body.tipo, titulo: body.titulo || null,
      descricao: body.descricao || null,
      procedimento_realizado: body.procedimento_realizado || null,
    }).select("*, funcionarios(nome)").single();
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (acao === "anamnese") {
    const { data, error } = await supabaseAdmin.from("prontuario_anamneses").insert({
      paciente_id, funcionario_id: sessao.id,
      respostas: body.respostas ?? null,
      observacoes_gerais: body.observacoes_gerais || null,
      // Campos antigos (mantidos para compatibilidade com anamneses anteriores)
      queixa_principal: body.queixa_principal || null,
      historia_doenca: body.historia_doenca || null,
      antecedentes: body.antecedentes || null,
      habitos: body.habitos || null,
    }).select("*, funcionarios(nome)").single();
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (acao === "prescricao") {
    const { data, error } = await supabaseAdmin.from("prontuario_prescricoes").insert({
      paciente_id, funcionario_id: sessao.id,
      medicamento: body.medicamento,
      dosagem: body.dosagem || null,
      frequencia: body.frequencia || null,
      duracao: body.duracao || null,
      observacoes: body.observacoes || null,
    }).select("*, funcionarios(nome)").single();
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (acao === "foto") {
    const { data, error } = await supabaseAdmin.from("prontuario_fotos").insert({
      paciente_id, funcionario_id: sessao.id,
      tipo: body.tipo ?? "antes",
      descricao: body.descricao || null,
      url: body.url,
    }).select("*, funcionarios(nome)").single();
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (acao === "exame") {
    const { data, error } = await supabaseAdmin.from("prontuario_exames").insert({
      paciente_id, funcionario_id: sessao.id,
      tipo_exame: body.tipo_exame,
      resultado: body.resultado || null,
      observacoes: body.observacoes || null,
    }).select("*, funcionarios(nome)").single();
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (acao === "atualizar_paciente") {
    const { data, error } = await supabaseAdmin.from("pacientes").update({
      alergias: body.alergias, contraindicacoes: body.contraindicacoes,
      medicamentos: body.medicamentos, historico_medico: body.historico_medico,
      tipo_sanguineo: body.tipo_sanguineo, observacoes: body.observacoes,
      fumante: body.fumante, gravida: body.gravida, amamentando: body.amamentando,
    }).eq("id", paciente_id).select().single();
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ erro: "Acao invalida" }, { status: 400 });
}