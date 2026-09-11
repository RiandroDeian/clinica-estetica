export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

// Todos os KPIs são calculados a partir dos dados já registrados. Nenhum é digitado.
// O cliente envia o ciclo (e o ciclo anterior) já resolvidos por lib/ciclo.ts, para
// que o fuso da clínica seja respeitado. A API confia nesses limites ISO.

type Faixa = { inicio: string; fim: string };

// Bloco de números crus de um período — sem formatação, sem comparação.
async function calcular(f: Faixa) {
  const { inicio, fim } = f;
  const inicioDate = inicio.slice(0, 10);
  const fimDate = fim.slice(0, 10);
  const agora = new Date().toISOString();

  const [
    pacientesNovos,
    agendamentos,
    faturamentos,
    parcelasPagas,
    laserPacotes,
    pacotes,
    laserSessoes,
    orcamentosCriados,
    orcamentosFechados,
  ] = await Promise.all([
    supabaseAdmin.from("pacientes").select("id, nome, origem, criado_em").gte("criado_em", inicio).lt("criado_em", fim),
    supabaseAdmin.from("agendamentos").select("id, paciente_id, status, inicio, procedimento, procedimento_id, nome").gte("inicio", inicio).lt("inicio", fim),
    supabaseAdmin.from("faturamentos").select("id, valor_final, status_pagamento, criado_em, procedimento_id").gte("criado_em", inicio).lt("criado_em", fim),
    supabaseAdmin.from("laser_parcelas").select("id, valor, data_pagamento").gte("data_pagamento", inicioDate).lt("data_pagamento", fimDate),
    supabaseAdmin.from("laser_pacotes").select("id, valor, total_sessoes, procedimento, criado_em").gte("criado_em", inicio).lt("criado_em", fim),
    supabaseAdmin.from("pacotes").select("id, valor, nome_pacote, comprado_em").gte("comprado_em", inicio).lt("comprado_em", fim),
    supabaseAdmin.from("laser_sessoes").select("id, pacote_id, realizada_em").gte("realizada_em", inicio).lt("realizada_em", fim),
    // Orçamentos PROPOSTOS no ciclo (por criação) — exclui rascunho.
    supabaseAdmin.from("orcamentos").select("id, status, valor_final, criado_em").gte("criado_em", inicio).lt("criado_em", fim),
    // Orçamentos FECHADOS no ciclo (por data de fechamento) — a data manda no ciclo.
    supabaseAdmin.from("orcamentos").select("id, valor_final, data_fechamento").eq("status", "aprovado").gte("data_fechamento", inicioDate).lt("data_fechamento", fimDate),
  ]);

  const ags = agendamentos.data ?? [];
  const compareceram = ags.filter(a => a.status === "finalizado");
  const naoCompareceu = ags.filter(a => a.inicio < agora && (a.status === "pendente" || a.status === "confirmado"));

  const fats = faturamentos.data ?? [];
  const recebidoFat = fats.filter(x => x.status_pagamento === "pago").reduce((s, x) => s + Number(x.valor_final ?? 0), 0);
  const recebidoParc = (parcelasPagas.data ?? []).reduce((s, x) => s + Number(x.valor ?? 0), 0);

  const lps = laserPacotes.data ?? [];
  const pcs = pacotes.data ?? [];
  const fechadoLaser = lps.reduce((s, x) => s + Number(x.valor ?? 0), 0);
  const fechadoPacotes = pcs.reduce((s, x) => s + Number(x.valor ?? 0), 0);
  const nFechamentos = lps.length + pcs.length;

  // Valor executado: cada sessão de laser reconhece valor = valor do pacote / total_sessoes.
  const sessoes = laserSessoes.data ?? [];
  let executado = 0;
  if (sessoes.length) {
    const ids = Array.from(new Set(sessoes.map(s => s.pacote_id).filter(Boolean)));
    const { data: pcsSess } = await supabaseAdmin.from("laser_pacotes").select("id, valor, total_sessoes").in("id", ids as string[]);
    const mapa: Record<string, { valor: number; total: number }> = {};
    for (const p of pcsSess ?? []) mapa[p.id] = { valor: Number(p.valor ?? 0), total: Number(p.total_sessoes ?? 0) || 1 };
    executado = sessoes.reduce((s, x) => {
      const p = mapa[x.pacote_id];
      return s + (p ? p.valor / p.total : 0);
    }, 0);
  }

  // Orçamentos (funil de vendas). Propostas = tudo que saiu de rascunho.
  const orcs = (orcamentosCriados.data ?? []).filter(o => o.status !== "rascunho");
  const propostasCount = orcs.length;
  const propostasValor = orcs.reduce((s, o) => s + Number(o.valor_final ?? 0), 0);
  const aprovadosDeProp = orcs.filter(o => o.status === "aprovado");
  const aprovadosValorProp = aprovadosDeProp.reduce((s, o) => s + Number(o.valor_final ?? 0), 0);
  const perdidos = orcs.filter(o => o.status === "recusado" || o.status === "expirado");
  const perdidoValor = perdidos.reduce((s, o) => s + Number(o.valor_final ?? 0), 0);

  return {
    pacientesNovos: pacientesNovos.data ?? [],
    agendamentos: ags.length,
    comparecimentos: compareceram.length,
    naoCompareceu: naoCompareceu.length,
    cancelados: ags.filter(a => a.status === "cancelado").length,
    recebido: recebidoFat + recebidoParc,
    fechado: fechadoLaser + fechadoPacotes,
    nFechamentos,
    executado,
    // Orçamentos:
    propostasCount,
    propostasValor,
    aprovadosCount: aprovadosDeProp.length,
    aprovadosValorProp,
    perdidoCount: perdidos.length,
    perdidoValor,
    fechamentosOrc: orcamentosFechados.data?.length ?? 0,
    fechamentosLista: [
      ...lps.map(x => ({ id: x.id, tipo: "Laser", nome: x.procedimento ?? "Laser", valor: Number(x.valor ?? 0), data: x.criado_em })),
      ...pcs.map(x => ({ id: x.id, tipo: "Pacote", nome: x.nome_pacote ?? "Pacote", valor: Number(x.valor ?? 0), data: x.comprado_em })),
    ],
  };
}

