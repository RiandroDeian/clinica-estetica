export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

// "CRM só histórico": procedimentos como colunas, com os pacientes (e as datas)
// que fizeram cada um. Um paciente que fez vários aparece em cada procedimento.
// Fonte: agendamentos finalizados + sessões de laser realizadas.
export async function GET(_req: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const [agendamentos, procs, laserSessoes, laserPacotes] = await Promise.all([
    supabaseAdmin.from("agendamentos").select("paciente_id, nome, procedimento, procedimento_id, inicio, status").eq("status", "finalizado"),
    supabaseAdmin.from("procedimentos").select("id, nome, cor"),
    supabaseAdmin.from("laser_sessoes").select("paciente_id, pacote_id, realizada_em, numero_sessao"),
    supabaseAdmin.from("laser_pacotes").select("id, procedimento, paciente_id"),
  ]);

  const procInfo: Record<string, { nome: string; cor: string }> = {};
  for (const p of procs.data ?? []) procInfo[p.id] = { nome: p.nome, cor: p.cor || "#c8a078" };

  // Nomes de pacientes (para quem tem cadastro)
  const idsPac = new Set<string>();
  for (const a of agendamentos.data ?? []) if (a.paciente_id) idsPac.add(a.paciente_id);
  for (const s of laserSessoes.data ?? []) if (s.paciente_id) idsPac.add(s.paciente_id);
  const pacoteInfo: Record<string, { procedimento: string; paciente_id: string | null }> = {};
  for (const lp of laserPacotes.data ?? []) { pacoteInfo[lp.id] = { procedimento: lp.procedimento || "Laser", paciente_id: lp.paciente_id }; if (lp.paciente_id) idsPac.add(lp.paciente_id); }

  const nomePac: Record<string, string> = {};
  if (idsPac.size) {
    const { data } = await supabaseAdmin.from("pacientes").select("id, nome").in("id", Array.from(idsPac));
    for (const p of data ?? []) nomePac[p.id] = p.nome;
  }

  // procedimento -> (paciente -> { nome, datas[] })
  type Pac = { paciente_id: string | null; nome: string; datas: string[] };
  const mapa: Record<string, { procedimento: string; cor: string; pacientes: Record<string, Pac> }> = {};
  const getProc = (nome: string, cor: string) => (mapa[nome] ??= { procedimento: nome, cor, pacientes: {} });
  const addEvento = (procNome: string, cor: string, pacienteId: string | null, nomeFallback: string, data: string | null) => {
    const proc = getProc(procNome, cor);
    const chave = pacienteId || `sem:${nomeFallback}`;
    const nome = (pacienteId && nomePac[pacienteId]) || nomeFallback || "Paciente";
    const pac = (proc.pacientes[chave] ??= { paciente_id: pacienteId, nome, datas: [] });
    if (data) pac.datas.push(data);
  };

  for (const a of agendamentos.data ?? []) {
    const nome = (a.procedimento_id && procInfo[a.procedimento_id]?.nome) || a.procedimento || "Sem procedimento";
    const cor = (a.procedimento_id && procInfo[a.procedimento_id]?.cor) || "#c8a078";
    addEvento(nome, cor, a.paciente_id, a.nome, a.inicio);
  }
  for (const s of laserSessoes.data ?? []) {
    const info = pacoteInfo[s.pacote_id];
    const procNome = info?.procedimento || "Laser";
    addEvento(procNome, "#9b7fe8", s.paciente_id || info?.paciente_id || null, "", s.realizada_em);
  }

  // Monta resposta ordenada
  const resultado = Object.values(mapa).map(proc => {
    const pacientes = Object.values(proc.pacientes).map(p => {
      const datas = [...p.datas].sort((a, b) => (a < b ? 1 : -1)); // mais recente primeiro
      return { paciente_id: p.paciente_id, nome: p.nome, qtd: datas.length, datas, ultima: datas[0] ?? null };
    }).sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    const totalAtendimentos = pacientes.reduce((s, p) => s + p.qtd, 0);
    return { procedimento: proc.procedimento, cor: proc.cor, totalPacientes: pacientes.length, totalAtendimentos, pacientes };
  }).sort((a, b) => b.totalPacientes - a.totalPacientes);

  return NextResponse.json(resultado);
}
