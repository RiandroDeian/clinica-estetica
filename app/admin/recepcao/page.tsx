"use client";

import { useEffect, useState, useCallback } from "react";

type Paciente = {
  id: string;
  nome: string;
  telefone: string;
  alergias?: string;
  contraindicacoes?: string;
  observacoes?: string;
  data_nascimento?: string;
};

type Agendamento = {
  id: string;
  inicio: string;
  fim: string;
  status: string;
  chegou_em?: string;
  consultorio?: string;
  nome?: string | null;
  nome_temporario?: string | null;
  procedimento?: string | null;
  sem_cadastro?: boolean;
  paciente_id?: string | null;
  pacientes?: Paciente;
  procedimentos?: { nome: string; cor: string; duracao_minutos: number };
  funcionarios?: { nome: string; cor: string };
};

type DadosPaciente = {
  ultimaVisita?: string;
  proximaSessao?: string;
  pacotesAtivos: number;
  sessoesRestantes: number;
  pendenteFinanceiro: number;
  totalVisitas: number;
};

function nomePaciente(ag: Agendamento) {
  return ag.pacientes?.nome ?? ag.nome_temporario ?? ag.nome ?? "Sem nome";
}

function nomeProcedimento(ag: Agendamento) {
  return ag.procedimentos?.nome ?? ag.procedimento ?? "-";
}

