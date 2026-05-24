"use client";

import { useEffect, useState, useCallback } from "react";

type Agendamento = {
  id: string;
  inicio: string;
  fim: string;
  status: string;
  chegou_em?: string;
  consultorio?: string;
  pacientes?: { nome: string; telefone: string };
  procedimentos?: { nome: string; cor: string; duracao_minutos: number };
  funcionarios?: { nome: string; cor: string };
};

const statusCfg: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pendente:   { label: "Aguardando",     color: "#e8c97a", bg: "rgba(232,201,122,0.1)",  border: "rgba(232,201,122,0.3)"  },
  confirmado: { label: "Em Atendimento", color: "#7ae8a0", bg: "rgba(122,232,160,0.1)",  border: "rgba(122,232,160,0.3)"  },
  finalizado: { label: "Finalizado",     color: "#a89080", bg: "rgba(168,144,128,0.1)",  border: "rgba(168,144,128,0.3)"  },
  cancelado:  { label: "Cancelado",      color: "#e87a7a", bg: "rgba(232,122,122,0.1)",  border: "rgba(232,122,122,0.3)"  },
};

const consultorios = ["Consultorio 1", "Consultorio 2", "Consultorio 3"];

export default function RecepcaoPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [agora, setAgora] = useState(new Date());

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

  async function atualizarStatus(id: string, status: string, extra?: object) {
    await fetch("/api/recepcao", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, ...extra }),
    });
    buscar();
  }

  const aguardando    = agendamentos.filter(a => a.status === "pendente");
  const emAtendimento = agendamentos.filter(a => a.status === "confirmado");
  const finalizados   = agendamentos.filter(a => a.status === "finalizado");

  function tempoEspera(ag: Agendamento) {
    if (!ag.chegou_em) return null;
    return Math.floor((agora.getTime() - new Date(ag.chegou_em).getTime()) / 60000);
  }

  function atrasado(ag: Agendamento) {
    return new Date(ag.inicio) < agora && ag.status === "pendente";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>Painel</p>
          <h1 className="text-3xl font-bold" style={{ color: "#e8d5c0" }}>Recepcao</h1>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold" style={{ color: "#c8a078" }}>
            {agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-xs capitalize" style={{ color: "#6b5a4e" }}>
            {agora.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Aguardando",     valor: aguardando.length,    color: "#e8c97a" },
          { label: "Em Atendimento", valor: emAtendimento.length, color: "#7ae8a0" },
          { label: "Finalizados",    valor: finalizados.length,   color: "#a89080" },
        ].map((c, i) => (
          <div key={i} className="rounded-3xl p-5 text-center"
            style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
            <p className="text-3xl font-bold mb-1" style={{ color: c.color }}>{c.valor}</p>
            <p className="text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>{c.label}</p>
          </div>
        ))}
      </div>

      {carregando ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "#c8a078" }} />
        </div>
      ) : agendamentos.length === 0 ? (
        <div className="text-center py-20 rounded-3xl"
          style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
          <p className="text-4xl mb-4">-</p>
          <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhum agendamento hoje</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {agendamentos.map(ag => {
            const cfg  = statusCfg[ag.status] ?? statusCfg.pendente;
            const espera = tempoEspera(ag);
            const tarde  = atrasado(ag);
            return (
              <div key={ag.id} className="rounded-3xl p-5 transition-all duration-300"
                style={{ background: "#120d0d", border: `1px solid ${tarde ? "rgba(232,122,122,0.3)" : cfg.border}` }}>
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="w-1 self-stretch rounded-full flex-shrink-0"
                    style={{ background: ag.procedimentos?.cor ?? "#c8a078", minHeight: 60 }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h3 className="text-lg font-bold" style={{ color: "#e8d5c0" }}>{ag.pacientes?.nome}</h3>
                      {tarde && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(232,122,122,0.15)", color: "#e87a7a" }}>
                          Atrasado
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    </div>
                    <p className="text-sm mb-1" style={{ color: "#a89080" }}>
                      {ag.procedimentos?.nome} - {new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} ate {new Date(ag.fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-xs" style={{ color: "#6b5a4e" }}>
                      Prof: {ag.funcionarios?.nome ?? "-"}
                      {ag.consultorio && ` - ${ag.consultorio}`}
                      {espera !== null && ` - Esperando ha ${espera} min`}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {ag.status === "pendente" && (
                      <>
                        <div className="flex gap-2 flex-wrap">
                          {consultorios.map(c => (
                            <button key={c}
                              onClick={() => atualizarStatus(ag.id, "confirmado", { chegou_em: new Date().toISOString(), consultorio: c })}
                              className="px-3 py-2 rounded-xl text-xs transition hover:scale-105"
                              style={{ background: "rgba(122,232,160,0.1)", color: "#7ae8a0", border: "1px solid rgba(122,232,160,0.3)" }}>
                              {c.replace("Consultorio ", "S")}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => atualizarStatus(ag.id, "cancelado")}
                          className="px-3 py-2 rounded-xl text-xs transition hover:opacity-70"
                          style={{ background: "rgba(232,122,122,0.08)", color: "#e87a7a", border: "1px solid rgba(232,122,122,0.2)" }}>
                          Cancelar
                        </button>
                      </>
                    )}
                    {ag.status === "confirmado" && (
                      <button onClick={() => atualizarStatus(ag.id, "finalizado")}
                        className="px-4 py-2 rounded-xl text-xs font-semibold transition hover:scale-105"
                        style={{ background: "#c8a078", color: "#0a0707" }}>
                        Finalizar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}