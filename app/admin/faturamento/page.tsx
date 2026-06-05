"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

type Registro = {
  id: string;
  valor: number;
  desconto: number;
  valor_final: number;
  forma_pagamento: string;
  status_pagamento: string;
  observacoes?: string;
  criado_em: string;
  pacientes?: { nome: string };
  procedimentos?: { nome: string; cor: string };
  funcionarios?: { nome: string };
};

type Resumo = {
  totalBruto: number;
  totalPendente: number;
  ticketMedio: number;
  totalAtendimentos: number;
  porForma: Record<string, number>;
  porProcedimento: { nome: string; total: number }[];
};

type Agendamento = {
  id: string;
  inicio: string;
  pacientes?: { nome: string };
  procedimentos?: { nome: string; cor: string; preco?: number };
  funcionarios?: { nome: string };
};

type Funcionario = { id: string; nome: string; cor: string };

const formas = [
  { key: "dinheiro",     label: "Dinheiro",      icon: "💵" },
  { key: "pix",          label: "PIX",            icon: "📲" },
  { key: "debito",       label: "Débito",         icon: "💳" },
  { key: "credito",      label: "Crédito",        icon: "💳" },
  { key: "transferencia",label: "Transferência",  icon: "🔁" },
];

const statusPag = [
  { key: "pago",     label: "Pago",     color: "#7ae8a0", bg: "rgba(122,232,160,0.12)" },
  { key: "pendente", label: "Pendente", color: "#e8c97a", bg: "rgba(232,201,122,0.12)" },
  { key: "cancelado",label: "Cancelado",color: "#e87a7a", bg: "rgba(232,122,122,0.12)" },
];

const periodos = [
  { key: "hoje",   label: "Hoje"    },
  { key: "semana", label: "Semana"  },
  { key: "mes",    label: "Mês"     },
  { key: "custom", label: "Período" },
];

function getPeriodo(key: string) {
  const agora = new Date();
  if (key === "hoje") {
    const i = new Date(); i.setHours(0,0,0,0);
    const f = new Date(); f.setHours(23,59,59,999);
    return { inicio: i.toISOString(), fim: f.toISOString() };
  }
  if (key === "semana") {
    const i = new Date(); i.setDate(agora.getDate() - agora.getDay()); i.setHours(0,0,0,0);
    const f = new Date(); f.setHours(23,59,59,999);
    return { inicio: i.toISOString(), fim: f.toISOString() };
  }
  if (key === "mes") {
    const i = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const f = new Date(); f.setHours(23,59,59,999);
    return { inicio: i.toISOString(), fim: f.toISOString() };
  }
  return null;
}

const formInicial = {
  agendamento_id: "", paciente_id: "", procedimento_id: "",
  funcionario_id: "", valor: "", desconto: "0",
  forma_pagamento: "pix", status_pagamento: "pago", observacoes: "",
};

