export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";
import {
  REGRAS_FOLLOW_UP,
  regraDevida,
  retornoDevido,
  normalizarRetornos,
  alertasContatoDe,
  MAX_MESES_RETORNO,
} from "@/lib/followUps";

// Quantos dias para trás olhamos os atendimentos (a maior janela é 14 dias).
const DIAS_JANELA = 15;

type Item = {
  agendamento_id: string;
  paciente_id: string;
  paciente_nome: string;
  telefone: string;
  procedimento: string | null;
  atendido_em: string;
  tipo: string;
  label: string;
  icone: string;
};

// Retornos configurados por procedimento (ex.: botox 3 e 6 meses).
async function calcularRetornos(agora: Date): Promise<Item[]> {
  const { data: procs } = await supabaseAdmin
    .from("procedimentos")
    .select("id, nome, retornos_meses")
    .not("retornos_meses", "is", null);

  const comRetorno = (procs ?? [])
    .map((p: any) => ({ ...p, meses: normalizarRetornos(p.retornos_meses) }))
    .filter((p: any) => p.meses.length > 0);

  if (comRetorno.length === 0) return [];

  const limite = new Date(agora);
  limite.setMonth(limite.getMonth() - MAX_MESES_RETORNO);

  const { data: ags } = await supabaseAdmin
    .from("agendamentos")
    .select("id, inicio, status, paciente_id, procedimento_id, pacientes(nome, telefone)")
    .in("procedimento_id", comRetorno.map((p: any) => p.id))
    .gte("inicio", limite.toISOString())
    .lt("inicio", agora.toISOString())
    .order("inicio", { ascending: false });

  const validos = (ags ?? []).filter((a: any) => a.status !== "cancelado" && a.paciente_id);
  if (validos.length === 0) return [];

  const porProc = new Map(comRetorno.map((p: any) => [p.id, p]));

  return validos.flatMap((a: any) => {
    const proc = porProc.get(a.procedimento_id);
    if (!proc) return [];
    return proc.meses
      .filter((m: number) => retornoDevido(new Date(a.inicio), m, agora))
      .map((m: number) => ({
        agendamento_id: a.id,
        paciente_id:    a.paciente_id,
        paciente_nome:  a.pacientes?.nome ?? "",
        telefone:       a.pacientes?.telefone ?? "",
        procedimento:   proc.nome,
        atendido_em:    a.inicio,
        tipo:           `retorno_${m}m`,
        label:          `${proc.nome} · ${m} ${m === 1 ? "mês" : "meses"}`,
        icone:          "💉",
      }));
  });
}

export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  // Só quem tem o alerta ligado recebe a lista.
  const { data: func } = await supabaseAdmin
    .from("funcionarios")
    .select("recebe_follow_ups")
    .eq("id", sessao.id)
    .single();

  if (!func?.recebe_follow_ups) {
    return NextResponse.json({ ativo: false, itens: [] });
  }

  const agora = new Date();
  const desde = new Date(agora.getTime() - DIAS_JANELA * 24 * 60 * 60 * 1000);

  const { data: ags, error } = await supabaseAdmin
    .from("agendamentos")
    .select("id, inicio, status, paciente_id, pacientes(nome, telefone), procedimentos(nome, alertas_contato)")
    .gte("inicio", desde.toISOString())
    .lt("inicio", agora.toISOString())
    .order("inicio", { ascending: false });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  // Atendido = horário já passou e não foi cancelado. Só pacientes cadastrados.
  const atendidos = (ags ?? []).filter(
    (a: any) => a.status !== "cancelado" && a.paciente_id,
  );

  // ✅ Só o ATENDIMENTO MAIS RECENTE de cada paciente conta para o contato
  // (zera o ciclo a cada atendimento). `ags` já vem do mais novo para o mais antigo.
  const ultimoPorPaciente = new Map<string, any>();
  for (const a of atendidos) {
    if (!ultimoPorPaciente.has(a.paciente_id)) ultimoPorPaciente.set(a.paciente_id, a);
  }

  // Follow-ups pós-atendimento (24h / 48h / feedback 72h / 7 dias), respeitando
  // os alertas configurados no procedimento (depilação a laser fica sem nenhum).
  const posAtendimento: Item[] = [];
  for (const a of ultimoPorPaciente.values()) {
    const habilitados = alertasContatoDe(a.procedimentos?.alertas_contato);
    const regra = regraDevida(new Date(a.inicio), agora, habilitados);
    if (!regra) continue;
    posAtendimento.push({
      agendamento_id: a.id,
      paciente_id:    a.paciente_id,
      paciente_nome:  a.pacientes?.nome ?? "",
      telefone:       a.pacientes?.telefone ?? "",
      procedimento:   a.procedimentos?.nome ?? null,
      atendido_em:    a.inicio,
      tipo:           regra.tipo,
      label:          regra.label,
      icone:          regra.icone,
    });
  }

  // Retornos configurados por procedimento (botox 3/6 meses, etc.)
  const retornos = await calcularRetornos(agora);

  const candidatos = [...posAtendimento, ...retornos];
  if (candidatos.length === 0) return NextResponse.json({ ativo: true, itens: [] });

  // Remove os que já foram marcados como feitos
  const { data: feitos } = await supabaseAdmin
    .from("follow_ups_feitos")
    .select("agendamento_id, tipo")
    .in("agendamento_id", Array.from(new Set(candidatos.map(c => c.agendamento_id))));

  const jaFeito = new Set((feitos ?? []).map((f: any) => `${f.agendamento_id}:${f.tipo}`));
  const itens = candidatos.filter(c => !jaFeito.has(`${c.agendamento_id}:${c.tipo}`));

  return NextResponse.json({ ativo: true, itens, regras: REGRAS_FOLLOW_UP });
}

// Marca um follow-up como feito (o alerta some da lista).
export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const body = await request.json();
  const { agendamento_id, tipo, paciente_id } = body;
  if (!agendamento_id || !tipo) {
    return NextResponse.json({ erro: "agendamento_id e tipo sao obrigatorios" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("follow_ups_feitos")
    .upsert(
      {
        agendamento_id,
        paciente_id: paciente_id || null,
        tipo,
        funcionario_id: sessao.id,
        feito_em: new Date().toISOString(),
      },
      { onConflict: "agendamento_id,tipo" },
    );

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Desfaz (caso tenha marcado sem querer).
export async function DELETE(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const agendamento_id = searchParams.get("agendamento_id");
  const tipo = searchParams.get("tipo");
  if (!agendamento_id || !tipo) {
    return NextResponse.json({ erro: "agendamento_id e tipo sao obrigatorios" }, { status: 400 });
  }

  await supabaseAdmin
    .from("follow_ups_feitos")
    .delete()
    .eq("agendamento_id", agendamento_id)
    .eq("tipo", tipo);

  return NextResponse.json({ ok: true });
}
