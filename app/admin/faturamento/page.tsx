"use client";

import { useEffect, useState, useCallback } from "react";

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
  funcionarios?: { nome: string; cor: string };
};

type Resumo = {
  totalBruto: number;
  totalPendente: number;
  ticketMedio: number;
  totalAtendimentos: number;
  porForma: Record<string, number>;
  porProcedimento: { nome: string; total: number }[];
};

type Agendamento = { id: string; inicio: string; pacientes?: { nome: string }; procedimentos?: { nome: string; cor: string; preco?: number }; funcionarios?: { nome: string } };
type Funcionario = { id: string; nome: string; cor: string };

const formas = [
  { key: "dinheiro", label: "Dinheiro", icon: "💵" },
  { key: "pix", label: "PIX", icon: "📱" },
  { key: "debito", label: "Debito", icon: "💳" },
  { key: "credito", label: "Credito", icon: "💳" },
  { key: "transferencia", label: "Transferencia", icon: "🏦" },
];

const statusPag = [
  { key: "pago", label: "Pago", color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  { key: "pendente", label: "Pendente", color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  { key: "cancelado", label: "Cancelado", color: "#e87a7a", bg: "rgba(232,122,122,0.1)" },
];

const periodos = [
  { key: "hoje", label: "Hoje" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
  { key: "custom", label: "Periodo" },
];

function getPeriodo(key: string) {
  const agora = new Date();
  if (key === "hoje") {
    const i = new Date(agora); i.setHours(0,0,0,0);
    const f = new Date(agora); f.setHours(23,59,59,999);
    return { inicio: i.toISOString(), fim: f.toISOString() };
  }
  if (key === "semana") {
    const i = new Date(agora); i.setDate(agora.getDate() - agora.getDay()); i.setHours(0,0,0,0);
    const f = new Date(agora); f.setHours(23,59,59,999);
    return { inicio: i.toISOString(), fim: f.toISOString() };
  }
  if (key === "mes") {
    const i = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const f = new Date(agora); f.setHours(23,59,59,999);
    return { inicio: i.toISOString(), fim: f.toISOString() };
  }
  return null;
}

export default function FaturamentoPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState("mes");
  const [customInicio, setCustomInicio] = useState("");
  const [customFim, setCustomFim] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    agendamento_id: "", paciente_id: "", procedimento_id: "",
    funcionario_id: "", valor: "", desconto: "0",
    forma_pagamento: "pix", status_pagamento: "pago", observacoes: "",
  });

  const buscar = useCallback(async () => {
    setCarregando(true);
    let url = "/api/faturamento?";
    if (periodo !== "custom") {
      const p = getPeriodo(periodo);
      if (p) url += `inicio=${p.inicio}&fim=${p.fim}`;
    } else if (customInicio && customFim) {
      url += `inicio=${new Date(customInicio).toISOString()}&fim=${new Date(customFim + "T23:59:59").toISOString()}`;
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
    fetch(`/api/agendamentos?inicio=${p?.inicio}&fim=${p?.fim}`)
      .then(r => r.json()).then(d => setAgendamentos(Array.isArray(d) ? d : []));
    fetch("/api/funcionarios").then(r => r.json()).then(d => setFuncionarios(Array.isArray(d) ? d : []));
  }, []);

  function selecionarAgendamento(id: string) {
    const ag = agendamentos.find(a => a.id === id);
    if (!ag) return;
    setForm(f => ({
      ...f,
      agendamento_id: id,
      paciente_id: "",
      procedimento_id: "",
      valor: ag.procedimentos?.preco?.toString() ?? "",
    }));
  }

  async function salvar() {
    setSalvando(true);
    await fetch("/api/faturamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setModalAberto(false);
    setForm({ agendamento_id: "", paciente_id: "", procedimento_id: "", funcionario_id: "", valor: "", desconto: "0", forma_pagamento: "pix", status_pagamento: "pago", observacoes: "" });
    buscar();
    setSalvando(false);
  }

  const valorFinal = (Number(form.valor) - Number(form.desconto || 0));

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>Financeiro</p>
          <h1 className="text-3xl font-bold" style={{ color: "#e8d5c0" }}>Faturamento</h1>
        </div>
        <button onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{ background: "#c8a078", color: "#0a0707" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          Registrar Pagamento
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {periodos.map(p => (
          <button key={p.key} onClick={() => setPeriodo(p.key)}
            className="px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition"
            style={{ background: periodo === p.key ? "rgba(200,160,120,0.15)" : "#120d0d", color: periodo === p.key ? "#c8a078" : "#6b5a4e", border: `1px solid ${periodo === p.key ? "rgba(200,160,120,0.3)" : "rgba(200,160,120,0.1)"}` }}>
            {p.label}
          </button>
        ))}
        {periodo === "custom" && (
          <div className="flex gap-2 items-center">
            <input type="date" value={customInicio} onChange={e => setCustomInicio(e.target.value)}
              className="rounded-xl px-3 py-2 text-xs outline-none"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)", color: "#e8d5c0" }} />
            <span style={{ color: "#6b5a4e" }}>ate</span>
            <input type="date" value={customFim} onChange={e => setCustomFim(e.target.value)}
              className="rounded-xl px-3 py-2 text-xs outline-none"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)", color: "#e8d5c0" }} />
          </div>
        )}
      </div>

      {resumo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Faturamento", valor: `R$ ${resumo.totalBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: "💰", sub: "confirmado" },
            { label: "Pendente", valor: `R$ ${resumo.totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: "⏳", sub: "a receber" },
            { label: "Ticket Medio", valor: `R$ ${resumo.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: "📊", sub: "por atendimento" },
            { label: "Atendimentos", valor: resumo.totalAtendimentos, icon: "✅", sub: "pagos" },
          ].map((card, i) => (
            <div key={i} className="rounded-3xl p-6" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
              <div className="text-2xl mb-3">{card.icon}</div>
              <p className="text-2xl font-bold mb-1" style={{ color: "#c8a078" }}>{card.valor}</p>
              <p className="text-sm" style={{ color: "#e8d5c0" }}>{card.label}</p>
              <p className="text-xs mt-0.5" style={{ color: "#6b5a4e" }}>{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {resumo && Object.keys(resumo.porForma).length > 0 && (
          <div className="rounded-3xl p-6" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
            <h2 className="text-xs uppercase tracking-widest mb-5" style={{ color: "#c8a078" }}>Por Forma de Pagamento</h2>
            <div className="flex flex-col gap-3">
              {Object.entries(resumo.porForma).map(([forma, total]) => {
                const max = Math.max(...Object.values(resumo.porForma));
                const pct = Math.round((total / max) * 100);
                const f = formas.find(x => x.key === forma);
                return (
                  <div key={forma}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm" style={{ color: "#e8d5c0" }}>{f?.icon} {f?.label ?? forma}</span>
                      <span className="text-sm font-semibold" style={{ color: "#c8a078" }}>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(200,160,120,0.1)" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: "#c8a078" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {resumo && resumo.porProcedimento.length > 0 && (
          <div className="rounded-3xl p-6" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
            <h2 className="text-xs uppercase tracking-widest mb-5" style={{ color: "#c8a078" }}>Procedimentos Mais Lucrativos</h2>
            <div className="flex flex-col gap-3">
              {resumo.porProcedimento.map((p, i) => {
                const max = resumo.porProcedimento[0].total;
                const pct = Math.round((p.total / max) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm" style={{ color: "#e8d5c0" }}>{p.nome}</span>
                      <span className="text-sm font-semibold" style={{ color: "#c8a078" }}>R$ {p.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(200,160,120,0.1)" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: "#c8a078" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl overflow-hidden" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(200,160,120,0.1)" }}>
          <h2 className="text-xs uppercase tracking-widest" style={{ color: "#c8a078" }}>Registros</h2>
        </div>
        {carregando ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "#c8a078" }} />
          </div>
        ) : registros.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">💰</p>
            <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhum registro no periodo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(200,160,120,0.08)" }}>
                  {["Data", "Paciente", "Procedimento", "Profissional", "Valor", "Desconto", "Total", "Forma", "Status", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registros.map((r, i) => {
                  const sp = statusPag.find(s => s.key === r.status_pagamento);
                  const f = formas.find(x => x.key === r.forma_pagamento);
                  return (
                    <tr key={r.id} style={{ borderBottom: i < registros.length - 1 ? "1px solid rgba(200,160,120,0.05)" : "none" }}>
                      <td className="px-5 py-3 text-xs" style={{ color: "#6b5a4e" }}>
                        {new Date(r.criado_em).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#e8d5c0" }}>{r.pacientes?.nome ?? "-"}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {r.procedimentos?.cor && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.procedimentos.cor }} />}
                          <span className="text-sm" style={{ color: "#a89080" }}>{r.procedimentos?.nome ?? "-"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#a89080" }}>{r.funcionarios?.nome ?? "-"}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#e8d5c0" }}>R$ {Number(r.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#e87a7a" }}>{r.desconto > 0 ? `-R$ ${Number(r.desconto).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"}</td>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: "#c8a078" }}>R$ {Number(r.valor_final).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#6b5a4e" }}>{f?.icon} {f?.label}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: sp?.color, background: sp?.bg }}>{sp?.label}</span>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: "#3a2e28" }}>{r.observacoes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl p-8 max-h-[90vh] overflow-y-auto" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: "#c8a078" }}>Registrar Pagamento</h2>
              <button onClick={() => setModalAberto(false)} style={{ color: "#6b5a4e" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Agendamento (opcional)</label>
                <select value={form.agendamento_id} onChange={e => selecionarAgendamento(e.target.value)}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: form.agendamento_id ? "#e8d5c0" : "#3a2e28" }}>
                  <option value="">Selecionar agendamento...</option>
                  {agendamentos.map(ag => (
                    <option key={ag.id} value={ag.id}>
                      {ag.pacientes?.nome} - {ag.procedimentos?.nome} - {new Date(ag.inicio).toLocaleDateString("pt-BR")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Profissional</label>
                <select value={form.funcionario_id} onChange={e => setForm(f => ({ ...f, funcionario_id: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: form.funcionario_id ? "#e8d5c0" : "#3a2e28" }}>
                  <option value="">Selecionar profissional...</option>
                  {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Valor (R$)</label>
                  <input type="number" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                    placeholder="0,00" className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Desconto (R$)</label>
                  <input type="number" value={form.desconto} onChange={e => setForm(f => ({ ...f, desconto: e.target.value }))}
                    placeholder="0,00" className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
                </div>
              </div>
              {form.valor && (
                <div className="rounded-2xl px-4 py-3 flex justify-between" style={{ background: "rgba(200,160,120,0.06)", border: "1px solid rgba(200,160,120,0.15)" }}>
                  <span className="text-sm" style={{ color: "#a89080" }}>Total final</span>
                  <span className="text-lg font-bold" style={{ color: "#c8a078" }}>R$ {valorFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div>
                <label className="text-xs uppercase tracking-widest block mb-3" style={{ color: "#a89080" }}>Forma de Pagamento</label>
                <div className="grid grid-cols-3 gap-2">
                  {formas.map(f => (
                    <button key={f.key} onClick={() => setForm(fm => ({ ...fm, forma_pagamento: f.key }))}
                      className="py-2.5 rounded-xl text-xs text-center transition"
                      style={{ background: form.forma_pagamento === f.key ? "rgba(200,160,120,0.15)" : "#0e0a0a", color: form.forma_pagamento === f.key ? "#c8a078" : "#6b5a4e", border: `1px solid ${form.forma_pagamento === f.key ? "rgba(200,160,120,0.3)" : "rgba(200,160,120,0.1)"}` }}>
                      {f.icon} {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-3" style={{ color: "#a89080" }}>Status</label>
                <div className="flex gap-2">
                  {statusPag.map(s => (
                    <button key={s.key} onClick={() => setForm(f => ({ ...f, status_pagamento: s.key }))}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition"
                      style={{ background: form.status_pagamento === s.key ? s.bg : "transparent", color: s.color, border: `1px solid ${form.status_pagamento === s.key ? s.color : "rgba(200,160,120,0.15)"}` }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Observacoes</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  rows={2} placeholder="Obs financeiras..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#6b5a4e" }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando || !form.valor}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: !form.valor ? "rgba(200,160,120,0.3)" : "#c8a078", color: "#0a0707" }}>
                {salvando ? "Salvando..." : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`select option { background: #120d0d; } input::placeholder, textarea::placeholder { color: #3a2e28; }`}</style>
    </div>
  );
}