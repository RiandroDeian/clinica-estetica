import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const funcionario_id = searchParams.get("funcionario_id");

  let query = supabaseAdmin
    .from("faturamentos")
    .select("*, pacientes(nome), procedimentos(nome, cor), funcionarios(nome, cor), agendamentos(inicio)")
    .order("criado_em", { ascending: false });

  if (inicio) query = query.gte("criado_em", inicio);
  if (fim) query = query.lte("criado_em", fim);
  if (funcionario_id) query = query.eq("funcionario_id", funcionario_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const registros = data ?? [];
  const totalBruto = registros.filter(r => r.status_pagamento === "pago").reduce((s, r) => s + Number(r.valor_final), 0);
  const totalPendente = registros.filter(r => r.status_pagamento === "pendente").reduce((s, r) => s + Number(r.valor_final), 0);
  const ticketMedio = registros.filter(r => r.status_pagamento === "pago").length > 0
    ? totalBruto / registros.filter(r => r.status_pagamento === "pago").length : 0;

  const porForma: Record<string, number> = {};
  registros.filter(r => r.status_pagamento === "pago").forEach(r => {
    if (r.forma_pagamento) porForma[r.forma_pagamento] = (porForma[r.forma_pagamento] || 0) + Number(r.valor_final);
  });

  const porProcedimento: Record<string, number> = {};
  registros.filter(r => r.status_pagamento === "pago").forEach(r => {
    const nome = r.procedimentos?.nome ?? "Outros";
    porProcedimento[nome] = (porProcedimento[nome] || 0) + Number(r.valor_final);
  });

  return NextResponse.json({
    registros,
    resumo: {
      totalBruto,
      totalPendente,
      ticketMedio,
      totalAtendimentos: registros.filter(r => r.status_pagamento === "pago").length,
      porForma,
      porProcedimento: Object.entries(porProcedimento).sort((a,b) => b[1]-a[1]).slice(0,5).map(([nome,total]) => ({ nome, total })),
    }
  });
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const body = await request.json();
  const valor_final = Number(body.valor) - Number(body.desconto ?? 0);

  const { data, error } = await supabaseAdmin
    .from("faturamentos")
    .insert({ ...body, valor_final, funcionario_id: body.funcionario_id ?? sessao.id })
    .select()
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  if (body.agendamento_id) {
    await supabaseAdmin.from("agendamentos").update({ status: "finalizado" }).eq("id", body.agendamento_id);
  }

  return NextResponse.json(data);
}