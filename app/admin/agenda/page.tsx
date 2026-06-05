"use client";

import { useEffect, useState, useCallback } from "react";
import { ModalAgendamentoRapido } from "@/components/agenda/ModalAgendamentoRapido";
import { BadgeSemCadastro, ModalCadastrarPaciente } from "@/components/agenda/AgendamentoRapidoComponents";

type Agendamento = {
  id: string;
  nome?: string | null;
  inicio: string;
  fim: string;
  status: string;
  observacoes?: string;
  sem_cadastro?: boolean;
  nome_temporario?: string | null;
  telefone_temporario?: string | null;
  paciente_id?: string | null;
  procedimento?: string | null;
  pacientes?: { nome: string; telefone: string };
  procedimentos?: { nome: string; cor: string; duracao_minutos: number };
  funcionarios?: { nome: string; cor: string };
};

type Procedimento = { id: string; nome: string; cor: string; duracao_minutos: number; preco?: number };
type Paciente = { id: string; nome: string; telefone: string };
type Funcionario = { id: string; nome: string; cor: string };

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pendente:   { label: "Pendente",   color: "#e8c97a", bg: "rgba(232,201,122,0.15)" },
  confirmado: { label: "Confirmado", color: "#7ae8a0", bg: "rgba(122,232,160,0.15)" },
  cancelado:  { label: "Cancelado",  color: "#e87a7a", bg: "rgba(232,122,122,0.15)" },
  finalizado: { label: "Finalizado", color: "#a89080", bg: "rgba(168,144,128,0.15)" },
};

const HORAS = Array.from({ length: 17 }, (_, i) => i + 7);

