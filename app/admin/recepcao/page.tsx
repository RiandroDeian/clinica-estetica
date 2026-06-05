"use client";

import { useEffect, useState, useCallback } from "react";

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
  pacientes?: { nome: string; telefone: string };
  procedimentos?: { nome: string; cor: string; duracao_minutos: number };
  funcionarios?: { nome: string; cor: string };
};

function nomePaciente(ag: Agendamento) {
  return ag.pacientes?.nome ?? ag.nome_temporario ?? ag.nome ?? "Sem nome";
}

function nomeProcedimento(ag: Agendamento) {
  return ag.procedimentos?.nome ?? ag.procedimento ?? "-";
}

const consultorios = ["Consultório 1", "Consultório 2", "Consultório 3"];

export default function RecepcaoPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [agora, setAgora] = useState(new Date());
  const [painelAberto, setPainelAberto] = useState<Agendamento | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<"fila"|"confirmacoes"|"faltantes">("fila");

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
    if (painelAberto?.id === id) setPainelAberto(prev => prev ? { ...prev, status, ...extra } : null);
  }

  function tempoEspera(ag: Agendamento) {
    if (!ag.chegou_em) return null;
    return Math.floor((agora.getTime() - new Date(ag.chegou_em).getTime()) / 60000);
  }

  function atrasado(ag: Agendamento) {
    return new Date(ag.inicio) < agora && ag.status === "pendente" && !ag.chegou_em;
  }

  // Agrupamentos
  const aguardando    = agendamentos.filter(a => a.status === "pendente" && a.chegou_em);
  const emAtendimento = agendamentos.filter(a => a.status === "confirmado");
  const finalizados   = agendamentos.filter(a => a.status === "finalizado");
  const cancelados    = agendamentos.filter(a => a.status === "cancelado");
  const naoConfirmados = agendamentos.filter(a => a.status === "pendente" && !a.chegou_em);
  const faltantes     = agendamentos.filter(a => {
    const horario = new Date(a.inicio);
    const passou = agora.getTime() - horario.getTime() > 30 * 60000;
    return passou && a.status === "pendente" && !a.chegou_em;
  });

  // Receita prevista
  const receitaPrevista = agendamentos.filter(a => a.status !== "cancelado").length * 250;

  const corStatus: Record<string, { label: string; color: string; bg: string }> = {
    pendente:   { label: "Aguardando",     color: "#e8c97a", bg: "rgba(232,201,122,0.1)"  },
    confirmado: { label: "Em Atendimento", color: "#7ae8a0", bg: "rgba(122,232,160,0.1)"  },
    finalizado: { label: "Finalizado",     color: "#a89080", bg: "rgba(168,144,128,0.1)"  },
    cancelado:  { label: "Cancelado",      color: "#e87a7a", bg: "rgba(232,122,122,0.1)"  },
  };

  function CardAgendamento({ ag, mostrarTimeline = false }: { ag: Agendamento; mostrarTimeline?: boolean }) {
    const cor = ag.procedimentos?.cor ?? "#c8a078";
    const cfg = corStatus[ag.status] ?? corStatus.pendente;
    const espera = tempoEspera(ag);
    const tarde = atrasado(ag);
    const semCadastro = ag.sem_cadastro === true;

    return (
      <div className="rounded-3xl p-5 transition-all duration-200 cursor-pointer hover:scale-[1.01]"
        style={{ background: "#120d0d", border: `1px solid ${tarde ? "rgba(232,122,122,0.4)" : semCadastro ? "rgba(251,191,36,0.25)" : "rgba(200,160,120,0.12)"}` }}
        onClick={() => setPainelAberto(ag)}>
        <div className="flex items-start gap-4">
          <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: cor, minHeight: 56 }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold" style={{ color: "#e8d5c0" }}>{nomePaciente(ag)}</span>
              {semCadastro && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}>⚠ Sem cadastro</span>}
              {tarde && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(232,122,122,0.15)", color: "#e87a7a" }}>Atrasado</span>}
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
            </div>
            <p className="text-sm" style={{ color: "#a89080" }}>
              {nomeProcedimento(ag)} · {new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} – {new Date(ag.fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#6b5a4e" }}>
              {ag.funcionarios?.nome ?? "Sem profissional"}
              {ag.consultorio && ` · ${ag.consultorio}`}
              {espera !== null && espera > 0 && (
                <span style={{ color: espera > 20 ? "#e87a7a" : "#e8c97a" }}> · Esperando {espera} min</span>
              )}
            </p>
          </div>
        </div>

        {/* Botões de ação rápida */}
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
                style={{ background: "rgba(232,122,122,0.08)", color: "#e87a7a", border: "1px solid rgba(232,122,122,0.2)" }}>
                Cancelar
              </button>
            </>
          )}
          {ag.status === "pendente" && ag.chegou_em && (
            <>
              {consultorios.map(c => (
                <button key={c} onClick={() => atualizarStatus(ag.id, "confirmado", { consultorio: c })}
                  className="px-3 py-1.5 rounded-xl text-xs transition hover:scale-105"
                  style={{ background: "rgba(122,232,160,0.1)", color: "#7ae8a0", border: "1px solid rgba(122,232,160,0.3)" }}>
                  {c.replace("Consultório ", "S")}
                </button>
              ))}
            </>
          )}
          {ag.status === "confirmado" && (
            <button onClick={() => atualizarStatus(ag.id, "finalizado")}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold transition hover:scale-105"
              style={{ background: "#c8a078", color: "#0a0707" }}>
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>Painel</p>
            <h1 className="text-3xl font-bold" style={{ color: "#e8d5c0" }}>Recepção</h1>
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

        {/* Resumo do dia */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Total",          valor: agendamentos.length,    cor: "#c8a078" },
            { label: "Aguardando",     valor: aguardando.length,      cor: "#e8c97a" },
            { label: "Atendimento",    valor: emAtendimento.length,   cor: "#7ae8a0" },
            { label: "Finalizados",    valor: finalizados.length,     cor: "#a89080" },
            { label: "Cancelamentos",  valor: cancelados.length,      cor: "#e87a7a" },
            { label: "Não confirmados",valor: naoConfirmados.length,  cor: "#7ab8e8" },
          ].map(k => (
            <div key={k.label} className="rounded-2xl px-4 py-3 text-center"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
              <p className="text-xl font-bold" style={{ color: k.cor }}>{k.valor}</p>
              <p className="text-[10px] uppercase tracking-widest mt-0.5 leading-tight" style={{ color: "#6b5a4e" }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Abas */}
        <div className="flex gap-1 mb-5 rounded-2xl p-1" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
          {([
            { key: "fila",         label: `Fila do Dia (${agendamentos.length})` },
            { key: "confirmacoes", label: `Confirmações (${naoConfirmados.length})` },
            { key: "faltantes",    label: `Faltantes (${faltantes.length})` },
          ] as const).map(aba => (
            <button key={aba.key} onClick={() => setAbaAtiva(aba.key)}
              className="flex-1 py-2 rounded-xl text-xs uppercase tracking-widest transition"
              style={{ background: abaAtiva === aba.key ? "rgba(200,160,120,0.15)" : "transparent", color: abaAtiva === aba.key ? "#c8a078" : "#6b5a4e" }}>
              {aba.label}
            </button>
          ))}
        </div>

        {carregando ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "#c8a078" }} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">

            {/* ABA FILA */}
            {abaAtiva === "fila" && (
              agendamentos.length === 0 ? (
                <div className="text-center py-16 rounded-3xl" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.08)" }}>
                  <p className="text-4xl mb-3">🌸</p>
                  <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhum agendamento hoje</p>
                </div>
              ) : (
                agendamentos.map(ag => <CardAgendamento key={ag.id} ag={ag} />)
              )
            )}

            {/* ABA CONFIRMAÇÕES */}
            {abaAtiva === "confirmacoes" && (
              naoConfirmados.length === 0 ? (
                <div className="text-center py-16 rounded-3xl" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.08)" }}>
                  <p className="text-4xl mb-3">✓</p>
                  <p className="text-sm" style={{ color: "#6b5a4e" }}>Todos confirmados!</p>
                </div>
              ) : (
                <>
                  <div className="px-4 py-3 rounded-2xl text-sm mb-2"
                    style={{ background: "rgba(122,184,232,0.08)", border: "1px solid rgba(122,184,232,0.2)", color: "#7ab8e8" }}>
                    {naoConfirmados.length} paciente{naoConfirmados.length > 1 ? "s" : ""} ainda não confirmaram presença.
                  </div>
                  {naoConfirmados.map(ag => (
                    <div key={ag.id} className="rounded-3xl p-5" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <p className="font-semibold" style={{ color: "#e8d5c0" }}>{nomePaciente(ag)}</p>
                          <p className="text-sm mt-0.5" style={{ color: "#a89080" }}>
                            {nomeProcedimento(ag)} · {new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => atualizarStatus(ag.id, "pendente", { chegou_em: new Date().toISOString() })}
                            className="px-3 py-1.5 rounded-xl text-xs transition hover:scale-105"
                            style={{ background: "rgba(122,232,160,0.1)", color: "#7ae8a0", border: "1px solid rgba(122,232,160,0.3)" }}>
                            ✓ Chegou
                          </button>
                          <a href={`https://wa.me/55${(ag.pacientes?.telefone ?? "").replace(/\D/g, "")}`}
                            target="_blank" rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl text-xs transition hover:scale-105"
                            style={{ background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>
                            WhatsApp
                          </a>
                          <button onClick={() => atualizarStatus(ag.id, "cancelado")}
                            className="px-3 py-1.5 rounded-xl text-xs transition hover:opacity-70"
                            style={{ background: "rgba(232,122,122,0.08)", color: "#e87a7a", border: "1px solid rgba(232,122,122,0.2)" }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )
            )}

            {/* ABA FALTANTES */}
            {abaAtiva === "faltantes" && (
              faltantes.length === 0 ? (
                <div className="text-center py-16 rounded-3xl" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.08)" }}>
                  <p className="text-4xl mb-3">✓</p>
                  <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhum faltante até agora</p>
                </div>
              ) : (
                faltantes.map(ag => (
                  <div key={ag.id} className="rounded-3xl p-5" style={{ background: "#120d0d", border: "1px solid rgba(232,122,122,0.2)" }}>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold" style={{ color: "#e8d5c0" }}>{nomePaciente(ag)}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(232,122,122,0.1)", color: "#e87a7a" }}>Não chegou</span>
                        </div>
                        <p className="text-sm" style={{ color: "#a89080" }}>
                          {nomeProcedimento(ag)} · {new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <a href={`https://wa.me/55${(ag.pacientes?.telefone ?? "").replace(/\D/g, "")}`}
                          target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl text-xs transition hover:scale-105"
                          style={{ background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>
                          WhatsApp
                        </a>
                        <button onClick={() => atualizarStatus(ag.id, "cancelado")}
                          className="px-3 py-1.5 rounded-xl text-xs transition hover:opacity-70"
                          style={{ background: "rgba(232,122,122,0.08)", color: "#e87a7a", border: "1px solid rgba(232,122,122,0.2)" }}>
                          Não compareceu
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>

      {/* PAINEL LATERAL — detalhe do agendamento */}
      {painelAberto && (
        <div className="w-80 flex-shrink-0 rounded-3xl overflow-hidden flex flex-col"
          style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)" }}>

          <div className="px-6 py-5 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(200,160,120,0.1)" }}>
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>Detalhes</p>
              <p className="font-bold" style={{ color: "#e8d5c0" }}>{nomePaciente(painelAberto)}</p>
            </div>
            <button onClick={() => setPainelAberto(null)} style={{ color: "#6b5a4e" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {[
              { label: "Procedimento", valor: nomeProcedimento(painelAberto) },
              { label: "Início", valor: new Date(painelAberto.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) },
              { label: "Fim", valor: new Date(painelAberto.fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) },
              { label: "Profissional", valor: painelAberto.funcionarios?.nome ?? "-" },
              { label: "Consultório", valor: painelAberto.consultorio ?? "-" },
              { label: "Telefone", valor: painelAberto.pacientes?.telefone ?? "-" },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2"
                style={{ borderBottom: "1px solid rgba(200,160,120,0.06)" }}>
                <span className="text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>{item.label}</span>
                <span className="text-sm" style={{ color: "#e8d5c0" }}>{item.valor}</span>
              </div>
            ))}

            {/* Status atual */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#6b5a4e" }}>Status</p>
              <div className="flex flex-col gap-2">
                {[
                  { s: "pendente", chegou: false, label: "Aguardando confirmação" },
                  { s: "pendente", chegou: true,  label: "✓ Chegou" },
                  { s: "confirmado", chegou: true, label: "Em Atendimento" },
                  { s: "finalizado", chegou: true, label: "Finalizado" },
                  { s: "cancelado",  chegou: false, label: "Cancelado" },
                ].map((opt, i) => {
                  const ativo = painelAberto.status === opt.s && (opt.chegou ? !!painelAberto.chegou_em : !painelAberto.chegou_em || opt.s === "cancelado" || opt.s === "finalizado");
                  return (
                    <button key={i}
                      onClick={() => {
                        if (opt.s === "pendente" && opt.chegou) atualizarStatus(painelAberto.id, "pendente", { chegou_em: new Date().toISOString() });
                        else atualizarStatus(painelAberto.id, opt.s);
                      }}
                      className="w-full py-2.5 rounded-xl text-xs text-left px-4 transition"
                      style={{
                        background: ativo ? "rgba(200,160,120,0.15)" : "transparent",
                        color: ativo ? "#c8a078" : "#6b5a4e",
                        border: `1px solid ${ativo ? "rgba(200,160,120,0.3)" : "rgba(200,160,120,0.08)"}`,
                      }}>
                      {ativo ? "● " : "○ "}{opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timeline */}
            {(painelAberto.chegou_em) && (
              <div>
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#6b5a4e" }}>Timeline</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#7ae8a0" }} />
                    <div>
                      <p className="text-xs font-medium" style={{ color: "#7ae8a0" }}>Chegou</p>
                      <p className="text-[10px]" style={{ color: "#6b5a4e" }}>
                        {new Date(painelAberto.chegou_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ações rápidas */}
          <div className="p-4 flex flex-col gap-2" style={{ borderTop: "1px solid rgba(200,160,120,0.1)" }}>
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
                style={{ background: "#c8a078", color: "#0a0707" }}>
                Finalizar Atendimento
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
