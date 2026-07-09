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
  funcionario_id?: string | null;
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
  finalizado: { label: "Finalizado", color: "var(--text-secondary)", bg: "rgba(168,144,128,0.15)" },
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

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
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
  const [filtroFuncionario, setFiltroFuncionario] = useState<string>("");
  const [usuarioLogado, setUsuarioLogado] = useState<{ id: string; role: string; cargo?: string } | null>(null);
  const [agendamentoParaCadastrar, setAgendamentoParaCadastrar] = useState<Agendamento | null>(null);
  const [bloqueios, setBloqueios] = useState<any[]>([]);
  const [modalBloqueio, setModalBloqueio] = useState(false);
  const [salvandoBloqueio, setSalvandoBloqueio] = useState(false);
  const [formBloqueio, setFormBloqueio] = useState({ funcionario_id: "", data_inicio: "", data_fim: "", motivo: "Bloqueado", tipo: "geral" });
  const [abaBloqueios, setAbaBloqueios] = useState(false);
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

  useEffect(() => {
    buscarDados();
    fetch("/api/agenda/bloqueios").then(r => r.json()).then(d => setBloqueios(Array.isArray(d) ? d : []));
  }, [buscarDados]);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      setUsuarioLogado(d);
      if (d?.role !== "admin" && d?.cargo !== "Recepcionista" && d?.cargo !== "Recepção") {
        setFiltroFuncionario(d?.id ?? "");
      }
    });
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
    const inicio = dataStr ? toLocalInput(new Date(dataStr).toISOString()) : toLocalInput(new Date().toISOString());
    const fim = toLocalInput(new Date(new Date(inicio).getTime() + 60 * 60000).toISOString());
    setForm({ paciente_id: "", procedimento_id: "", funcionario_id: "", inicio, fim, status: "pendente", observacoes: "" });
    setModalAberto(true);
  }

  function abrirEditar(ag: Agendamento) {
    setAgendamentoSelecionado(ag);
    setForm({
      paciente_id: ag.paciente_id ?? "",
      procedimento_id: ag.procedimentos ? (procedimentos.find(p => p.nome === ag.procedimentos?.nome)?.id ?? "") : "",
      funcionario_id: ag.funcionario_id ?? "",
      inicio: toLocalInput(ag.inicio),
      fim: toLocalInput(ag.fim),
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
        const novoFim = toLocalInput(new Date(new Date(form.inicio).getTime() + Math.max(totalMin, 60) * 60000).toISOString());
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
        body: JSON.stringify({
          status: form.status,
          observacoes: form.observacoes,
          inicio: new Date(form.inicio).toISOString(),
          fim: new Date(form.fim).toISOString(),
          procedimento_id: form.procedimento_id || null,
          funcionario_id: form.funcionario_id || null,
        }),
      });
    } else {
      await fetch("/api/agendamentos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          inicio: new Date(form.inicio).toISOString(),
          fim: new Date(form.fim).toISOString(),
        }),
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

  const agendamentosFiltrados = filtroFuncionario
    ? agendamentos.filter(ag => ag.funcionarios && (ag.funcionario_id === filtroFuncionario || funcionarios.find(f => f.id === filtroFuncionario)?.nome === ag.funcionarios?.nome))
    : agendamentos;

  const semana = Array.from({ length: 7 }, (_, i) => addDias(inicioSemana(dataAtual), i));

  function agsDoDia(data: Date) {
    return agendamentosFiltrados.filter(ag => {
      const d = new Date(ag.inicio);
      return d.getFullYear() === data.getFullYear() && d.getMonth() === data.getMonth() && d.getDate() === data.getDate();
    });
  }

  function agsDaHora(data: Date, hora: number) {
    return agsDoDia(data).filter(ag => new Date(ag.inicio).getHours() === hora);
  }

  // ✅ Cores por profissional > procedimento > status
  const corProfissional = (ag: Agendamento) => {
    if (ag.funcionarios?.cor) return ag.funcionarios.cor;
    if (ag.procedimentos?.cor) return ag.procedimentos.cor;
    const coresPorStatus: Record<string, string> = {
      confirmado: "#7ae8a0",
      pendente:   "#a89bcc",
      cancelado:  "#e87a7a",
      finalizado: "#6b5a4e",
    };
    return coresPorStatus[ag.status] ?? "#a89080";
  };

  const diasDoMes = () => {
    const primeiro = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
    const ultimo = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0);
    const dias: (Date | null)[] = [];
    const inicioGrid = (primeiro.getDay() + 6) % 7;
    for (let i = 0; i < inicioGrid; i++) dias.push(null);
    for (let i = 1; i <= ultimo.getDate(); i++) dias.push(new Date(dataAtual.getFullYear(), dataAtual.getMonth(), i));
    return dias;
  };

  // ✅ Sem cadastro E sem profissional = amarelo tracejado; com profissional = cor do profissional
  function EventoCard({ ag, compacto = false }: { ag: Agendamento; compacto?: boolean }) {
    const semCadastro = ag.sem_cadastro === true && !ag.funcionario_id;
    const cor = semCadastro ? "#fbbf24" : corProfissional(ag);
    return (
      <div onClick={(e) => { e.stopPropagation(); abrirEditar(ag); }}
        className="rounded-xl px-2 py-1.5 mb-1 cursor-pointer transition hover:scale-[1.02] text-left w-full"
        style={{
          background: `${cor}18`,
          borderLeft: `3px solid ${cor}`,
          borderTop: `1px ${semCadastro ? "dashed" : "solid"} ${cor}33`,
          borderRight: `1px ${semCadastro ? "dashed" : "solid"} ${cor}33`,
          borderBottom: `1px ${semCadastro ? "dashed" : "solid"} ${cor}33`,
        }}>
        <div className="flex items-center gap-1 flex-wrap">
          {ag.sem_cadastro && (
            <span className="text-[9px] px-1 rounded flex-shrink-0"
              style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}>⚠</span>
          )}
          <p className="text-[11px] font-semibold truncate" style={{ color: cor }}>{nomePaciente(ag)}</p>
        </div>
        {!compacto && (
          <>
            <p className="text-[10px] truncate" style={{ color: "var(--text-secondary)" }}>{procedimentoNome(ag)}</p>
            {ag.funcionarios?.nome && (
              <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{ag.funcionarios.nome}</p>
            )}
          </>
        )}
      </div>
    );
  }

  async function salvarBloqueio() {
    setSalvandoBloqueio(true);
    const res = await fetch("/api/agenda/bloqueios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formBloqueio) });
    if (res.ok) {
      setModalBloqueio(false);
      setFormBloqueio({ funcionario_id: "", data_inicio: "", data_fim: "", motivo: "Bloqueado", tipo: "geral" });
      fetch("/api/agenda/bloqueios").then(r => r.json()).then(d => setBloqueios(Array.isArray(d) ? d : []));
    }
    setSalvandoBloqueio(false);
  }

  async function deletarBloqueio(id: string) {
    await fetch("/api/agenda/bloqueios?id=" + id, { method: "DELETE" });
    fetch("/api/agenda/bloqueios").then(r => r.json()).then(d => setBloqueios(Array.isArray(d) ? d : []));
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Gestao</p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            Agenda {filtroFuncionario && usuarioLogado?.role !== "admin" ? `— ${funcionarios.find(f => f.id === filtroFuncionario)?.nome.split(" ")[0] ?? ""}` : ""}
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {funcionarios.length > 0 && (usuarioLogado?.role === "admin" || usuarioLogado?.cargo === "Recepcionista" || usuarioLogado?.cargo === "Recepção") && (
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setFiltroFuncionario("")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition hover:opacity-80"
                style={{ background: !filtroFuncionario ? "var(--gold-bg)" : "var(--bg-input)", border: `1px solid ${!filtroFuncionario ? "var(--border-color)" : "var(--border-subtle)"}`, color: !filtroFuncionario ? "var(--gold)" : "var(--text-muted)" }}>
                <span className="text-xs">Todos</span>
              </button>
              {funcionarios.map(f => (
                <button key={f.id} onClick={() => setFiltroFuncionario(filtroFuncionario === f.id ? "" : f.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition hover:opacity-80"
                  style={{ background: filtroFuncionario === f.id ? `${f.cor}22` : "var(--bg-input)", border: `1px solid ${filtroFuncionario === f.id ? f.cor : "var(--border-subtle)"}` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: f.cor }} />
                  <span className="text-xs" style={{ color: filtroFuncionario === f.id ? f.cor : "var(--text-muted)" }}>{f.nome.split(" ")[0]}</span>
                </button>
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
            style={{ background: "var(--gold)", color: "var(--bg-input)" }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
            Novo
          </button>
          <button onClick={() => setAbaBloqueios(!abaBloqueios)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition hover:scale-105"
            style={{ background: abaBloqueios ? "rgba(232,122,122,0.15)" : "var(--bg-input)", color: "var(--danger)", border: "1px solid rgba(232,122,122,0.3)" }}>
            ⛔ Bloqueios
          </button>
        </div>
      </div>

      <div className="rounded-3xl overflow-hidden flex-1 flex flex-col" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--gold-bg)" }}>
          <div className="flex items-center gap-2">
            <button onClick={() => navegar(-1)} className="w-8 h-8 rounded-xl flex items-center justify-center transition hover:opacity-70"
              style={{ border: "1px solid rgba(200,160,120,0.2)", color: "var(--gold)" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={() => setDataAtual(new Date())} className="px-3 py-1.5 rounded-xl text-xs uppercase tracking-widest transition hover:opacity-70"
              style={{ border: "1px solid rgba(200,160,120,0.2)", color: "var(--gold)" }}>Hoje</button>
            <button onClick={() => navegar(1)} className="w-8 h-8 rounded-xl flex items-center justify-center transition hover:opacity-70"
              style={{ border: "1px solid rgba(200,160,120,0.2)", color: "var(--gold)" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span className="text-sm font-semibold ml-2 capitalize" style={{ color: "var(--text-primary)" }}>{tituloAtual()}</span>
          </div>
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(200,160,120,0.2)" }}>
            {(["dia", "semana", "mes"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className="px-4 py-2 text-xs uppercase tracking-widest transition"
                style={{ background: view === v ? "rgba(200,160,120,0.15)" : "transparent", color: view === v ? "var(--gold)" : "var(--text-muted)" }}>
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
                  <div key={d} className="text-center text-xs uppercase tracking-widest py-2" style={{ color: "var(--text-muted)" }}>{d}</div>
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
                      style={{ background: ehHoje ? "rgba(200,160,120,0.08)" : "var(--bg-input)", border: ehHoje ? "1px solid rgba(200,160,120,0.3)" : "1px solid var(--border-subtle)" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: ehHoje ? "var(--gold)" : "var(--text-secondary)" }}>{dia.getDate()}</p>
                      {ags.slice(0, 2).map(ag => <EventoCard key={ag.id} ag={ag} compacto />)}
                      {ags.length > 2 && <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>+{ags.length - 2}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === "semana" && (
            <div className="min-w-[700px]">
              <div className="grid sticky top-0 z-10" style={{ gridTemplateColumns: "64px repeat(7, 1fr)", borderBottom: "1px solid var(--gold-bg)", background: "var(--bg-card)" }}>
                <div />
                {semana.map((dia, i) => {
                  const ehHoje = dia.toDateString() === new Date().toDateString();
                  return (
                    <div key={i} className="text-center py-3">
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{diasSemana[i]}</p>
                      <p className="text-lg font-bold mt-0.5" style={{ color: ehHoje ? "var(--gold)" : "var(--text-primary)" }}>{dia.getDate()}</p>
                    </div>
                  );
                })}
              </div>
              {HORAS.map(hora => (
                <div key={hora} className="grid" style={{ gridTemplateColumns: "64px repeat(7, 1fr)", borderBottom: "1px solid var(--bg-hover)", minHeight: 64 }}>
                  <div className="text-right pr-3 pt-1">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{horaStr(hora)}</span>
                  </div>
                  {semana.map((dia, i) => {
                    const ags = agsDaHora(dia, hora);
                    return (
                      <div key={i} className="border-l cursor-pointer transition hover:bg-[rgba(200,160,120,0.03)] relative p-1"
                        style={{ borderColor: "var(--border-subtle)" }}
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
              <div className="grid sticky top-0 z-10" style={{ gridTemplateColumns: "64px 1fr", borderBottom: "1px solid var(--gold-bg)", background: "var(--bg-card)" }}>
                <div />
                <div className="text-center py-3">
                  <p className="text-sm font-semibold capitalize" style={{ color: "var(--gold)" }}>
                    {dataAtual.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                </div>
              </div>
              {HORAS.map(hora => {
                const ags = agsDaHora(dataAtual, hora);
                return (
                  <div key={hora} className="grid" style={{ gridTemplateColumns: "64px 1fr", borderBottom: "1px solid var(--bg-hover)", minHeight: 72 }}>
                    <div className="text-right pr-3 pt-2">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{horaStr(hora)}</span>
                    </div>
                    <div className="border-l p-2 cursor-pointer transition hover:bg-[rgba(200,160,120,0.03)]"
                      style={{ borderColor: "var(--border-subtle)" }}
                      onClick={() => {
                        const d = new Date(dataAtual); d.setHours(hora, 0, 0, 0);
                        abrirNovoAgendamento(d.toISOString().slice(0, 16));
                      }}>
                      {ags.map(ag => {
                        // ✅ Sem cadastro E sem profissional = amarelo; com profissional = cor dele
                        const semCadastro = ag.sem_cadastro === true && !ag.funcionario_id;
                        const cor = semCadastro ? "#fbbf24" : corProfissional(ag);
                        return (
                          <div key={ag.id} onClick={(e) => { e.stopPropagation(); abrirEditar(ag); }}
                            className="rounded-xl px-3 py-2 mb-1 cursor-pointer transition hover:scale-[1.02]"
                            style={{
                              background: `${cor}18`,
                              borderLeft: `3px solid ${cor}`,
                              borderTop: `1px ${semCadastro ? "dashed" : "solid"} ${cor}33`,
                              borderRight: `1px ${semCadastro ? "dashed" : "solid"} ${cor}33`,
                              borderBottom: `1px ${semCadastro ? "dashed" : "solid"} ${cor}33`,
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
                                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                                  {procedimentoNome(ag)}
                                  {ag.procedimentos?.duracao_minutos && ` - ${ag.procedimentos.duracao_minutos} min`}
                                </p>
                                {ag.funcionarios?.nome && (
                                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{ag.funcionarios.nome}</p>
                                )}
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
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

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(200,160,120,0.2)" }}>

            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold" style={{ color: "var(--gold)" }}>
                {agendamentoSelecionado ? "Editar Agendamento" : "Novo Agendamento"}
              </h2>
              <button onClick={() => setModalAberto(false)} style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>

            {agendamentoSelecionado?.sem_cadastro && (
              <div className="flex items-center justify-between mb-5 px-4 py-3 rounded-2xl"
                style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "#fbbf24" }}>⚠ Sem cadastro</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{agendamentoSelecionado.nome_temporario} · {agendamentoSelecionado.telefone_temporario}</span>
                </div>
                <button onClick={() => { setModalAberto(false); setAgendamentoParaCadastrar(agendamentoSelecionado); }}
                  className="text-xs px-3 py-1.5 rounded-xl font-medium transition hover:scale-105"
                  style={{ background: "rgba(200,160,120,0.15)", color: "var(--gold)", border: "1px solid rgba(200,160,120,0.3)" }}>
                  Cadastrar Paciente
                </button>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {!agendamentoSelecionado && (
                <>
                  <div>
                    <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Paciente</label>
                    <select value={form.paciente_id} onChange={e => setForm(f => ({ ...f, paciente_id: e.target.value }))}
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{ background: "var(--bg-input)", border: "1px solid rgba(200,160,120,0.15)", color: form.paciente_id ? "var(--text-primary)" : "var(--text-muted)" }}>
                      <option value="">Selecionar paciente...</option>
                      {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome} - {p.telefone}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>
                      Procedimentos
                      {procedimentosSelecionados.length > 0 && (
                        <span className="ml-2 normal-case" style={{ color: "var(--gold)" }}>
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
                              background: sel ? `${p.cor}22` : "var(--bg-input)",
                              color: sel ? p.cor : "var(--text-muted)",
                              border: sel ? `1px solid ${p.cor}` : "1px solid var(--border-color)",
                            }}>
                            {sel ? "✓ " : ""}{p.nome}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Profissional Responsavel</label>
                    <select value={form.funcionario_id} onChange={e => setForm(f => ({ ...f, funcionario_id: e.target.value }))}
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{ background: "var(--bg-input)", border: "1px solid rgba(200,160,120,0.15)", color: form.funcionario_id ? "var(--text-primary)" : "var(--text-muted)" }}>
                      <option value="">Selecionar profissional...</option>
                      {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                  </div>
                </>
              )}

              {agendamentoSelecionado && (
                <>
                  <div>
                    <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Procedimento</label>
                    <select value={form.procedimento_id} onChange={e => setForm(f => ({ ...f, procedimento_id: e.target.value }))}
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{ background: "var(--bg-input)", border: "1px solid rgba(200,160,120,0.15)", color: "var(--text-primary)" }}>
                      <option value="">Manter atual ({agendamentoSelecionado.procedimentos?.nome ?? agendamentoSelecionado.procedimento ?? "—"})</option>
                      {procedimentos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Profissional</label>
                    <select value={form.funcionario_id} onChange={e => setForm(f => ({ ...f, funcionario_id: e.target.value }))}
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{ background: "var(--bg-input)", border: "1px solid rgba(200,160,120,0.15)", color: "var(--text-primary)" }}>
                      <option value="">Manter atual ({agendamentoSelecionado.funcionarios?.nome ?? "—"})</option>
                      {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Inicio</label>
                  <input type="datetime-local" value={form.inicio} onChange={e => setForm(f => ({ ...f, inicio: e.target.value }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "var(--bg-input)", border: "1px solid rgba(200,160,120,0.15)", color: "var(--text-primary)", colorScheme: "dark" }} />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Fim</label>
                  <input type="datetime-local" value={form.fim} onChange={e => setForm(f => ({ ...f, fim: e.target.value }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "var(--bg-input)", border: "1px solid rgba(200,160,120,0.15)", color: "var(--text-primary)", colorScheme: "dark" }} />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Status</label>
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
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Observacoes</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  rows={3} placeholder="Observacoes sobre o agendamento..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background: "var(--bg-input)", border: "1px solid rgba(200,160,120,0.15)", color: "var(--text-primary)" }} />
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
                style={{ border: "1px solid rgba(200,160,120,0.2)", color: "var(--text-muted)" }}>
                Fechar
              </button>
              <button onClick={salvar} disabled={salvando}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: salvando ? "rgba(200,160,120,0.4)" : "var(--gold)", color: "var(--bg-input)" }}>
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
      {abaBloqueios && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-2xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--danger)" }}>⛔ Bloqueios de Agenda</h2>
              <button onClick={() => setAbaBloqueios(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <button onClick={() => setModalBloqueio(true)} className="w-full py-3 rounded-2xl text-sm font-semibold mb-5 transition hover:scale-105" style={{ background: "rgba(232,122,122,0.1)", color: "var(--danger)", border: "1px dashed rgba(232,122,122,0.3)" }}>+ Novo Bloqueio</button>
            {bloqueios.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>Nenhum bloqueio cadastrado</p>
            ) : (
              <div className="flex flex-col gap-3">
                {bloqueios.map(b => (
                  <div key={b.id} className="flex items-center gap-4 px-4 py-3 rounded-2xl" style={{ background: "var(--bg-input)", border: "1px solid rgba(232,122,122,0.2)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{b.motivo}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{new Date(b.data_inicio).toLocaleDateString("pt-BR")} {new Date(b.data_inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} → {new Date(b.data_fim).toLocaleDateString("pt-BR")} {new Date(b.data_fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                      {b.funcionarios && <p className="text-xs mt-0.5" style={{ color: b.funcionarios.cor ?? "var(--gold)" }}>{b.funcionarios.nome}</p>}
                      {!b.funcionario_id && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Todos os profissionais</p>}
                    </div>
                    <button onClick={() => deletarBloqueio(b.id)} className="text-xs px-3 py-1.5 rounded-xl transition hover:scale-105" style={{ background: "rgba(232,122,122,0.1)", color: "var(--danger)" }}>Remover</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {modalBloqueio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--danger)" }}>Novo Bloqueio</h2>
              <button onClick={() => setModalBloqueio(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="flex flex-col gap-4">
              <div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Profissional (vazio = todos)</label>
              <select value={formBloqueio.funcionario_id} onChange={e => setFormBloqueio(f => ({ ...f, funcionario_id: e.target.value }))} className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
                <option value="">Todos os profissionais</option>
                {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select></div>
              <div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Motivo</label>
              <select value={formBloqueio.motivo} onChange={e => setFormBloqueio(f => ({ ...f, motivo: e.target.value }))} className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
                {["Bloqueado","Ferias","Folga","Almoco","Manutencao","Reuniao","Feriado"].map(m => <option key={m} value={m}>{m}</option>)}
              </select></div>
              <div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Data e Hora Inicio</label>
              <input type="datetime-local" value={formBloqueio.data_inicio} onChange={e => setFormBloqueio(f => ({ ...f, data_inicio: e.target.value }))} className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)", colorScheme: "dark" }} /></div>
              <div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Data e Hora Fim</label>
              <input type="datetime-local" value={formBloqueio.data_fim} onChange={e => setFormBloqueio(f => ({ ...f, data_fim: e.target.value }))} className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)", colorScheme: "dark" }} /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalBloqueio(false)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={salvarBloqueio} disabled={salvandoBloqueio || !formBloqueio.data_inicio || !formBloqueio.data_fim} className="flex-1 py-3 rounded-2xl text-sm font-semibold transition hover:scale-105" style={{ background: "var(--danger)", color: "white" }}>
                {salvandoBloqueio ? "Salvando..." : "Confirmar Bloqueio"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`select option { background: #120d0d; } textarea::placeholder { color: #3a2e28; }`}</style>
    </div>
  );
}