function calcularIdade(data?: string) {
  if (!data) return null;
  const hoje = new Date();
  const nasc = new Date(data + "T12:00:00");
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

const consultorios = ["Consultório 1", "Consultório 2", "Consultório 3"];

const corStatus: Record<string, { label: string; color: string; bg: string }> = {
  pendente:   { label: "Aguardando",     color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  confirmado: { label: "Em Atendimento", color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  finalizado: { label: "Finalizado",     color: "#a89080", bg: "rgba(168,144,128,0.1)" },
  cancelado:  { label: "Cancelado",      color: "#e87a7a", bg: "rgba(232,122,122,0.1)" },
};

export default function RecepcaoPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [agora, setAgora] = useState(new Date());
  const [painelAberto, setPainelAberto] = useState<Agendamento | null>(null);
  const [dadosPaciente, setDadosPaciente] = useState<DadosPaciente | null>(null);
  const [carregandoPaciente, setCarregandoPaciente] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"fila"|"fila_espera"|"confirmacoes"|"faltantes"|"atrasos">("fila");
  const [abaPainel, setAbaPainel] = useState<"detalhes"|"historico">("detalhes");

  const buscar = useCallback(async () => {
    const res = await fetch("/api/recepcao");
    const data = await res.json();
    setAgendamentos(Array.isArray(data) ? data : []);
    setCarregando(false);
  }, []);

  useEffect(() => {
    buscar();
    const interval = setInterval(buscar, 30000);
    const clock = setInterval(() => setAgora(new Date()), 1000);
    return () => { clearInterval(interval); clearInterval(clock); };
  }, [buscar]);

  async function buscarDadosPaciente(pacienteId: string) {
    setCarregandoPaciente(true);
    try {
      const [agRes, pacotesRes, fatRes] = await Promise.all([
        fetch(`/api/agendamentos?inicio=${new Date(Date.now() - 365*24*60*60*1000).toISOString()}&fim=${new Date().toISOString()}`),
        fetch("/api/pacotes"),
        fetch("/api/faturamento"),
      ]);
      const ags     = await agRes.json();
      const pacotes = await pacotesRes.json();
      const fat     = await fatRes.json();

      const agsPaciente = Array.isArray(ags) ? ags.filter((a: any) => a.paciente_id === pacienteId && a.status === "finalizado") : [];
      const pacotesPaciente = Array.isArray(pacotes) ? pacotes.filter((p: any) => p.paciente_id === pacienteId && p.status === "Ativo") : [];
      const fatPaciente = (fat.registros ?? []).filter((f: any) => f.paciente_id === pacienteId && f.status_pagamento === "pendente");

      const sessoesRestantes = pacotesPaciente.reduce((acc: number, p: any) => acc + Math.max(0, p.total_sessoes - p.sessoes_usadas), 0);
      const pendenteFinanceiro = fatPaciente.reduce((acc: number, f: any) => acc + Number(f.valor_final || 0), 0);

      const agsFuturos = Array.isArray(ags) ? ags.filter((a: any) => a.paciente_id === pacienteId && new Date(a.inicio) > agora && a.status !== "cancelado") : [];
      const proximaSessao = agsFuturos.length > 0 ? new Date(agsFuturos[agsFuturos.length - 1].inicio).toLocaleDateString("pt-BR") : undefined;
      const ultimaVisita = agsPaciente.length > 0 ? new Date(agsPaciente[0].inicio).toLocaleDateString("pt-BR") : undefined;

      setDadosPaciente({
        ultimaVisita,
        proximaSessao,
        pacotesAtivos: pacotesPaciente.length,
        sessoesRestantes,
        pendenteFinanceiro,
        totalVisitas: agsPaciente.length,
      });
    } catch {}
    setCarregandoPaciente(false);
  }

  async function atualizarStatus(id: string, status: string, extra?: object) {
    await fetch("/api/recepcao", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, ...extra }),
    });
    buscar();
    if (painelAberto?.id === id) setPainelAberto(prev => prev ? { ...prev, status, ...extra } : null);
  }

  function abrirPainel(ag: Agendamento) {
    setPainelAberto(ag);
    setAbaPainel("detalhes");
    setDadosPaciente(null);
    if (ag.paciente_id) buscarDadosPaciente(ag.paciente_id);
  }

  function tempoEspera(ag: Agendamento) {
    if (!ag.chegou_em) return null;
    return Math.floor((agora.getTime() - new Date(ag.chegou_em).getTime()) / 60000);
  }

  function atrasado(ag: Agendamento) {
    return new Date(ag.inicio) < agora && ag.status === "pendente" && !ag.chegou_em;
  }

  const aguardando     = agendamentos.filter(a => a.status === "pendente" && a.chegou_em);
  const emAtendimento  = agendamentos.filter(a => a.status === "confirmado");
  const finalizados    = agendamentos.filter(a => a.status === "finalizado");
  const cancelados     = agendamentos.filter(a => a.status === "cancelado");
  const naoConfirmados = agendamentos.filter(a => a.status === "pendente" && !a.chegou_em);
  const faltantes      = agendamentos.filter(a => {
    const passou = agora.getTime() - new Date(a.inicio).getTime() > 30 * 60000;
    return passou && a.status === "pendente" && !a.chegou_em;
  });

  // Fila de espera ordenada por tempo
  const filaEspera = aguardando
    .map(ag => ({ ag, espera: tempoEspera(ag) ?? 0 }))
    .sort((a, b) => b.espera - a.espera);

  // Atrasos de profissionais
  const atrasosProfissionais = (() => {
    const mapa: Record<string, { nome: string; cor: string; atraso: number; pacientes: number }> = {};
    agendamentos.forEach(ag => {
      if (!ag.funcionarios?.nome) return;
      const inicio = new Date(ag.inicio);
      if (ag.status === "pendente" && ag.chegou_em && inicio < agora) {
        const atraso = Math.floor((agora.getTime() - inicio.getTime()) / 60000);
        const key = ag.funcionarios.nome;
        if (!mapa[key]) mapa[key] = { nome: ag.funcionarios.nome, cor: ag.funcionarios.cor, atraso, pacientes: 0 };
        mapa[key].pacientes++;
        if (atraso > mapa[key].atraso) mapa[key].atraso = atraso;
      }
    });
    return Object.values(mapa).sort((a, b) => b.atraso - a.atraso);
  })();

  function CardAgendamento({ ag }: { ag: Agendamento }) {
    const cor = ag.procedimentos?.cor ?? "#c8a078";
    const cfg = corStatus[ag.status] ?? corStatus.pendente;
    const espera = tempoEspera(ag);
    const tarde = atrasado(ag);
    const semCadastro = ag.sem_cadastro === true;

    return (
      <div className="rounded-3xl p-5 transition-all duration-200 cursor-pointer hover:scale-[1.01]"
        style={{ background: "var(--bg-card)", border: `1px solid ${tarde ? "rgba(232,122,122,0.4)" : semCadastro ? "rgba(251,191,36,0.25)" : "var(--border-color)"}` }}
        onClick={() => abrirPainel(ag)}>
        <div className="flex items-start gap-4">
          <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: cor, minHeight: 56 }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold" style={{ color: "var(--text-primary)" }}>{nomePaciente(ag)}</span>
              {semCadastro && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}>⚠ Sem cadastro</span>}
              {tarde && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(232,122,122,0.15)", color: "var(--danger)" }}>Atrasado</span>}
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {nomeProcedimento(ag)} · {new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} – {new Date(ag.fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {ag.funcionarios?.nome ?? "Sem profissional"}
              {ag.consultorio && ` · ${ag.consultorio}`}
              {espera !== null && espera > 0 && (
                <span style={{ color: espera > 20 ? "var(--danger)" : "var(--warning)" }}> · Esperando {espera} min</span>
              )}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
          {ag.status === "pendente" && !ag.chegou_em && (
            <>
              <button onClick={() => atualizarStatus(ag.id, "pendente", { chegou_em: new Date().toISOString() })}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition hover:scale-105"
                style={{ background: "rgba(122,232,160,0.12)", color: "#7ae8a0", border: "1px solid rgba(122,232,160,0.3)" }}>
                ✓ Chegou
              </button>
              <button onClick={() => atualizarStatus(ag.id, "cancelado")}
                className="px-3 py-1.5 rounded-xl text-xs transition hover:opacity-70"
                style={{ background: "rgba(232,122,122,0.08)", color: "var(--danger)", border: "1px solid rgba(232,122,122,0.2)" }}>
                Cancelar
              </button>
            </>
          )}
          {ag.status === "pendente" && ag.chegou_em && (
            consultorios.map(c => (
              <button key={c} onClick={() => atualizarStatus(ag.id, "confirmado", { consultorio: c })}
                className="px-3 py-1.5 rounded-xl text-xs transition hover:scale-105"
                style={{ background: "rgba(122,232,160,0.1)", color: "#7ae8a0", border: "1px solid rgba(122,232,160,0.3)" }}>
                {c.replace("Consultório ", "S")}
              </button>
            ))
          )}
          {ag.status === "confirmado" && (
            <button onClick={() => atualizarStatus(ag.id, "finalizado")}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold transition hover:scale-105"
              style={{ background: "var(--gold)", color: "#0a0707" }}>
              Finalizar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full">
      {/* COLUNA PRINCIPAL */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Painel</p>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Recepção</h1>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color: "var(--gold)" }}>
              {agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
              {agora.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
          {[
            { label: "Total",           valor: agendamentos.length,   cor: "var(--gold)"    },
            { label: "Aguardando",      valor: aguardando.length,     cor: "var(--warning)" },
            { label: "Atendimento",     valor: emAtendimento.length,  cor: "var(--success)" },
            { label: "Finalizados",     valor: finalizados.length,    cor: "var(--text-muted)" },
            { label: "Cancelamentos",   valor: cancelados.length,     cor: "var(--danger)"  },
            { label: "Não confirmados", valor: naoConfirmados.length, cor: "var(--info)"    },
          ].map(k => (
            <div key={k.label} className="rounded-2xl px-4 py-3 text-center"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <p className="text-xl font-bold" style={{ color: k.cor }}>{k.valor}</p>
              <p className="text-[10px] uppercase tracking-widest mt-0.5 leading-tight" style={{ color: "var(--text-muted)" }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Abas */}
        <div className="flex gap-1 mb-5 rounded-2xl p-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          {([
            { key: "fila",         label: `Fila (${agendamentos.length})` },
            { key: "fila_espera",  label: `Espera (${filaEspera.length})` },
            { key: "confirmacoes", label: `Pendentes (${naoConfirmados.length})` },
            { key: "faltantes",    label: `Faltantes (${faltantes.length})` },
            { key: "atrasos",      label: `Atrasos (${atrasosProfissionais.length})` },
          ] as const).map(aba => (
            <button key={aba.key} onClick={() => setAbaAtiva(aba.key)}
              className="flex-1 py-2 rounded-xl text-xs uppercase tracking-widest transition"
              style={{ background: abaAtiva === aba.key ? "var(--gold-bg)" : "transparent", color: abaAtiva === aba.key ? "var(--gold)" : "var(--text-muted)" }}>
              {aba.label}
            </button>
          ))}
        </div>

        {carregando ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">

            {abaAtiva === "fila" && (
              agendamentos.length === 0
                ? <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}><p className="text-4xl mb-3">🌸</p><p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum agendamento hoje</p></div>
                : agendamentos.map(ag => <CardAgendamento key={ag.id} ag={ag} />)
            )}

            {/* FILA DE ESPERA VISUAL */}
            {abaAtiva === "fila_espera" && (
              filaEspera.length === 0
                ? <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}><p className="text-4xl mb-3">✓</p><p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum paciente aguardando</p></div>
                : (
                  <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          {["Paciente","Horário","Procedimento","Aguardando","Ação"].map(h => (
                            <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filaEspera.map(({ ag, espera }, i) => (
                          <tr key={ag.id} className="transition hover:bg-[var(--bg-hover)] cursor-pointer"
                            style={{ borderBottom: i < filaEspera.length - 1 ? "1px solid var(--border-subtle)" : "none", background: espera > 30 ? "rgba(232,122,122,0.05)" : espera > 15 ? "rgba(232,201,122,0.05)" : "transparent" }}
                            onClick={() => abrirPainel(ag)}>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: espera > 30 ? "var(--danger)" : espera > 15 ? "var(--warning)" : "var(--success)" }} />
                                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{nomePaciente(ag)}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
                              {new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="px-5 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>{nomeProcedimento(ag)}</td>
                            <td className="px-5 py-4">
                              <span className="text-sm font-bold" style={{ color: espera > 30 ? "var(--danger)" : espera > 15 ? "var(--warning)" : "var(--success)" }}>
                                {espera} min
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                {consultorios.map(c => (
                                  <button key={c} onClick={() => atualizarStatus(ag.id, "confirmado", { consultorio: c })}
                                    className="px-2 py-1 rounded-lg text-xs transition hover:scale-105"
                                    style={{ background: "rgba(122,232,160,0.1)", color: "#7ae8a0", border: "1px solid rgba(122,232,160,0.3)" }}>
                                    {c.replace("Consultório ", "S")}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
            )}

            {abaAtiva === "confirmacoes" && (
              naoConfirmados.length === 0
                ? <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}><p className="text-4xl mb-3">✓</p><p className="text-sm" style={{ color: "var(--text-muted)" }}>Todos confirmados!</p></div>
                : <>
                    <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: "rgba(122,184,232,0.08)", border: "1px solid rgba(122,184,232,0.2)", color: "var(--info)" }}>
                      {naoConfirmados.length} paciente{naoConfirmados.length > 1 ? "s" : ""} ainda não confirmaram presença.
                    </div>
                    {naoConfirmados.map(ag => (
                      <div key={ag.id} className="rounded-3xl p-5 cursor-pointer" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }} onClick={() => abrirPainel(ag)}>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div>
                            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{nomePaciente(ag)}</p>
                            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                              {nomeProcedimento(ag)} · {new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            <button onClick={() => atualizarStatus(ag.id, "pendente", { chegou_em: new Date().toISOString() })}
                              className="px-3 py-1.5 rounded-xl text-xs transition hover:scale-105"
                              style={{ background: "rgba(122,232,160,0.1)", color: "#7ae8a0", border: "1px solid rgba(122,232,160,0.3)" }}>
                              ✓ Chegou
                            </button>
                            <a href={`https://wa.me/55${(ag.pacientes?.telefone ?? "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl text-xs transition hover:scale-105"
                              style={{ background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>
                              WhatsApp
                            </a>
                            <button onClick={() => atualizarStatus(ag.id, "cancelado")}
                              className="px-3 py-1.5 rounded-xl text-xs transition hover:opacity-70"
                              style={{ background: "rgba(232,122,122,0.08)", color: "var(--danger)", border: "1px solid rgba(232,122,122,0.2)" }}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
            )}

            {abaAtiva === "faltantes" && (
              faltantes.length === 0
                ? <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}><p className="text-4xl mb-3">✓</p><p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum faltante até agora</p></div>
                : faltantes.map(ag => (
                    <div key={ag.id} className="rounded-3xl p-5 cursor-pointer" style={{ background: "var(--bg-card)", border: "1px solid rgba(232,122,122,0.2)" }} onClick={() => abrirPainel(ag)}>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{nomePaciente(ag)}</p>
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(232,122,122,0.1)", color: "var(--danger)" }}>Não chegou</span>
                          </div>
                          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            {nomeProcedimento(ag)} · {new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                          <a href={`https://wa.me/55${(ag.pacientes?.telefone ?? "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl text-xs transition hover:scale-105"
                            style={{ background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>
                            WhatsApp
                          </a>
                          <button onClick={() => atualizarStatus(ag.id, "cancelado")}
                            className="px-3 py-1.5 rounded-xl text-xs transition hover:opacity-70"
                            style={{ background: "rgba(232,122,122,0.08)", color: "var(--danger)", border: "1px solid rgba(232,122,122,0.2)" }}>
                            Não compareceu
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
            )}

            {/* PAINEL DE ATRASOS */}
            {abaAtiva === "atrasos" && (
              atrasosProfissionais.length === 0
                ? <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}><p className="text-4xl mb-3">✓</p><p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum profissional atrasado</p></div>
                : (
                  <div className="flex flex-col gap-3">
                    {atrasosProfissionais.map(prof => (
                      <div key={prof.nome} className="rounded-3xl p-5" style={{ background: "var(--bg-card)", border: "1px solid rgba(232,122,122,0.25)" }}>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                              style={{ background: `${prof.cor}22`, color: prof.cor }}>
                              {prof.nome.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{prof.nome}</p>
                              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                {prof.pacientes} paciente{prof.pacientes > 1 ? "s" : ""} aguardando
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold" style={{ color: "var(--danger)" }}>{prof.atraso} min</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>de atraso</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
            )}
          </div>
        )}
      </div>

      {/* PAINEL LATERAL — Card completo do paciente */}
      {painelAberto && (
        <div className="w-80 flex-shrink-0 rounded-3xl overflow-hidden flex flex-col"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>

          {/* Header */}
          <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                  style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
                  {nomePaciente(painelAberto).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>{nomePaciente(painelAberto)}</p>
                  {painelAberto.pacientes?.data_nascimento && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {calcularIdade(painelAberto.pacientes.data_nascimento)} anos
                    </p>
                  )}
                </div>
              </div>
              <button onClick={() => setPainelAberto(null)} style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Alertas */}
            {painelAberto.pacientes?.alergias && (
              <div className="px-3 py-2 rounded-xl mb-2 text-xs" style={{ background: "rgba(232,122,122,0.1)", border: "1px solid rgba(232,122,122,0.2)", color: "var(--danger)" }}>
                ⚠ Alergias: {painelAberto.pacientes.alergias}
              </div>
            )}
            {painelAberto.pacientes?.contraindicacoes && (
              <div className="px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(232,201,122,0.1)", border: "1px solid rgba(232,201,122,0.2)", color: "var(--warning)" }}>
                ⚠ Contraindicações: {painelAberto.pacientes.contraindicacoes}
              </div>
            )}
          </div>

          {/* Abas do painel */}
          <div className="flex" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            {(["detalhes","historico"] as const).map(aba => (
              <button key={aba} onClick={() => setAbaPainel(aba)}
                className="flex-1 py-2.5 text-xs uppercase tracking-widest transition"
                style={{ background: abaPainel === aba ? "var(--gold-bg)" : "transparent", color: abaPainel === aba ? "var(--gold)" : "var(--text-muted)", borderBottom: abaPainel === aba ? "2px solid var(--gold)" : "2px solid transparent" }}>
                {aba === "detalhes" ? "Detalhes" : "Histórico"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">

            {abaPainel === "detalhes" && (
              <>
                {/* Info do agendamento */}
                {[
                  { label: "Procedimento", valor: nomeProcedimento(painelAberto) },
                  { label: "Início",       valor: new Date(painelAberto.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) },
                  { label: "Fim",          valor: new Date(painelAberto.fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) },
                  { label: "Profissional", valor: painelAberto.funcionarios?.nome ?? "-" },
                  { label: "Consultório",  valor: painelAberto.consultorio ?? "-" },
                  { label: "Telefone",     valor: painelAberto.pacientes?.telefone ?? "-" },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-1.5"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{item.label}</span>
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>{item.valor}</span>
                  </div>
                ))}

                {/* Dados do paciente */}
                {carregandoPaciente ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} />
                  </div>
                ) : dadosPaciente && (
                  <>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { label: "Visitas",         valor: dadosPaciente.totalVisitas,    cor: "var(--gold)"    },
                        { label: "Pacotes Ativos",  valor: dadosPaciente.pacotesAtivos,   cor: "var(--success)" },
                        { label: "Sessões Rest.",   valor: dadosPaciente.sessoesRestantes, cor: "var(--info)"   },
                        { label: "Pendente",        valor: dadosPaciente.pendenteFinanceiro > 0 ? `R$ ${dadosPaciente.pendenteFinanceiro.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}` : "OK", cor: dadosPaciente.pendenteFinanceiro > 0 ? "var(--danger)" : "var(--success)" },
                      ].map(k => (
                        <div key={k.label} className="rounded-xl px-3 py-2 text-center"
                          style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                          <p className="text-base font-bold" style={{ color: k.cor }}>{k.valor}</p>
                          <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "var(--text-muted)" }}>{k.label}</p>
                        </div>
                      ))}
                    </div>
                    {dadosPaciente.ultimaVisita && (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Última visita: <span style={{ color: "var(--text-primary)" }}>{dadosPaciente.ultimaVisita}</span>
                      </p>
                    )}
                    {dadosPaciente.pendenteFinanceiro > 0 && (
                      <div className="px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(232,122,122,0.08)", border: "1px solid rgba(232,122,122,0.2)", color: "var(--danger)" }}>
                        ⚠ Débito em aberto: R$ {dadosPaciente.pendenteFinanceiro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </>
                )}

                {/* Status */}
                <div className="mt-1">
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Atualizar Status</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { s: "pendente",  chegou: false, label: "Aguardando confirmação" },
                      { s: "pendente",  chegou: true,  label: "✓ Chegou" },
                      { s: "confirmado",chegou: true,  label: "Em Atendimento" },
                      { s: "finalizado",chegou: true,  label: "Finalizado" },
                      { s: "cancelado", chegou: false, label: "Cancelado" },
                    ].map((opt, i) => {
                      const ativo = painelAberto.status === opt.s && (opt.chegou ? !!painelAberto.chegou_em : !painelAberto.chegou_em || opt.s === "cancelado" || opt.s === "finalizado");
                      return (
                        <button key={i} onClick={() => {
                          if (opt.s === "pendente" && opt.chegou) atualizarStatus(painelAberto.id, "pendente", { chegou_em: new Date().toISOString() });
                          else atualizarStatus(painelAberto.id, opt.s);
                        }}
                          className="w-full py-2 rounded-xl text-xs text-left px-3 transition"
                          style={{ background: ativo ? "var(--gold-bg)" : "transparent", color: ativo ? "var(--gold)" : "var(--text-muted)", border: `1px solid ${ativo ? "var(--border-color)" : "var(--border-subtle)"}` }}>
                          {ativo ? "● " : "○ "}{opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Timeline */}
                {painelAberto.chegou_em && (
                  <div>
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Timeline</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: "var(--success)" }} />
                        <div>
                          <p className="text-xs font-medium" style={{ color: "var(--success)" }}>Chegou</p>
                          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            {new Date(painelAberto.chegou_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {abaPainel === "historico" && (
              painelAberto.pacientes?.observacoes
                ? <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>{painelAberto.pacientes.observacoes}</div>
                : <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Sem observações cadastradas</p>
            )}
          </div>

          {/* Ações */}
          <div className="p-4 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            {painelAberto.pacientes?.telefone && (
              <a href={`https://wa.me/55${painelAberto.pacientes.telefone.replace(/\D/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full py-2.5 rounded-2xl text-sm font-medium text-center transition hover:scale-105"
                style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>
                💬 WhatsApp
              </a>
            )}
            {painelAberto.status === "confirmado" && (
              <button onClick={() => atualizarStatus(painelAberto.id, "finalizado")}
                className="w-full py-2.5 rounded-2xl text-sm font-semibold transition hover:scale-105"
                style={{ background: "var(--gold)", color: "#0a0707" }}>
                Finalizar Atendimento
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
