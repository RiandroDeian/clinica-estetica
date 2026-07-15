export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const sessao = await getSessao();

    if (!sessao) {
      return NextResponse.json(
        { erro: "Nao autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const inicio = searchParams.get("inicio");
    const fim = searchParams.get("fim");

    let query = supabaseAdmin
      .from("faturamentos")
      .select(`
        *,
        pacientes(nome),
        procedimentos(nome, cor),
        funcionarios(nome)
      `)
      .order("criado_em", { ascending: false });

    if (inicio) {
      query = query.gte("criado_em", inicio);
    }

    if (fim) {
      query = query.lte("criado_em", fim);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { erro: error.message },
        { status: 500 }
      );
    }

    const registros = data || [];

    const pagos = registros.filter(
      (r) => r.status_pagamento === "pago"
    );

    const pendentes = registros.filter(
      (r) => r.status_pagamento === "pendente"
    );

    const totalBruto = pagos.reduce(
      (acc, r) => acc + Number(r.valor_final || 0),
      0
    );

    const totalPendente = pendentes.reduce(
      (acc, r) => acc + Number(r.valor_final || 0),
      0
    );

    const ticketMedio =
      pagos.length > 0
        ? totalBruto / pagos.length
        : 0;

    const porForma: Record<string, number> = {};

    pagos.forEach((r) => {
      const forma = r.forma_pagamento || "outro";

      porForma[forma] =
        (porForma[forma] || 0) +
        Number(r.valor_final || 0);
    });

    const procMap: Record<string, number> = {};

    pagos.forEach((r) => {
      const nome =
        r.procedimentos?.nome || "Sem procedimento";

      procMap[nome] =
        (procMap[nome] || 0) +
        Number(r.valor_final || 0);
    });

    const porProcedimento = Object.entries(procMap)
      .map(([nome, total]) => ({
        nome,
        total,
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      registros,
      resumo: {
        totalBruto,
        totalPendente,
        ticketMedio,
        totalAtendimentos: pagos.length,
        porForma,
        porProcedimento,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { erro: "Erro interno" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessao = await getSessao();

    if (!sessao) {
      return NextResponse.json(
        { erro: "Nao autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const valor = Number(body.valor || 0);
    const desconto = Number(body.desconto || 0);

    const valorFinal = valor - desconto;

    const { data, error } = await supabaseAdmin
      .from("faturamentos")
      .insert({
        agendamento_id: body.agendamento_id || null,
        paciente_id: body.paciente_id || null,
        procedimento_id: body.procedimento_id || null,
        funcionario_id: body.funcionario_id || null,

        valor,
        desconto,
        valor_final: valorFinal,

        forma_pagamento: body.forma_pagamento,
        status_pagamento: body.status_pagamento,

        observacoes: body.observacoes || null,
      })
      .select(`
        *,
        pacientes(nome),
        procedimentos(nome, cor),
        funcionarios(nome)
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { erro: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { erro: "Erro interno" },
      { status: 500 }
    );
  }
}