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
      // ✅ FIX: categoria estava sendo desestruturada mas nunca incluída no payload
      categoria: categoria ?? "Pacote",
      procedimento: Array.isArray(body.procedimento)
        ? body.procedimento.join(", ")
        : Array.isArray(body.areas)
        ? body.areas.join(", ")
        : body.procedimento,
      status: "em_tratamento",
      funcionario_id: body.funcionario_id?.trim() ? body.funcionario_id : sessao.id,
      data_acerto:      body.data_acerto      || null,
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