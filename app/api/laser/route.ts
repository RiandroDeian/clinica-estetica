export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const busca          = searchParams.get("busca")          ?? "";
  const status         = searchParams.get("status")         ?? "";
  const funcionario_id = searchParams.get("funcionario_id") ?? "";
  const status_pagamento = searchParams.get("status_pagamento") ?? "";
  const categoria      = searchParams.get("categoria")      ?? "";
  const forma_pagamento = searchParams.get("forma_pagamento") ?? "";

  let query = supabaseAdmin
    .from("laser_pacotes")
    .select("*, pacientes(nome, telefone, cpf), funcionarios(nome, cor)")
    .order("criado_em", { ascending: false });

  if (status)          query = query.eq("status", status);
  if (funcionario_id)  query = query.eq("funcionario_id", funcionario_id);
  if (status_pagamento) query = query.eq("status_pagamento", status_pagamento);
  if (categoria)       query = query.eq("categoria", categoria);
  if (forma_pagamento) query = query.eq("forma_pagamento", forma_pagamento);

  const { data, error } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  let lista = data ?? [];
  if (busca) {
    lista = lista.filter((p: any) =>
      p.pacientes?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      p.pacientes?.cpf?.includes(busca)
    );
  }

  // ✅ Anexa o próximo agendamento FUTURO de cada paciente (alerta "sem agendamento futuro")
  const pacienteIds = Array.from(new Set(lista.map((p: any) => p.paciente_id).filter(Boolean)));
  if (pacienteIds.length) {
    const agora = new Date().toISOString();
    const { data: ags } = await supabaseAdmin
      .from("agendamentos")
      .select("paciente_id, inicio, status")
      .in("paciente_id", pacienteIds as string[])
      .gte("inicio", agora)
      .order("inicio", { ascending: true });
    const proximo: Record<string, string> = {};
    for (const a of ags ?? []) {
      if (a.status === "cancelado") continue;          // agendamento cancelado não conta
      if (!proximo[a.paciente_id]) proximo[a.paciente_id] = a.inicio; // o mais próximo
    }
    lista = lista.map((p: any) => ({ ...p, proximo_agendamento: proximo[p.paciente_id] ?? null }));
  }

  const totalPacientes = lista.length;
  const pacotesAtivos  = lista.filter((p: any) => p.status === "em_tratamento").length;
  const sessoesMes     = lista.reduce((s: number, p: any) => s + (p.sessoes_feitas ?? 0), 0);
  const faturamento    = lista
    .filter((p: any) => p.status_pagamento === "pago")
    .reduce((s: number, p: any) => s + Number(p.valor ?? 0), 0);

  const totalPacotes   = lista.filter((p: any) => p.categoria === "Pacote").length;
  const totalGratuitos = lista.filter((p: any) => p.categoria === "Gratuito").length;
  const totalAvulsos   = lista.filter((p: any) => p.categoria === "Avulso").length;
  const totalBoleto    = lista.filter((p: any) => p.forma_pagamento === "boleto").length;

  return NextResponse.json({
    pacotes: lista,
    resumo: {
      totalPacientes,
      pacotesAtivos,
      sessoesMes,
      faturamento,
      totalPacotes,
      totalGratuitos,
      totalAvulsos,
      totalBoleto,
    },
  });
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { areas, categoria, ...dados } = body;

    const payload = {
      ...dados,
      categoria: categoria ?? "Pacote",
      procedimento: Array.isArray(body.procedimento)
        ? body.procedimento.join(", ")
        : Array.isArray(body.areas)
        ? body.areas.join(", ")
        : body.procedimento,
      status: "em_tratamento",
      funcionario_id: body.funcionario_id?.trim() ? body.funcionario_id : sessao.id,
      data_inicio:        body.data_inicio        || null,
      data_inicio_pacote: body.data_inicio_pacote || null,
      data_acerto:      body.data_acerto      || null,
      // ✅ Dia de vencimento do boleto
      dia_vencimento_boleto: body.dia_vencimento_boleto ? Number(body.dia_vencimento_boleto) : null,
      assinou_contrato: body.assinou_contrato ?? false,
    };

    const { data, error } = await supabaseAdmin
      .from("laser_pacotes")
      .insert(payload)
      .select("*, pacientes(nome), funcionarios(nome)")
      .single();

    if (error) return NextResponse.json({ erro: error.message, detalhes: error }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 });
  }
}