function horaStr(h: number) { return `${String(h).padStart(2, "0")}:00`; }
function addDias(data: Date, dias: number) { const d = new Date(data); d.setDate(d.getDate() + dias); return d; }
function inicioSemana(data: Date) {
  const d = new Date(data);
  const dia = d.getDay();
  d.setDate(d.getDate() - dia + (dia === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

function nomePaciente(ag: Agendamento) {
  return ag.pacientes?.nome ?? ag.nome_temporario ?? ag.nome ?? "Sem nome";
}

function procedimentoNome(ag: Agendamento) {
  return ag.procedimentos?.nome ?? ag.procedimento ?? "";
}

export default function AgendaPage() {
  const [view, setView] = useState<"dia" | "semana" | "mes">("semana");
  const [dataAtual, setDataAtual] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [procedimentosSelecionados, setProcedimentosSelecionados] = useState<string[]>([]);
  const [excluindo, setExcluindo] = useState(false);
  const [modalRapidoAberto, setModalRapidoAberto] = useState(false);
  const [agendamentoParaCadastrar, setAgendamentoParaCadastrar] = useState<Agendamento | null>(null);
  const [form, setForm] = useState({
    paciente_id: "", procedimento_id: "", funcionario_id: "",
    inicio: "", fim: "", status: "pendente", observacoes: "",
  });

  const buscarDados = useCallback(async () => {
    const inicio = new Date(dataAtual);
    const fim = new Date(dataAtual);
    if (view === "dia") { inicio.setHours(0,0,0,0); fim.setHours(23,59,59,999); }
    else if (view === "semana") {
      const s = inicioSemana(dataAtual);
      inicio.setTime(s.getTime());
      fim.setTime(addDias(s, 6).getTime());
      fim.setHours(23,59,59,999);
    } else {
      inicio.setDate(1); inicio.setHours(0,0,0,0);
      fim.setMonth(fim.getMonth()+1); fim.setDate(0); fim.setHours(23,59,59,999);
    }
    const res = await fetch(`/api/agendamentos?inicio=${inicio.toISOString()}&fim=${fim.toISOString()}`);
    const data = await res.json();
    setAgendamentos(Array.isArray(data) ? data : []);
  }, [dataAtual, view]);

  useEffect(() => { buscarDados(); }, [buscarDados]);

  useEffect(() => {
    fetch("/api/pacientes").then(r => r.json()).then(d => setPacientes(Array.isArray(d) ? d : []));
    fetch("/api/procedimentos").then(r => r.json()).then(d => setProcedimentos(Array.isArray(d) ? d : []));
    fetch("/api/funcionarios").then(r => r.json()).then(d => setFuncionarios(Array.isArray(d) ? d : []));
  }, []);

  function navegar(dir: number) {
    const d = new Date(dataAtual);
    if (view === "dia") d.setDate(d.getDate() + dir);
    else if (view === "semana") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setDataAtual(d);
  }

  function tituloAtual() {
    if (view === "dia") return dataAtual.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    if (view === "semana") {
      const s = inicioSemana(dataAtual);
      const e = addDias(s, 6);
      return `${s.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} - ${e.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return dataAtual.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }

  function abrirNovoAgendamento(dataStr?: string) {
    setAgendamentoSelecionado(null);
    setProcedimentosSelecionados([]);
    const inicio = dataStr ?? new Date().toISOString().slice(0, 16);
    const fim = new Date(new Date(inicio).getTime() + 60 * 60000).toISOString().slice(0, 16);
    setForm({ paciente_id: "", procedimento_id: "", funcionario_id: "", inicio, fim, status: "pendente", observacoes: "" });
    setModalAberto(true);
  }

  function abrirEditar(ag: Agendamento) {
    setAgendamentoSelecionado(ag);
    setForm({
      paciente_id: ag.paciente_id ?? "",
      procedimento_id: "",
      funcionario_id: "",
      inicio: new Date(ag.inicio).toISOString().slice(0, 16),
      fim: new Date(ag.fim).toISOString().slice(0, 16),
      status: ag.status,
      observacoes: ag.observacoes ?? "",
    });
    setModalAberto(true);
  }

  function toggleProcedimentoNovo(id: string) {
    const proc = procedimentos.find(p => p.id === id);
    if (!proc) return;
    setProcedimentosSelecionados(prev => {
      const novos = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      const totalMin = novos.reduce((acc, pid) => {
        const p = procedimentos.find(p => p.id === pid);
        return acc + (p?.duracao_minutos ?? 60);
      }, 0);
      if (form.inicio) {
        const novoFim = new Date(new Date(form.inicio).getTime() + Math.max(totalMin, 60) * 60000).toISOString().slice(0, 16);
        setForm(f => ({ ...f, procedimento_id: novos[0] ?? "", fim: novoFim }));
      }
      return novos;
    });
  }

  async function salvar() {
    setSalvando(true);
    if (agendamentoSelecionado) {
      await fetch(`/api/agendamentos/${agendamentoSelecionado.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: form.status, observacoes: form.observacoes, inicio: new Date(form.inicio).toISOString(), fim: new Date(form.fim).toISOString() }),
      });
    } else {
      await fetch("/api/agendamentos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, inicio: new Date(form.inicio).toISOString(), fim: new Date(form.fim).toISOString() }),
      });
    }
    setModalAberto(false);
    buscarDados();
    setSalvando(false);
  }

  async function excluirAgendamento(id: string) {
    if (!confirm("Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.")) return;
    setExcluindo(true);
    await fetch(`/api/agendamentos/${id}`, { method: "DELETE" });
    setModalAberto(false);
    setExcluindo(false);
    buscarDados();
  }

  async function cancelarAgendamento(id: string) {
    await fetch(`/api/agendamentos/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelado" }),
    });
    setModalAberto(false);
    buscarDados();
  }

  const semana = Array.from({ length: 7 }, (_, i) => addDias(inicioSemana(dataAtual), i));

  function agsDoDia(data: Date) {
    return agendamentos.filter(ag => {
      const d = new Date(ag.inicio);
      return d.getFullYear() === data.getFullYear() && d.getMonth() === data.getMonth() && d.getDate() === data.getDate();
    });
  }

  function agsDaHora(data: Date, hora: number) {
    return agsDoDia(data).filter(ag => new Date(ag.inicio).getHours() === hora);
  }

  const corProfissional = (ag: Agendamento) => ag.funcionarios?.cor ?? ag.procedimentos?.cor ?? "#c8a078";

  const diasDoMes = () => {
    const primeiro = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
    const ultimo = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0);
    const dias: (Date | null)[] = [];
    const inicioGrid = (primeiro.getDay() + 6) % 7;
    for (let i = 0; i < inicioGrid; i++) dias.push(null);
    for (let i = 1; i <= ultimo.getDate(); i++) dias.push(new Date(dataAtual.getFullYear(), dataAtual.getMonth(), i));
    return dias;
  };

  function EventoCard({ ag, compacto = false }: { ag: Agendamento; compacto?: boolean }) {
    const cor = ag.sem_cadastro ? "#fbbf24" : corProfissional(ag);
    const semCadastro = ag.sem_cadastro === true;
    return (
      <div onClick={(e) => { e.stopPropagation(); abrirEditar(ag); }}
        className="rounded-xl px-2 py-1.5 mb-1 cursor-pointer transition hover:scale-[1.02] text-left w-full"
        style={{
          background: semCadastro ? "rgba(251,191,36,0.08)" : `${cor}22`,
          borderLeft: `3px solid ${cor}`,
          borderStyle: semCadastro ? "dashed" : "solid",
          borderWidth: "1px 1px 1px 3px",
          borderColor: semCadastro ? `#fbbf24` : `${cor}33`,
          borderLeftStyle: "solid",
        }}>
        <div className="flex items-center gap-1 flex-wrap">
          {semCadastro && <span className="text-[9px] px-1 rounded" style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}>⚠</span>}
          <p className="text-[11px] font-semibold truncate" style={{ color: cor }}>{nomePaciente(ag)}</p>
        </div>
        {!compacto && (
          <>
            <p className="text-[10px] truncate" style={{ color: "#a89080" }}>{procedimentoNome(ag)}</p>
            {ag.funcionarios?.nome && (
              <p className="text-[10px] truncate" style={{ color: "#6b5a4e" }}>{ag.funcionarios.nome}</p>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>Gestao</p>
          <h1 className="text-3xl font-bold" style={{ color: "#e8d5c0" }}>Agenda</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {funcionarios.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {funcionarios.map(f => (
                <div key={f.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ background: `${f.cor}15`, border: `1px solid ${f.cor}40` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: f.cor }} />
                  <span className="text-xs" style={{ color: f.cor }}>{f.nome.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setModalRapidoAberto(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
            style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
            Agend. Rápido
          </button>
          <button onClick={() => abrirNovoAgendamento()}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
            style={{ background: "#c8a078", color: "#0a0707" }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
            Novo
          </button>
        </div>
      </div>

      <div className="rounded-3xl overflow-hidden flex-1 flex flex-col" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(200,160,120,0.1)" }}>
          <div className="flex items-center gap-2">
            <button onClick={() => navegar(-1)} className="w-8 h-8 rounded-xl flex items-center justify-center transition hover:opacity-70"
              style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#c8a078" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={() => setDataAtual(new Date())} className="px-3 py-1.5 rounded-xl text-xs uppercase tracking-widest transition hover:opacity-70"
              style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#c8a078" }}>Hoje</button>
            <button onClick={() => navegar(1)} className="w-8 h-8 rounded-xl flex items-center justify-center transition hover:opacity-70"
              style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#c8a078" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span className="text-sm font-semibold ml-2 capitalize" style={{ color: "#e8d5c0" }}>{tituloAtual()}</span>
          </div>
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(200,160,120,0.2)" }}>
            {(["dia", "semana", "mes"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className="px-4 py-2 text-xs uppercase tracking-widest transition"
                style={{ background: view === v ? "rgba(200,160,120,0.15)" : "transparent", color: view === v ? "#c8a078" : "#6b5a4e" }}>
                {v === "dia" ? "Dia" : v === "semana" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {view === "mes" && (
            <div className="p-4">
              <div className="grid grid-cols-7 mb-2">
                {diasSemana.map(d => (
                  <div key={d} className="text-center text-xs uppercase tracking-widest py-2" style={{ color: "#6b5a4e" }}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {diasDoMes().map((dia, i) => {
                  if (!dia) return <div key={i} />;
                  const ags = agsDoDia(dia);
                  const ehHoje = dia.toDateString() === new Date().toDateString();
                  return (
                    <div key={i} onClick={() => { setDataAtual(dia); setView("dia"); }}
                      className="rounded-2xl p-2 min-h-[80px] cursor-pointer transition hover:scale-[1.02]"
                      style={{ background: ehHoje ? "rgba(200,160,120,0.08)" : "#0e0a0a", border: ehHoje ? "1px solid rgba(200,160,120,0.3)" : "1px solid rgba(200,160,120,0.06)" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: ehHoje ? "#c8a078" : "#a89080" }}>{dia.getDate()}</p>
                      {ags.slice(0, 2).map(ag => <EventoCard key={ag.id} ag={ag} compacto />)}
                      {ags.length > 2 && <p className="text-[10px]" style={{ color: "#6b5a4e" }}>+{ags.length - 2}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === "semana" && (
            <div className="min-w-[700px]">
              <div className="grid sticky top-0 z-10" style={{ gridTemplateColumns: "64px repeat(7, 1fr)", borderBottom: "1px solid rgba(200,160,120,0.1)", background: "#120d0d" }}>
                <div />
                {semana.map((dia, i) => {
                  const ehHoje = dia.toDateString() === new Date().toDateString();
                  return (
                    <div key={i} className="text-center py-3">
                      <p className="text-xs" style={{ color: "#6b5a4e" }}>{diasSemana[i]}</p>
                      <p className="text-lg font-bold mt-0.5" style={{ color: ehHoje ? "#c8a078" : "#e8d5c0" }}>{dia.getDate()}</p>
                    </div>
                  );
                })}
              </div>
              {HORAS.map(hora => (
                <div key={hora} className="grid" style={{ gridTemplateColumns: "64px repeat(7, 1fr)", borderBottom: "1px solid rgba(200,160,120,0.04)", minHeight: 64 }}>
                  <div className="text-right pr-3 pt-1">
                    <span className="text-xs" style={{ color: "#3a2e28" }}>{horaStr(hora)}</span>
                  </div>
                  {semana.map((dia, i) => {
                    const ags = agsDaHora(dia, hora);
                    return (
                      <div key={i} className="border-l cursor-pointer transition hover:bg-[rgba(200,160,120,0.03)] relative p-1"
                        style={{ borderColor: "rgba(200,160,120,0.06)" }}
                        onClick={() => {
                          const d = new Date(dia); d.setHours(hora, 0, 0, 0);
                          abrirNovoAgendamento(d.toISOString().slice(0, 16));
                        }}>
                        {ags.map(ag => <EventoCard key={ag.id} ag={ag} />)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {view === "dia" && (
            <div className="min-w-[400px]">
              <div className="grid sticky top-0 z-10" style={{ gridTemplateColumns: "64px 1fr", borderBottom: "1px solid rgba(200,160,120,0.1)", background: "#120d0d" }}>
                <div />
                <div className="text-center py-3">
                  <p className="text-sm font-semibold capitalize" style={{ color: "#c8a078" }}>
                    {dataAtual.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                </div>
              </div>
              {HORAS.map(hora => {
                const ags = agsDaHora(dataAtual, hora);
                return (
                  <div key={hora} className="grid" style={{ gridTemplateColumns: "64px 1fr", borderBottom: "1px solid rgba(200,160,120,0.04)", minHeight: 72 }}>
                    <div className="text-right pr-3 pt-2">
                      <span className="text-xs" style={{ color: "#3a2e28" }}>{horaStr(hora)}</span>
                    </div>
                    <div className="border-l p-2 cursor-pointer transition hover:bg-[rgba(200,160,120,0.03)]"
                      style={{ borderColor: "rgba(200,160,120,0.06)" }}
                      onClick={() => {
                        const d = new Date(dataAtual); d.setHours(hora, 0, 0, 0);
                        abrirNovoAgendamento(d.toISOString().slice(0, 16));
                      }}>
                      {ags.map(ag => {
                        const cor = ag.sem_cadastro ? "#fbbf24" : corProfissional(ag);
                        return (
                          <div key={ag.id} onClick={(e) => { e.stopPropagation(); abrirEditar(ag); }}
                            className="rounded-xl px-3 py-2 mb-1 cursor-pointer transition hover:scale-[1.02]"
                            style={{
                              background: ag.sem_cadastro ? "rgba(251,191,36,0.08)" : `${cor}22`,
                              borderTop: ag.sem_cadastro ? "1px dashed #fbbf2466" : `1px solid ${cor}33`,
                              borderRight: ag.sem_cadastro ? "1px dashed #fbbf2466" : `1px solid ${cor}33`,
                              borderBottom: ag.sem_cadastro ? "1px dashed #fbbf2466" : `1px solid ${cor}33`,
                              borderLeft: `3px solid ${ag.sem_cadastro ? "#fbbf24" : cor}`,
                            }}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {ag.sem_cadastro && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                                      style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>⚠ Sem cadastro</span>
                                  )}
                                  <p className="text-sm font-semibold truncate" style={{ color: cor }}>{nomePaciente(ag)}</p>
                                </div>
                                <p className="text-xs mt-0.5 truncate" style={{ color: "#a89080" }}>
                                  {procedimentoNome(ag)}
                                  {ag.procedimentos?.duracao_minutos && ` - ${ag.procedimentos.duracao_minutos} min`}
                                </p>
                                {ag.funcionarios?.nome && (
                                  <p className="text-xs" style={{ color: "#6b5a4e" }}>{ag.funcionarios.nome}</p>
                                )}
                                <p className="text-xs" style={{ color: "#6b5a4e" }}>
                                  {new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} - {new Date(ag.fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: statusConfig[ag.status]?.bg, color: statusConfig[ag.status]?.color }}>
                                {statusConfig[ag.status]?.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL EDITAR / NOVO AGENDAMENTO */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
            style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)" }}>

            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold" style={{ color: "#c8a078" }}>
                {agendamentoSelecionado ? "Editar Agendamento" : "Novo Agendamento"}
              </h2>
              <button onClick={() => setModalAberto(false)} style={{ color: "#6b5a4e" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Badge sem cadastro + botão cadastrar paciente */}
            {agendamentoSelecionado?.sem_cadastro && (
              <div className="flex items-center justify-between mb-5 px-4 py-3 rounded-2xl"
                style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "#fbbf24" }}>⚠ Sem cadastro</span>
                  <span className="text-xs" style={{ color: "#6b5a4e" }}>{agendamentoSelecionado.nome_temporario} · {agendamentoSelecionado.telefone_temporario}</span>
                </div>
                <button
                  onClick={() => { setModalAberto(false); setAgendamentoParaCadastrar(agendamentoSelecionado); }}
                  className="text-xs px-3 py-1.5 rounded-xl font-medium transition hover:scale-105"
                  style={{ background: "rgba(200,160,120,0.15)", color: "#c8a078", border: "1px solid rgba(200,160,120,0.3)" }}>
                  Cadastrar Paciente
                </button>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {!agendamentoSelecionado && (
                <>
                  <div>
                    <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Paciente</label>
                    <select value={form.paciente_id} onChange={e => setForm(f => ({ ...f, paciente_id: e.target.value }))}
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: form.paciente_id ? "#e8d5c0" : "#3a2e28" }}>
                      <option value="">Selecionar paciente...</option>
                      {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome} - {p.telefone}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>
                      Procedimentos
                      {procedimentosSelecionados.length > 0 && (
                        <span className="ml-2 normal-case" style={{ color: "#c8a078" }}>
                          ({procedimentosSelecionados.length} · {procedimentosSelecionados.reduce((acc, id) => {
                            const p = procedimentos.find(p => p.id === id);
                            return acc + (p?.duracao_minutos ?? 0);
                          }, 0)}min)
                        </span>
                      )}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {procedimentos.map(p => {
                        const sel = procedimentosSelecionados.includes(p.id);
                        return (
                          <button key={p.id} type="button" onClick={() => toggleProcedimentoNovo(p.id)}
                            className="px-3 py-1.5 rounded-xl text-xs transition hover:scale-105"
                            style={{
                              background: sel ? `${p.cor}22` : "#0e0a0a",
                              color: sel ? p.cor : "#6b5a4e",
                              border: sel ? `1px solid ${p.cor}` : "1px solid rgba(200,160,120,0.12)",
                            }}>
                            {sel ? "✓ " : ""}{p.nome}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Profissional Responsavel</label>
                    <select value={form.funcionario_id} onChange={e => setForm(f => ({ ...f, funcionario_id: e.target.value }))}
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: form.funcionario_id ? "#e8d5c0" : "#3a2e28" }}>
                      <option value="">Selecionar profissional...</option>
                      {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                    {form.funcionario_id && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: funcionarios.find(f => f.id === form.funcionario_id)?.cor ?? "#c8a078" }} />
                        <span className="text-xs" style={{ color: "#6b5a4e" }}>{funcionarios.find(f => f.id === form.funcionario_id)?.nome}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Inicio</label>
                  <input type="datetime-local" value={form.inicio} onChange={e => setForm(f => ({ ...f, inicio: e.target.value }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Fim</label>
                  <input type="datetime-local" value={form.fim} onChange={e => setForm(f => ({ ...f, fim: e.target.value }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Status</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <button key={key} onClick={() => setForm(f => ({ ...f, status: key }))}
                      className="px-4 py-2 rounded-xl text-xs font-semibold transition"
                      style={{ background: form.status === key ? cfg.bg : "transparent", color: cfg.color, border: `1px solid ${form.status === key ? cfg.color : "rgba(200,160,120,0.15)"}` }}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Observacoes</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  rows={3} placeholder="Observacoes sobre o agendamento..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {agendamentoSelecionado && (
                <>
                  <button onClick={() => excluirAgendamento(agendamentoSelecionado.id)} disabled={excluindo}
                    className="px-4 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                    style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                    {excluindo ? "..." : "Excluir"}
                  </button>
                  <button onClick={() => cancelarAgendamento(agendamentoSelecionado.id)}
                    className="px-4 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                    style={{ border: "1px solid rgba(232,122,122,0.3)", color: "#e87a7a" }}>
                    Cancelar
                  </button>
                </>
              )}
              <button onClick={() => setModalAberto(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#6b5a4e" }}>
                Fechar
              </button>
              <button onClick={salvar} disabled={salvando}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: salvando ? "rgba(200,160,120,0.4)" : "#c8a078", color: "#0a0707" }}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalRapidoAberto && (
        <ModalAgendamentoRapido
          inicioSugerido={new Date().toISOString().slice(0, 16)}
          onClose={() => setModalRapidoAberto(false)}
          onSuccess={buscarDados}
        />
      )}
      {agendamentoParaCadastrar && (
        <ModalCadastrarPaciente
          agendamento={agendamentoParaCadastrar}
          onClose={() => setAgendamentoParaCadastrar(null)}
          onSuccess={buscarDados}
        />
      )}
      <style>{`select option { background: #120d0d; } textarea::placeholder { color: #3a2e28; }`}</style>
    </div>
  );
}




