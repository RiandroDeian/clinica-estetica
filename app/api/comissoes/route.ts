export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get("mes") ?? new Date().toISOString().slice(0, 7);
  const inicio = mes + "-01T00:00:00.000Z";
  const fim = new Date(new Date(inicio).setMonth(new Date(inicio).getMonth() + 1)).toISOString();

  const [funcRes, agRes, pagRes] = await Promise.all([
    supabaseAdmin.from("funcionarios").select("id, nome, cargo, cor, comissao_percentual, meta_mensal").eq("ativo", true).order("nome"),
    supabaseAdmin.from("agendamentos").select("funcionario_id, inicio, faturamentos(valor_final, status_pagamento), procedimentos(nome)").eq("status", "finalizado").gte("inicio", inicio).lt("inicio", fim),
    supabaseAdmin.from("comissoes_pagamentos").select("*").eq("mes", mes),
  ]);

  const historico: any[] = [];
  for (let i = 5; i >= 0; i--) {
    try {
      const d = new Date(inicio);
      d.setMonth(d.getMonth() - i);
      const mIni = d.toISOString().slice(0, 7) + "-01T00:00:00.000Z";
      const mFim = new Date(new Date(mIni).setMonth(new Date(mIni).getMonth() + 1)).toISOString();
      const { data: ags } = await supabaseAdmin.from("agendamentos").select("funcionario_id, faturamentos(valor_final, status_pagamento)").eq("status", "finalizado").gte("inicio", mIni).lt("inicio", mFim);
      historico.push({ mes: d.toISOString().slice(0, 7), agendamentos: ags ?? [] });
    } catch { historico.push({ mes: "", agendamentos: [] }); }
  }

  const resultado = (funcRes.data ?? []).map(f => {
    const ags = (agRes.data ?? []).filter((a: any) => a.funcionario_id === f.id);
    const calcBruto = (items: any[]) => items.reduce((acc: number, a: any) => {
      const fats = Array.isArray(a.faturamentos) ? a.faturamentos : a.faturamentos ? [a.faturamentos] : [];
      return acc + fats.filter((fat: any) => fat.status_pagamento === "pago").reduce((s: number, fat: any) => s + Number(fat.valor_final || 0), 0);
    }, 0);
    const totalBruto = calcBruto(ags);
    const pct = Number(f.comissao_percentual) || 0;
    const comissao = (totalBruto * pct) / 100;
    const pagamento = (pagRes.data ?? []).find((p: any) => p.funcionario_id === f.id);
    const bonificacao = Number(pagamento?.bonificacao ?? 0);
    const evolucao = historico.map(h => {
      const hAgs = (h.agendamentos ?? []).filter((a: any) => a.funcionario_id === f.id);
      const hBruto = calcBruto(hAgs);
      return { mes: h.mes, faturamento: hBruto, comissao: (hBruto * pct) / 100 };
    });
    return {
      ...f,
      atendimentos: ags.length,
      total_bruto: totalBruto,
      comissao_valor: comissao,
      bonificacao,
      total_a_pagar: comissao + bonificacao,
      status_pagamento: pagamento?.status ?? "pendente",
      pagamento_id: pagamento?.id ?? null,
      meta_atingida: Number(f.meta_mensal) > 0 ? Math.min(100, Math.round((totalBruto / Number(f.meta_mensal)) * 100)) : null,
      atendimentos_detalhe: ags.map((a: any) => ({
        procedimento: a.procedimentos?.nome ?? "Procedimento",
        data: a.inicio,
        valor: (() => {
          const fats = Array.isArray(a.faturamentos) ? a.faturamentos : a.faturamentos ? [a.faturamentos] : [];
          return fats.filter((fat: any) => fat.status_pagamento === "pago").reduce((s: number, fat: any) => s + Number(fat.valor_final || 0), 0);
        })(),
      })),
      evolucao,
    };
  });

  return NextResponse.json(resultado);
}

export async function PATCH(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const body = await request.json();
  const { acao, funcionario_id } = body;

  if (acao === "comissao_percentual") {
    const { data, error } = await supabaseAdmin.from("funcionarios").update({ comissao_percentual: Number(body.comissao_percentual) }).eq("id", funcionario_id).select().single();
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (acao === "meta_mensal") {
    const { data, error } = await supabaseAdmin.from("funcionarios").update({ meta_mensal: Number(body.meta_mensal) }).eq("id", funcionario_id).select().single();
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (acao === "bonificacao") {
    const mes = body.mes;
    const bonificacao = Number(body.bonificacao);
    const existing = await supabaseAdmin.from("comissoes_pagamentos").select("id").eq("funcionario_id", funcionario_id).eq("mes", mes).maybeSingle();
    if (existing.data) {
      await supabaseAdmin.from("comissoes_pagamentos").update({ bonificacao }).eq("id", existing.data.id);
    } else {
      await supabaseAdmin.from("comissoes_pagamentos").insert({ funcionario_id, mes, bonificacao, valor_comissao: 0, valor_total: bonificacao, status: "pendente" });
    }
    return NextResponse.json({ ok: true });
  }

  if (acao === "pagar") {
    const { mes, valor_comissao, bonificacao, observacoes } = body;
    const existing = await supabaseAdmin.from("comissoes_pagamentos").select("id").eq("funcionario_id", funcionario_id).eq("mes", mes).maybeSingle();
    const payload = { status: "pago", bonificacao: Number(bonificacao ?? 0), valor_total: Number(valor_comissao) + Number(bonificacao ?? 0), observacoes: observacoes ?? null, pago_em: new Date().toISOString(), valor_comissao: Number(valor_comissao) };
    if (existing.data) {
      const { data, error } = await supabaseAdmin.from("comissoes_pagamentos").update(payload).eq("id", existing.data.id).select().single();
      if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
      return NextResponse.json(data);
    }
    const { data, error } = await supabaseAdmin.from("comissoes_pagamentos").insert({ funcionario_id, mes, ...payload }).select().single();
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ erro: "Acao invalida" }, { status: 400 });
}