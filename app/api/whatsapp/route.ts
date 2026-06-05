import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

const TEMPLATES = {
  confirmacao: (nome: string, data: string, hora: string, proc: string) =>
    `Ola ${nome}! Seu agendamento de *${proc}* esta confirmado para *${data}* as *${hora}*. Aguardamos voce! - Moncie Esthetique`,
  lembrete_dia: (nome: string, hora: string, proc: string) =>
    `Ola ${nome}! Lembrando que amanha voce tem *${proc}* as *${hora}*. Ate amanha! - Moncie Esthetique`,
  lembrete_hora: (nome: string, hora: string) =>
    `Ola ${nome}! Seu atendimento comeca em 1 hora, as *${hora}*. Estamos te esperando! - Moncie Esthetique`,
  cancelamento: (nome: string, data: string) =>
    `Ola ${nome}! Seu agendamento do dia *${data}* foi cancelado. Entre em contato para reagendar. - Moncie Esthetique`,
  pos_atendimento: (nome: string, proc: string) =>
    `Ola ${nome}! Esperamos que tenha gostado do *${proc}*. Sua opiniao e importante para nos! - Moncie Esthetique`,
};

export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from("whatsapp_logs")
    .select("*, pacientes(nome, telefone), agendamentos(inicio)")
    .order("criado_em", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ logs: data ?? [], templates: TEMPLATES });
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { paciente_id, agendamento_id, tipo, mensagem_custom } = await request.json();
  const { data: paciente } = await supabaseAdmin.from("pacientes").select("nome, telefone").eq("id", paciente_id).single();
  const { data: ag } = agendamento_id
    ? await supabaseAdmin.from("agendamentos").select("inicio, procedimentos(nome)").eq("id", agendamento_id).single()
    : { data: null };
  const nome = paciente?.nome?.split(" ")[0] ?? "Paciente";
  const data_ag = ag?.inicio ? new Date(ag.inicio).toLocaleDateString("pt-BR") : "";
  const hora_ag = ag?.inicio ? new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
  const proc = (ag as any)?.procedimentos?.nome ?? "";
  let mensagem = mensagem_custom;
  if (!mensagem) {
    if (tipo === "confirmacao") mensagem = TEMPLATES.confirmacao(nome, data_ag, hora_ag, proc);
    else if (tipo === "lembrete_dia") mensagem = TEMPLATES.lembrete_dia(nome, hora_ag, proc);
    else if (tipo === "lembrete_hora") mensagem = TEMPLATES.lembrete_hora(nome, hora_ag);
    else if (tipo === "cancelamento") mensagem = TEMPLATES.cancelamento(nome, data_ag);
    else if (tipo === "pos_atendimento") mensagem = TEMPLATES.pos_atendimento(nome, proc);
  }
  const telefone = paciente?.telefone?.replace(/\D/g, "");
  const link = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
  await supabaseAdmin.from("whatsapp_logs").insert({
    paciente_id, agendamento_id, tipo, mensagem, status: "enviado"
  });
  return NextResponse.json({ ok: true, link, mensagem });
}

export async function DELETE(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { id } = await request.json();
  if (!id) return NextResponse.json({ erro: "ID obrigatorio" }, { status: 400 });
  const { error } = await supabaseAdmin.from("whatsapp_logs").delete().eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
