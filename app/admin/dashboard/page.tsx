"use client";

import { useEffect, useState } from "react";

type Agendamento = {
  id: string;
  inicio: string;
  fim: string;
  status: string;
  nome?: string | null;
  nome_temporario?: string | null;
  sem_cadastro?: boolean;
  pacientes?: { nome: string; telefone: string };
  procedimentos?: { nome: string; cor: string };
};

type DashboardData = {
  totalPacientes: number;
  agendamentosHoje: Agendamento[];
  proximosAgendamentos: Agendamento[];
  topProcedimentos: { nome: string; total: number }[];
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pendente:   { label: "Pendente",   color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  confirmado: { label: "Confirmado", color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  cancelado:  { label: "Cancelado",  color: "#e87a7a", bg: "rgba(232,122,122,0.1)" },
  finalizado: { label: "Finalizado", color: "#a89080", bg: "rgba(168,144,128,0.1)" },
};

function nomePaciente(ag: Agendamento) {
  return ag.pacientes?.nome ?? ag.nome_temporario ?? ag.nome ?? "Sem nome";
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.pendente;
  return (
    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function StatsCard({ titulo, valor, icone, sub }: { titulo: string; valor: string | number; icone: string; sub?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);
  return (
    <div className="rounded-3xl p-6 transition-all duration-500"
      style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)" }}>
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg mb-4" style={{ background: "rgba(200,160,120,0.1)" }}>
        {icone}
      </div>
      <p className="text-3xl font-bold mb-1" style={{ color: "#c8a078" }}>{valor}</p>
      <p className="text-sm font-medium" style={{ color: "#e8d5c0" }}>{titulo}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "#6b5a4e" }}>{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  async function buscar() {
    const res = await fetch("/api/dashboard");
    const d = await res.json();
    setData(d);
    setCarregando(false);
  }

  useEffect(() => { buscar(); }, []);

  async function excluirAgendamento(id: string) {
    if (!confirm("Excluir este agendamento? Esta ação não pode ser desfeita.")) return;
    setExcluindo(id);
    await fetch(`/api/agendamentos/${id}`, { method: "DELETE" });
    setExcluindo(null);
    buscar();
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "#c8a078" }} />
      </div>
    );
  }

  function CardAgendamento({ ag }: { ag: Agendamento }) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-2xl group"
        style={{ background: "#0e0a0a", border: ag.sem_cadastro ? "1px solid rgba(251,191,36,0.2)" : "1px solid rgba(200,160,120,0.08)" }}>
        <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ background: ag.procedimentos?.cor ?? "#c8a078" }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate" style={{ color: "#e8d5c0" }}>{nomePaciente(ag)}</p>
            {ag.sem_cadastro && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}>⚠ Sem cadastro</span>}
          </div>
          <p className="text-xs mt-0.5" style={{ color: "#6b5a4e" }}>
            {ag.procedimentos?.nome ?? "Procedimento não informado"} · {new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={ag.status} />
          <button
            onClick={() => excluirAgendamento(ag.id)}
            disabled={excluindo === ag.id}
            className="p-1.5 rounded-lg transition opacity-0 group-hover:opacity-100 hover:scale-110"
            style={{ background: "rgba(232,122,122,0.1)" }}
            title="Excluir agendamento">
            {excluindo === ag.id ? (
              <div className="w-3.5 h-3.5 rounded-full border animate-spin" style={{ borderColor: "rgba(232,122,122,0.3)", borderTopColor: "#e87a7a" }} />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="#e87a7a" strokeWidth={1.5}>
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest mb-1 capitalize" style={{ color: "#c8a078" }}>{hoje}</p>
        <h1 className="text-3xl font-bold" style={{ color: "#e8d5c0" }}>Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard titulo="Total de Pacientes" valor={data?.totalPacientes ?? 0} icone="👥" sub="cadastrados" />
        <StatsCard titulo="Consultas Hoje" valor={data?.agendamentosHoje.length ?? 0} icone="📅" sub="agendadas" />
        <StatsCard titulo="Próximos" valor={data?.proximosAgendamentos.length ?? 0} icone="⏰" sub="agendamentos" />
        <StatsCard titulo="Procedimentos" valor={data?.topProcedimentos.length ?? 0} icone="✚" sub="diferentes" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agenda de Hoje */}
        <div className="rounded-3xl p-6" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: "#c8a078" }}>
            Agenda de Hoje
          </h2>
          {(data?.agendamentosHoje.length ?? 0) === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-3">📋</p>
              <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhum agendamento hoje</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data?.agendamentosHoje.map(ag => <CardAgendamento key={ag.id} ag={ag} />)}
            </div>
          )}
        </div>

        {/* Procedimentos mais realizados */}
        <div className="rounded-3xl p-6" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: "#c8a078" }}>
            Procedimentos Mais Realizados
          </h2>
          {(data?.topProcedimentos.length ?? 0) === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-3">📊</p>
              <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhum dado ainda</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {data?.topProcedimentos.map((p, i) => {
                const max = data.topProcedimentos[0].total;
                const pct = Math.round((p.total / max) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm" style={{ color: "#e8d5c0" }}>{p.nome}</span>
                      <span className="text-sm font-semibold" style={{ color: "#c8a078" }}>{p.total}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(200,160,120,0.1)" }}>
                      <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "#c8a078" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Próximos agendamentos */}
      <div className="mt-6 rounded-3xl p-6" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: "#c8a078" }}>
          Próximos Agendamentos
        </h2>
        {(data?.proximosAgendamentos.length ?? 0) === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-3">🗓</p>
            <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhum próximo agendamento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data?.proximosAgendamentos.map(ag => (
              <div key={ag.id} className="p-4 rounded-2xl group relative"
                style={{ background: "#0e0a0a", border: ag.sem_cadastro ? "1px solid rgba(251,191,36,0.2)" : "1px solid rgba(200,160,120,0.08)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: ag.procedimentos?.cor ?? "#c8a078" }} />
                  <span className="text-xs uppercase tracking-wider truncate" style={{ color: ag.procedimentos?.cor ?? "#c8a078" }}>
                    {ag.procedimentos?.nome ?? "Procedimento"}
                  </span>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "#e8d5c0" }}>{nomePaciente(ag)}</p>
                <p className="text-xs" style={{ color: "#6b5a4e" }}>
                  {new Date(ag.inicio).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} às{" "}
                  {new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <StatusBadge status={ag.status} />
                  <button onClick={() => excluirAgendamento(ag.id)} disabled={excluindo === ag.id}
                    className="p-1.5 rounded-lg transition opacity-0 group-hover:opacity-100"
                    style={{ background: "rgba(232,122,122,0.1)" }} title="Excluir">
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="#e87a7a" strokeWidth={1.5}>
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