// Valor acumulado (para "a executar" = fechado acumulado − executado acumulado até o fim do ciclo).
async function acumuladoAteFim(fim: string) {
  const [lp, pc, sess] = await Promise.all([
    supabaseAdmin.from("laser_pacotes").select("valor").lt("criado_em", fim),
    supabaseAdmin.from("pacotes").select("valor").lt("comprado_em", fim),
    supabaseAdmin.from("laser_sessoes").select("pacote_id").lt("realizada_em", fim),
  ]);
  const fechadoAcum = (lp.data ?? []).reduce((s, x) => s + Number(x.valor ?? 0), 0)
    + (pc.data ?? []).reduce((s, x) => s + Number(x.valor ?? 0), 0);

  let executadoAcum = 0;
  const sessoes = sess.data ?? [];
  if (sessoes.length) {
    const ids = Array.from(new Set(sessoes.map(s => s.pacote_id).filter(Boolean)));
    const { data: pcsSess } = await supabaseAdmin.from("laser_pacotes").select("id, valor, total_sessoes").in("id", ids as string[]);
    const mapa: Record<string, number> = {};
    for (const p of pcsSess ?? []) mapa[p.id] = (Number(p.valor ?? 0)) / ((Number(p.total_sessoes ?? 0)) || 1);
    executadoAcum = sessoes.reduce((s, x) => s + (mapa[x.pacote_id] ?? 0), 0);
  }
  return { fechadoAcum, executadoAcum, aExecutar: fechadoAcum - executadoAcum };
}

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const inicioAnt = searchParams.get("inicioAnt");
  const fimAnt = searchParams.get("fimAnt");
  if (!inicio || !fim) return NextResponse.json({ erro: "inicio e fim obrigatorios" }, { status: 400 });

  const atual = await calcular({ inicio, fim });
  const anterior = (inicioAnt && fimAnt) ? await calcular({ inicio: inicioAnt, fim: fimAnt }) : null;
  const acum = await acumuladoAteFim(fim);

  const ticket = atual.nFechamentos > 0 ? atual.fechado / atual.nFechamentos : null;
  const ticketAnt = anterior && anterior.nFechamentos > 0 ? anterior.fechado / anterior.nFechamentos : null;

  // Inadimplência (snapshot atual): parcelas de boleto vencidas e não pagas.
  const hojeData = new Date().toISOString().slice(0, 10);
  const { data: parcelasVencidas } = await supabaseAdmin
    .from("laser_parcelas").select("valor, vencimento, data_pagamento")
    .is("data_pagamento", null).lt("vencimento", hojeData);
  const inadimplencia = (parcelasVencidas ?? []).reduce((s, p) => s + Number(p.valor ?? 0), 0);

  // Taxa de conversão e aproveitamento (orçamentos)
  const conversao = atual.propostasCount > 0 ? (atual.aprovadosCount / atual.propostasCount) * 100 : null;
  const conversaoAnt = anterior && anterior.propostasCount > 0 ? (anterior.aprovadosCount / anterior.propostasCount) * 100 : null;
  const aproveita = atual.propostasValor > 0 ? (atual.aprovadosValorProp / atual.propostasValor) * 100 : null;
  const aproveitaAnt = anterior && anterior.propostasValor > 0 ? (anterior.aprovadosValorProp / anterior.propostasValor) * 100 : null;

  // Monta um KPI com comparação. `tem=false` => a UI mostra "—".
  const kpi = (valor: number | null, valorAnterior: number | null, tem = true) => ({
    valor, valorAnterior, tem,
    variacao: (tem && valor != null && valorAnterior != null && valorAnterior !== 0)
      ? ((valor - valorAnterior) / valorAnterior) * 100
      : null,
  });

  return NextResponse.json({
    kpis: {
      pacientes_novos:  kpi(atual.pacientesNovos.length, anterior?.pacientesNovos.length ?? null),
      agendamentos:     kpi(atual.agendamentos, anterior?.agendamentos ?? null),
      comparecimentos:  kpi(atual.comparecimentos, anterior?.comparecimentos ?? null),
      nao_compareceu:   kpi(atual.naoCompareceu, anterior?.naoCompareceu ?? null),
      cancelados:       kpi(atual.cancelados, anterior?.cancelados ?? null),
      valor_fechado:    kpi(atual.fechado, anterior?.fechado ?? null),
      valor_recebido:   kpi(atual.recebido, anterior?.recebido ?? null),
      valor_executado:  kpi(atual.executado, anterior?.executado ?? null),
      ticket_medio:     kpi(ticket, ticketAnt, ticket != null),
      a_executar:       kpi(acum.aExecutar, null),
      fechamentos:      kpi(atual.nFechamentos, anterior?.nFechamentos ?? null),
      // Orçamentos (funil de vendas) — dado real assim que houver orçamentos:
      orcamentos:       kpi(atual.propostasCount, anterior?.propostasCount ?? null, atual.propostasCount > 0 || (anterior?.propostasCount ?? 0) > 0),
      valor_proposto:   kpi(atual.propostasValor, anterior?.propostasValor ?? null, atual.propostasValor > 0 || (anterior?.propostasValor ?? 0) > 0),
      taxa_conversao:   kpi(conversao, conversaoAnt, conversao != null),
      aproveitamento:   kpi(aproveita, aproveitaAnt, aproveita != null),
      valor_perdido:    kpi(atual.perdidoValor, anterior?.perdidoValor ?? null, atual.perdidoValor > 0 || (anterior?.perdidoValor ?? 0) > 0),
      inadimplencia:    kpi(inadimplencia, null, true),
    },
    drill: {
      pacientes_novos: atual.pacientesNovos.map(p => ({ id: p.id, nome: p.nome, origem: p.origem, data: p.criado_em })),
      fechamentos: atual.fechamentosLista,
    },
  });
}
