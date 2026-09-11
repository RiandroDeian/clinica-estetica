export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

// Desempenho por profissional no ciclo.
export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  if (!inicio || !fim) return NextResponse.json({ erro: "inicio e fim obrigatorios" }, { status: 400 });

  const [funcs, laserPacotes, faturamentos, laserSessoes, agendamentos] = await Promise.all([
    supabaseAdmin.from("funcionarios").select("id, nome"),
    supabaseAdmin.from("laser_pacotes").select("funcionario_id, valor").gte("criado_em", inicio).lt("criado_em", fim),
    supabaseAdmin.from("faturamentos").select("funcionario_id, valor_final, status_pagamento").gte("criado_em", inicio).lt("criado_em", fim),
    supabaseAdmin.from("laser_sessoes").select("funcionario_id, pacote_id, valor_reconhecido").gte("realizada_em", inicio).lt("realizada_em", fim),
    supabaseAdmin.from("agendamentos").select("funcionario_id, status").gte("inicio", inicio).lt("inicio", fim),
  ]);

  const nome: Record<string, string> = {};
  for (const f of funcs.data ?? []) nome[f.id] = f.nome;

  type Row = { id: string; nome: string; fechado: number; recebido: number; executado: number; comparecimentos: number; nFechamentos: number };
  const mapa: Record<string, Row> = {};
  const get = (id: string) => (mapa[id] ??= { id, nome: nome[id] || "—", fechado: 0, recebido: 0, executado: 0, comparecimentos: 0, nFechamentos: 0 });

  for (const l of laserPacotes.data ?? []) { if (!l.funcionario_id) continue; const r = get(l.funcionario_id); r.fechado += Number(l.valor ?? 0); r.nFechamentos += 1; }
  for (const f of faturamentos.data ?? []) { if (f.funcionario_id && f.status_pagamento === "pago") get(f.funcionario_id).recebido += Number(f.valor_final ?? 0); }
  for (const a of agendamentos.data ?? []) { if (a.funcionario_id && a.status === "finalizado") get(a.funcionario_id).comparecimentos += 1; }

  // Executado por profissional (valor congelado, com fallback para sessões antigas)
  const sessoes = laserSessoes.data ?? [];
  const semValor = sessoes.filter(s => s.valor_reconhecido == null).map(s => s.pacote_id).filter(Boolean);
  const valorPac: Record<string, number> = {};
  if (semValor.length) {
    const { data } = await supabaseAdmin.from("laser_pacotes").select("id, valor, total_sessoes").in("id", Array.from(new Set(semValor)) as string[]);
    for (const p of data ?? []) valorPac[p.id] = Number(p.valor ?? 0) / ((Number(p.total_sessoes ?? 0)) || 1);
  }
  for (const s of sessoes) {
    if (!s.funcionario_id) continue;
    const v = s.valor_reconhecido != null ? Number(s.valor_reconhecido) : (valorPac[s.pacote_id] ?? 0);
    get(s.funcionario_id).executado += v;
  }

  const linhas = Object.values(mapa)
    .map(r => ({ ...r, ticket: r.nFechamentos > 0 ? r.fechado / r.nFechamentos : null }))
    .filter(r => r.fechado > 0 || r.recebido > 0 || r.executado > 0 || r.comparecimentos > 0)
    .sort((a, b) => b.fechado - a.fechado);

  return NextResponse.json(linhas);
}
