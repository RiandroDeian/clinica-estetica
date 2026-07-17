export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";
import { REGRAS_FOLLOW_UP, regraDevida } from "@/lib/followUps";

// Quantos dias para trás olhamos os atendimentos (a maior janela é 14 dias).
const DIAS_JANELA = 15;

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
    .select("id, inicio, status, paciente_id, pacientes(nome, telefone), procedimentos(nome)")
    .gte("inicio", desde.toISOString())
    .lt("inicio", agora.toISOString())
    .order("inicio", { ascending: false });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  // Atendido = horário já passou e não foi cancelado. Só pacientes cadastrados.
  const atendidos = (ags ?? []).filter(
    (a: any) => a.status !== "cancelado" && a.paciente_id,
  );
  if (atendidos.length === 0) return NextResponse.json({ ativo: true, itens: [] });

  const { data: feitos } = await supabaseAdmin
    .from("follow_ups_feitos")
    .select("agendamento_id, tipo")
    .in("agendamento_id", atendidos.map((a: any) => a.id));

  const jaFeito = new Set((feitos ?? []).map((f: any) => `${f.agendamento_id}:${f.tipo}`));

  const itens = atendidos.flatMap((a: any) => {
    const regra = regraDevida(new Date(a.inicio), agora);
    if (!regra) return [];
    if (jaFeito.has(`${a.id}:${regra.tipo}`)) return [];
    return [{
      agendamento_id: a.id,
      paciente_id:    a.paciente_id,
      paciente_nome:  a.pacientes?.nome ?? "",
      telefone:       a.pacientes?.telefone ?? "",
      procedimento:   a.procedimentos?.nome ?? null,
      atendido_em:    a.inicio,
      tipo:           regra.tipo,
      label:          regra.label,
      icone:          regra.icone,
    }];
  });

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