export default function FaturamentoPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState("mes");
  const [customInicio, setCustomInicio] = useState("");
  const [customFim, setCustomFim] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Registro | null>(null);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [buscaAgendamento, setBuscaAgendamento] = useState("");
  const [form, setForm] = useState(formInicial);

  const buscar = useCallback(async () => {
    setCarregando(true);
    let url = "/api/faturamento?";
    if (periodo !== "custom") {
      const p = getPeriodo(periodo);
      if (p) url += `inicio=${p.inicio}&fim=${p.fim}`;
    } else {
      if (customInicio && customFim) {
        url += `inicio=${new Date(customInicio).toISOString()}&fim=${new Date(customFim + "T23:59:59").toISOString()}`;
      }
    }
    const res = await fetch(url);
    const data = await res.json();
    setRegistros(data.registros ?? []);
    setResumo(data.resumo ?? null);
    setCarregando(false);
  }, [periodo, customInicio, customFim]);

  useEffect(() => { buscar(); }, [buscar]);

  useEffect(() => {
    const p = getPeriodo("mes");
    fetch(`/api/agendamentos?inicio=${p?.inicio}&fim=${p?.fim}`).then(r => r.json()).then(d => setAgendamentos(Array.isArray(d) ? d : []));
    fetch("/api/funcionarios").then(r => r.json()).then(d => setFuncionarios(Array.isArray(d) ? d : []));
  }, []);

  function abrirNovo() {
    setEditando(null);
    setForm(formInicial);
    setBuscaAgendamento("");
    setModalAberto(true);
  }

  function abrirEdicao(r: Registro) {
    setEditando(r);
    setForm({
      agendamento_id: "", paciente_id: "", procedimento_id: "",
      funcionario_id: "", valor: String(r.valor),
      desconto: String(r.desconto ?? 0),
      forma_pagamento: r.forma_pagamento,
      status_pagamento: r.status_pagamento,
      observacoes: r.observacoes ?? "",
    });
    setModalAberto(true);
  }

  function selecionarAgendamento(id: string) {
    const ag = agendamentos.find(a => a.id === id);
    if (!ag) return;
    setForm(f => ({ ...f, agendamento_id: id, valor: ag.procedimentos?.preco?.toString() ?? "" }));
  }

  async function salvar() {
    setSalvando(true);
    try {
      const method = editando ? "PUT" : "POST";
      const url = editando ? `/api/faturamento/${editando.id}` : "/api/faturamento";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setModalAberto(false);
      setEditando(null);
      setForm(formInicial);
      buscar();
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este registro financeiro?")) return;
    setExcluindo(id);
    await fetch(`/api/faturamento/${id}`, { method: "DELETE" });
    setExcluindo(null);
    buscar();
  }

  const valorFinal = useMemo(() => Number(form.valor || 0) - Number(form.desconto || 0), [form.valor, form.desconto]);

  const agendamentosFiltrados = agendamentos.filter(ag => {
    const txt = buscaAgendamento.toLowerCase();
    return ag.pacientes?.nome?.toLowerCase().includes(txt) || ag.procedimentos?.nome?.toLowerCase().includes(txt);
  });

  const inp = "w-full rounded-2xl px-4 py-3 text-sm outline-none";
  const inpStyle = { background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Financeiro</p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Faturamento</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Controle total de pagamentos da clínica</p>
        </div>
        <button onClick={abrirNovo}
          className="px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{ background: "var(--gold)", color: "#0a0707" }}>
          + Registrar Pagamento
        </button>
      </div>

      {/* Filtro período */}
      <div className="flex gap-2 flex-wrap mb-4">
        {periodos.map(p => (
          <button key={p.key} onClick={() => setPeriodo(p.key)}
            className="px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition"
            style={{
              background: periodo === p.key ? "var(--gold-bg)" : "var(--bg-card)",
              color: periodo === p.key ? "var(--gold)" : "var(--text-muted)",
              border: `1px solid ${periodo === p.key ? "var(--border-color)" : "var(--border-subtle)"}`,
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Período customizado */}
      {periodo === "custom" && (
        <div className="flex gap-3 mb-4 flex-wrap">
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>De</label>
            <input type="date" value={customInicio} onChange={e => setCustomInicio(e.target.value)}
              className={inp} style={{ ...inpStyle, colorScheme: "dark" }} />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Até</label>
            <input type="date" value={customFim} onChange={e => setCustomFim(e.target.value)}
              className={inp} style={{ ...inpStyle, colorScheme: "dark" }} />
          </div>
        </div>
      )}

      {/* KPIs */}
      {resumo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Faturamento",  valor: `R$ ${resumo.totalBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,    cor: "var(--gold)"    },
            { label: "Pendente",     valor: `R$ ${resumo.totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,  cor: "var(--warning)" },
            { label: "Ticket Médio", valor: `R$ ${resumo.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,    cor: "var(--info)"    },
            { label: "Atendimentos", valor: resumo.totalAtendimentos,                                                             cor: "var(--success)" },
          ].map(k => (
            <div key={k.label} className="rounded-2xl px-5 py-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <p className="text-2xl font-bold" style={{ color: k.cor }}>{k.valor}</p>
              <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Gráficos */}
      {resumo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Por forma de pagamento */}
          <div className="rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <h3 className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--gold)" }}>Por Forma de Pagamento</h3>
            {Object.keys(resumo.porForma).length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum dado ainda</p>
            ) : (
              <div className="flex flex-col gap-3">
                {Object.entries(resumo.porForma).sort((a,b) => b[1]-a[1]).map(([forma, valor]) => {
                  const max = Math.max(...Object.values(resumo.porForma));
                  const pct = Math.round((valor / max) * 100);
                  const label = formas.find(f => f.key === forma)?.label ?? forma;
                  return (
                    <div key={forma}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm" style={{ color: "var(--text-primary)" }}>{label}</span>
                        <span className="text-sm font-semibold" style={{ color: "var(--gold)" }}>
                          R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "var(--bg-input)" }}>
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--gold)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Por procedimento */}
          <div className="rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <h3 className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--gold)" }}>Top Procedimentos</h3>
            {resumo.porProcedimento.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum dado ainda</p>
            ) : (
              <div className="flex flex-col gap-3">
                {resumo.porProcedimento.slice(0, 5).map((p, i) => {
                  const max = resumo.porProcedimento[0].total;
                  const pct = Math.round((p.total / max) * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{p.nome}</span>
                        <span className="text-sm font-semibold flex-shrink-0 ml-2" style={{ color: "var(--gold)" }}>
                          R$ {p.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "var(--bg-input)" }}>
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--success)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 className="text-xs uppercase tracking-widest" style={{ color: "var(--gold)" }}>Histórico Financeiro</h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{registros.length} registro{registros.length !== 1 ? "s" : ""}</p>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} />
          </div>
        ) : registros.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">💰</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum registro encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {["Paciente","Procedimento","Profissional","Valor","Desconto","Forma","Status","Data",""].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registros.map((r, i) => {
                  const status = statusPag.find(s => s.key === r.status_pagamento);
                  const forma = formas.find(f => f.key === r.forma_pagamento);
                  return (
                    <tr key={r.id} className="transition hover:bg-[var(--bg-hover)]"
                      style={{ borderBottom: i < registros.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                      <td className="px-5 py-4 text-sm" style={{ color: "var(--text-primary)" }}>{r.pacientes?.nome ?? "—"}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>{r.procedimentos?.nome ?? "—"}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>{r.funcionarios?.nome ?? "—"}</td>
                      <td className="px-5 py-4 text-sm font-bold" style={{ color: "var(--gold)" }}>
                        R$ {Number(r.valor_final).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
                        {r.desconto > 0 ? `- R$ ${Number(r.desconto).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>{forma?.icon} {forma?.label}</td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ color: status?.color, background: status?.bg }}>
                          {status?.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
                        {new Date(r.criado_em).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => abrirEdicao(r)}
                            className="p-1.5 rounded-lg transition hover:opacity-70"
                            style={{ background: "var(--gold-bg)" }}>
                            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="var(--gold)" strokeWidth={1.5}>
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button onClick={() => excluir(r.id)} disabled={excluindo === r.id}
                            className="p-1.5 rounded-lg transition hover:opacity-70"
                            style={{ background: "rgba(232,122,122,0.1)" }}>
                            {excluindo === r.id
                              ? <div className="w-3.5 h-3.5 rounded-full border animate-spin" style={{ borderColor: "rgba(232,122,122,0.3)", borderTopColor: "var(--danger)" }} />
                              : <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="var(--danger)" strokeWidth={1.5}>
                                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}>
          <div className="w-full max-w-2xl rounded-3xl p-8 max-h-[95vh] overflow-y-auto"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>

            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest" style={{ color: "var(--gold)" }}>Financeiro</p>
                <h2 className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
                  {editando ? "Editar Pagamento" : "Registrar Pagamento"}
                </h2>
              </div>
              <button onClick={() => setModalAberto(false)} style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div className="flex flex-col gap-5">
              {!editando && (
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Buscar Agendamento</label>
                  <input type="text" value={buscaAgendamento} onChange={e => setBuscaAgendamento(e.target.value)}
                    placeholder="Nome do paciente ou procedimento..."
                    className={inp} style={inpStyle} />
                  <div className="max-h-48 overflow-y-auto flex flex-col gap-2 mt-2">
                    {agendamentosFiltrados.map(ag => (
                      <button key={ag.id} onClick={() => selecionarAgendamento(ag.id)}
                        className="text-left p-3 rounded-2xl transition hover:scale-[1.01]"
                        style={{
                          background: form.agendamento_id === ag.id ? "var(--gold-bg)" : "var(--bg-input)",
                          border: `1px solid ${form.agendamento_id === ag.id ? "var(--border-color)" : "var(--border-subtle)"}`,
                        }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{ag.pacientes?.nome}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{ag.procedimentos?.nome}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold" style={{ color: "var(--gold)" }}>R$ {ag.procedimentos?.preco ?? 0}</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(ag.inicio).toLocaleDateString("pt-BR")}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Profissional</label>
                <select value={form.funcionario_id} onChange={e => setForm(f => ({ ...f, funcionario_id: e.target.value }))}
                  className={inp} style={{ ...inpStyle, color: form.funcionario_id ? "var(--text-primary)" : "var(--text-muted)" }}>
                  <option value="">Selecionar profissional</option>
                  {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Valor (R$)</label>
                  <input type="number" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                    className={inp} style={inpStyle} placeholder="0,00" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Desconto (R$)</label>
                  <input type="number" value={form.desconto} onChange={e => setForm(f => ({ ...f, desconto: e.target.value }))}
                    className={inp} style={inpStyle} placeholder="0,00" />
                </div>
              </div>

              <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
                style={{ background: "var(--gold-bg)", border: "1px solid var(--border-color)" }}>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Total Final</span>
                <span className="text-xl font-bold" style={{ color: "var(--gold)" }}>R$ {valorFinal.toFixed(2)}</span>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Forma de Pagamento</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {formas.map(f => (
                    <button key={f.key} onClick={() => setForm(fm => ({ ...fm, forma_pagamento: f.key }))}
                      className="py-2.5 rounded-2xl text-xs transition"
                      style={{
                        background: form.forma_pagamento === f.key ? "var(--gold-bg)" : "var(--bg-input)",
                        color: form.forma_pagamento === f.key ? "var(--gold)" : "var(--text-muted)",
                        border: `1px solid ${form.forma_pagamento === f.key ? "var(--border-color)" : "var(--border-subtle)"}`,
                      }}>
                      {f.icon} {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {statusPag.map(s => (
                    <button key={s.key} onClick={() => setForm(f => ({ ...f, status_pagamento: s.key }))}
                      className="py-2.5 rounded-2xl text-sm font-medium transition"
                      style={{
                        background: form.status_pagamento === s.key ? s.bg : "var(--bg-input)",
                        color: s.color,
                        border: `1px solid ${form.status_pagamento === s.key ? s.color : "var(--border-subtle)"}`,
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  rows={3} placeholder="Ex: cliente pagou metade agora..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                  style={inpStyle} />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setModalAberto(false)}
                  className="flex-1 py-3 rounded-2xl text-sm transition hover:opacity-70"
                  style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                  Cancelar
                </button>
                <button onClick={salvar} disabled={salvando || !form.valor}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold transition hover:scale-105"
                  style={{ background: "var(--gold)", color: "#0a0707", opacity: salvando ? 0.7 : 1 }}>
                  {salvando ? "Salvando..." : editando ? "Salvar Alterações" : "Registrar Pagamento"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`select option { background: var(--bg-card); } input::placeholder, textarea::placeholder { color: var(--text-muted); }`}</style>
    </div>
  );
}
