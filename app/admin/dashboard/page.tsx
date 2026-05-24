"use client";

import { useEffect, useState } from "react";

type DashboardData = {
  totalPacientes: number;
  agendamentosHoje: any[];
  proximosAgendamentos: any[];
  topProcedimentos: { nome: string; total: number }[];
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pendente:   { label: "Pendente",   color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  confirmado: { label: "Confirmado", color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  cancelado:  { label: "Cancelado",  color: "#e87a7a", bg: "rgba(232,122,122,0.1)" },
  finalizado: { label: "Finalizado", color: "#a89080", bg: "rgba(168,144,128,0.1)" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.pendente;
  return (
    <span className="text-xs px-2 py-1 rounded-full font-medium"
      style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function StatsCard({ titulo, valor, icone, sub }: { titulo: string; valor: string | number; icone: string; sub?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);
  return (
    <div className="rounded-3xl p-6 transition-all duration-500"
      style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)",
        opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)" }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg"
          style={{ background: "rgba(200,160,120,0.1)" }}>
          {icone}
        </div>
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

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setCarregando(false); })
      .catch(() => setCarregando(false));
  }, []);

  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "#c8a078" }} />
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
        <StatsCard titulo="Proximos" valor={data?.proximosAgendamentos.length ?? 0} icone="⏰" sub="agendamentos" />
        <StatsCard titulo="Procedimentos" valor={data?.topProcedimentos.length ?? 0} icone="✦" sub="diferentes" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl p-6" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: "#c8a078" }}>
            Agenda de Hoje
          </h2>
          {data?.agendamentosHoje.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhum agendamento hoje</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data?.agendamentosHoje.map((ag: any) => (
                <div key={ag.id} className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.08)" }}>
                  <div className="w-1 h-12 rounded-full flex-shrink-0"
                    style={{ background: ag.procedimentos?.cor ?? "#c8a078" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#e8d5c0" }}>
                      {ag.pacientes?.nome}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#6b5a4e" }}>
                      {ag.procedimentos?.nome} · {new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <StatusBadge status={ag.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl p-6" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: "#c8a078" }}>
            Procedimentos Mais Realizados
          </h2>
          {data?.topProcedimentos.length === 0 ? (
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
                      <div className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: "#c8a078" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-3xl p-6" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: "#c8a078" }}>
          Proximos Agendamentos
        </h2>
        {data?.proximosAgendamentos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-3">🗓</p>
            <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhum proximo agendamento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data?.proximosAgendamentos.map((ag: any) => (
              <div key={ag.id} className="p-4 rounded-2xl"
                style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.08)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: ag.procedimentos?.cor ?? "#c8a078" }} />
                  <span className="text-xs uppercase tracking-wider" style={{ color: ag.procedimentos?.cor ?? "#c8a078" }}>
                    {ag.procedimentos?.nome}
                  </span>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "#e8d5c0" }}>{ag.pacientes?.nome}</p>
                <p className="text-xs" style={{ color: "#6b5a4e" }}>
                  {new Date(ag.inicio).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} as{" "}
                  {new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <div className="mt-2"><StatusBadge status={ag.status} /></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}