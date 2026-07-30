"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";

type Registro = {
  id: string;
  valor: number;
  desconto: number;
  valor_final: number;
  forma_pagamento: string;
  formas_pagamento?: { forma: string; valor: number }[] | null;
  status_pagamento: string;
  observacoes?: string;
  criado_em: string;
  funcionario_id?: string | null;
  repasse_valor?: number;
  custo_total?: number;
  pacientes?: { nome: string };
  procedimentos?: { nome: string; cor: string; custo_materiais?: { material: string; quantidade: number; valor: number }[] | null };
  funcionarios?: { nome: string };
};

type Custo = {
  id: string;
  descricao: string;
  categoria?: string;
  valor: number;
  data: string;
  observacoes?: string;
  criado_em: string;
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

type FormaLinha = { forma: string; valor: string };

const formInicial = {
  agendamento_id: "", paciente_id: "", procedimento_id: "",
  funcionario_id: "", status_pagamento: "pendente", observacoes: "",
  formas_pagamento: [{ forma: "pix", valor: "" }] as FormaLinha[],
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
  const [pacientes, setPacientes] = useState<{ id: string; nome: string }[]>([]);
  const [procedimentos, setProcedimentos] = useState<{ id: string; nome: string; preco?: number }[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [buscaAgendamento, setBuscaAgendamento] = useState("");
  const [form, setForm] = useState(formInicial);
  const [abaFin, setAbaFin] = useState<"recepcao" | "consultorio" | "custos" | "extrato" | "repasse">("recepcao");
  const [repasseExpandido, setRepasseExpandido] = useState<string | null>(null);
  const [meuId, setMeuId] = useState<string | null>(null);
  const [consForm, setConsForm] = useState({ paciente_id: "", procedimento_id: "" });
  const [custos, setCustos] = useState<Custo[]>([]);
  const [custoForm, setCustoForm] = useState({ descricao: "", categoria: "Material", valor: "", data: new Date().toISOString().slice(0, 10) });
  const [extDetalhado, setExtDetalhado] = useState(false);
  const [extFiltro, setExtFiltro] = useState<"tudo" | "entradas" | "custos" | "repasses">("tudo");

  const buscar = useCallback(async () => {
    setCarregando(true);
    let qs = "";
    if (periodo !== "custom") {
      const p = getPeriodo(periodo);
      if (p) qs = `inicio=${p.inicio}&fim=${p.fim}`;
    } else if (customInicio && customFim) {
      qs = `inicio=${new Date(customInicio).toISOString()}&fim=${new Date(customFim + "T23:59:59").toISOString()}`;
    }
    const [rF, rC] = await Promise.all([
      fetch(`/api/faturamento?${qs}`),
      fetch(`/api/custos?${qs}`),
    ]);
    const data = await rF.json();
    const dc = await rC.json();
    setRegistros(data.registros ?? []);
    setResumo(data.resumo ?? null);
    setCustos(Array.isArray(dc) ? dc : []);
    setCarregando(false);
  }, [periodo, customInicio, customFim]);

  async function lancarCusto() {
    if (!custoForm.descricao.trim() || !(Number(custoForm.valor) > 0)) return;
    setSalvando(true);
    await fetch("/api/custos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(custoForm),
    });
    setCustoForm({ descricao: "", categoria: "Material", valor: "", data: new Date().toISOString().slice(0, 10) });
    buscar();
    setSalvando(false);
    toast.success("Custo lançado.");
  }
  async function excluirCusto(id: string) {
    await fetch(`/api/custos?id=${id}`, { method: "DELETE" });
    buscar();
  }

  useEffect(() => { buscar(); }, [buscar]);

  useEffect(() => {
    const p = getPeriodo("mes");
    fetch(`/api/agendamentos?inicio=${p?.inicio}&fim=${p?.fim}`).then(r => r.json()).then(d => setAgendamentos(Array.isArray(d) ? d : []));
    fetch("/api/funcionarios").then(r => r.json()).then(d => setFuncionarios(Array.isArray(d) ? d : []));
    fetch("/api/pacientes").then(r => r.json()).then(d => setPacientes(Array.isArray(d) ? d : []));
    fetch("/api/procedimentos").then(r => r.json()).then(d => setProcedimentos(Array.isArray(d) ? d : []));
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => setMeuId(d?.id ?? null)).catch(() => {});
  }, []);

  // Meu consultório: o profissional lança o atendimento (fica pendente para a recepção finalizar)
  async function lancarConsultorio() {
    const proc = procedimentos.find(p => p.id === consForm.procedimento_id);
    if (!consForm.paciente_id || !consForm.procedimento_id) return;
    setSalvando(true);
    await fetch("/api/faturamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paciente_id: consForm.paciente_id,
        procedimento_id: consForm.procedimento_id,
        funcionario_id: meuId,
        valor: proc?.preco ?? 0,
        status_pagamento: "pendente",
      }),
    });
    setConsForm({ paciente_id: "", procedimento_id: "" });
    buscar();
    setSalvando(false);
    toast.success("Atendimento lançado — a recepção vai finalizar o pagamento.");
  }

  // Helpers das formas de pagamento (split)
  function setFormaLinha(i: number, campo: "forma" | "valor", v: string) {
    setForm(f => ({ ...f, formas_pagamento: f.formas_pagamento.map((l, idx) => idx === i ? { ...l, [campo]: v } : l) }));
  }
  function addForma() {
    setForm(f => ({ ...f, formas_pagamento: [...f.formas_pagamento, { forma: "pix", valor: "" }] }));
  }
  function removeForma(i: number) {
    setForm(f => ({ ...f, formas_pagamento: f.formas_pagamento.length > 1 ? f.formas_pagamento.filter((_, idx) => idx !== i) : f.formas_pagamento }));
  }

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
      funcionario_id: "",
      status_pagamento: r.status_pagamento,
      observacoes: r.observacoes ?? "",
      formas_pagamento: (r.formas_pagamento && r.formas_pagamento.length)
        ? r.formas_pagamento.map(f => ({ forma: f.forma, valor: String(f.valor) }))
        : [{ forma: r.forma_pagamento || "pix", valor: String(r.valor ?? "") }],
    });
    setModalAberto(true);
  }

  function selecionarAgendamento(id: string) {
    const ag = agendamentos.find(a => a.id === id);
    if (!ag) return;
    const preco = ag.procedimentos?.preco;
    setForm(f => ({
      ...f,
      agendamento_id: id,
      paciente_id: (ag as any).paciente_id ?? f.paciente_id,
      procedimento_id: (ag as any).procedimento_id ?? f.procedimento_id,
      formas_pagamento: preco ? [{ forma: f.formas_pagamento[0]?.forma ?? "pix", valor: String(preco) }] : f.formas_pagamento,
    }));
  }

  async function salvar() {
    setSalvando(true);
    try {
      const formasNum = form.formas_pagamento
        .filter(l => l.forma && Number(l.valor) > 0)
        .map(l => ({ forma: l.forma, valor: Number(l.valor) }));
      const total = formasNum.reduce((s, f) => s + f.valor, 0);
      const forma_pagamento = formasNum.length > 1 ? "multiplas" : formasNum.length === 1 ? formasNum[0].forma : "pix";

      const payload: Record<string, unknown> = {
        funcionario_id: form.funcionario_id || null,
        status_pagamento: form.status_pagamento,
        observacoes: form.observacoes,
        formas_pagamento: formasNum,
        forma_pagamento,
        valor: total,
        desconto: 0,
      };
      if (!editando) {
        payload.paciente_id = form.paciente_id || null;
        payload.procedimento_id = form.procedimento_id || null;
        payload.agendamento_id = form.agendamento_id || null;
      } else {
        if (form.paciente_id) payload.paciente_id = form.paciente_id;
        if (form.procedimento_id) payload.procedimento_id = form.procedimento_id;
      }

      const method = editando ? "PUT" : "POST";
      const url = editando ? `/api/faturamento/${editando.id}` : "/api/faturamento";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setModalAberto(false);
      setEditando(null);
      setForm(formInicial);
      buscar();
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarPagamento(r: Registro) {
    await fetch(`/api/faturamento/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status_pagamento: "pago" }),
    });
    buscar();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este registro financeiro?")) return;
    setExcluindo(id);
    await fetch(`/api/faturamento/${id}`, { method: "DELETE" });
    setExcluindo(null);
    buscar();
  }

  const valorFinal = useMemo(() => form.formas_pagamento.reduce((s, l) => s + Number(l.valor || 0), 0), [form.formas_pagamento]);

  const fmt = (v: number) => "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  // Extrato: junta entradas (pagamentos pagos) e saídas (material, repasse, custos avulsos)
  const extrato = useMemo(() => {
    const pagos = registros.filter(r => r.status_pagamento === "pago");
    const totalEntrou = pagos.reduce((s, r) => s + Number(r.valor_final || 0), 0);
    const totalCustoMaterial = pagos.reduce((s, r) => s + Number(r.custo_total || 0), 0);
    const totalRepasse = pagos.reduce((s, r) => s + Number(r.repasse_valor || 0), 0);
    const totalCustoAvulso = custos.reduce((s, c) => s + Number(c.valor || 0), 0);
    const custosTotais = totalCustoMaterial + totalCustoAvulso;
    const fatMenosCustos = totalEntrou - custosTotais;
    const lucroReal = fatMenosCustos - totalRepasse;

    const movimentos: any[] = [];
    for (const r of pagos) {
      const ref = `${r.pacientes?.nome ?? "—"} · ${r.procedimentos?.nome ?? "—"}`;
      movimentos.push({ id: `${r.id}-e`, data: r.criado_em, tipo: "entrada", titulo: ref, valor: Number(r.valor_final || 0) });
      if (Number(r.custo_total || 0) > 0) movimentos.push({ id: `${r.id}-c`, data: r.criado_em, tipo: "custo", titulo: `Material · ${ref}`, valor: -Number(r.custo_total || 0), materiais: r.procedimentos?.custo_materiais ?? null });
      if (Number(r.repasse_valor || 0) > 0) movimentos.push({ id: `${r.id}-r`, data: r.criado_em, tipo: "repasse", titulo: `Repasse · ${r.funcionarios?.nome ?? "profissional"}`, valor: -Number(r.repasse_valor || 0) });
    }
    for (const c of custos) {
      movimentos.push({ id: `avulso-${c.id}`, data: c.data, tipo: "custo", titulo: `${c.descricao}${c.categoria ? ` · ${c.categoria}` : ""}`, valor: -Number(c.valor || 0) });
    }
    movimentos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return { totalEntrou, totalCustoMaterial, totalRepasse, totalCustoAvulso, custosTotais, fatMenosCustos, lucroReal, movimentos };
  }, [registros, custos]);

  // Repasse por profissional (do período)
  const repasseGrupos = useMemo(() => {
    const map = new Map<string, { nome: string; pago: number; pendente: number; count: number; itens: Registro[] }>();
    for (const r of registros) {
      if (!r.funcionario_id || r.status_pagamento === "cancelado") continue;
      const g = map.get(r.funcionario_id) ?? { nome: r.funcionarios?.nome ?? "—", pago: 0, pendente: 0, count: 0, itens: [] as Registro[] };
      const rep = Number(r.repasse_valor || 0);
      if (r.status_pagamento === "pago") g.pago += rep; else g.pendente += rep;
      g.count += 1;
      g.itens.push(r);
      map.set(r.funcionario_id, g);
    }
    return Array.from(map.entries()).map(([id, g]) => ({ id, ...g })).sort((a, b) => b.pago - a.pago);
  }, [registros]);
  const repasseTotalPago = repasseGrupos.reduce((s, g) => s + g.pago, 0);
  const repasseTotalPendente = repasseGrupos.reduce((s, g) => s + g.pendente, 0);

  const movimentosFiltrados = extrato.movimentos.filter(m =>
    extFiltro === "tudo" ? true :
    extFiltro === "entradas" ? m.tipo === "entrada" :
    extFiltro === "repasses" ? m.tipo === "repasse" :
    m.tipo === "custo");

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
        {abaFin === "recepcao" && (
          <button onClick={abrirNovo}
            className="px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
            style={{ background: "var(--gold)", color: "#0a0707" }}>
            + Registrar Pagamento
          </button>
        )}
      </div>

      {/* Abas do Financeiro */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: "recepcao",   label: "🏥 Recepção" },
          { key: "consultorio",label: "👩‍⚕️ Meu consultório" },
          { key: "custos",     label: "💸 Custos" },
          { key: "repasse",    label: "🤝 Repasse" },
          { key: "extrato",    label: "📄 Extrato" },
        ] as const).map(a => (
          <button key={a.key} onClick={() => setAbaFin(a.key)}
            className="px-4 py-2 rounded-2xl text-sm font-medium transition"
            style={{
              background: abaFin === a.key ? "var(--gold-bg)" : "var(--bg-card)",
              color: abaFin === a.key ? "var(--gold)" : "var(--text-muted)",
              border: `1px solid ${abaFin === a.key ? "var(--border-color)" : "var(--border-subtle)"}`,
            }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Filtro período — compartilhado (Recepção, Custos, Extrato) */}
      {abaFin !== "consultorio" && (<>
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
      </>)}

      {abaFin === "recepcao" && (<>
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
                      <td className="px-5 py-4 text-xs" style={{ color: "var(--text-muted)" }}>
                        {r.formas_pagamento && r.formas_pagamento.length ? (
                          <div className="flex flex-col gap-0.5">
                            {r.formas_pagamento.map((f, k) => {
                              const fc = formas.find(x => x.key === f.forma);
                              return <span key={k}>{fc?.icon ?? "•"} {fc?.label ?? f.forma}: R$ {Number(f.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>;
                            })}
                          </div>
                        ) : (<span>{forma?.icon} {forma?.label}</span>)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ color: status?.color, background: status?.bg }}>
                          {status?.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
                        {new Date(r.criado_em).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2 items-center">
                          {r.status_pagamento === "pendente" && (
                            <button onClick={() => confirmarPagamento(r)} title="Confirmar pagamento"
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-70 flex-shrink-0"
                              style={{ background: "rgba(122,232,160,0.12)", color: "#7ae8a0", border: "1px solid rgba(122,232,160,0.3)" }}>
                              ✓ Confirmar
                            </button>
                          )}
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
      </>)}

      {/* Aba: Meu consultório — profissional lança o atendimento */}
      {abaFin === "consultorio" && (
        <div className="max-w-xl">
          <div className="rounded-3xl p-6 mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Lançar atendimento</p>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Registre o que foi feito no consultório. Vai para a recepção como <strong>pendente</strong>, e lá ela define a forma de pagamento e finaliza.
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Paciente</label>
                <select value={consForm.paciente_id} onChange={e => setConsForm(f => ({ ...f, paciente_id: e.target.value }))}
                  className={inp} style={{ ...inpStyle, color: consForm.paciente_id ? "var(--text-primary)" : "var(--text-muted)" }}>
                  <option value="">Selecionar paciente</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Procedimento</label>
                <select value={consForm.procedimento_id} onChange={e => setConsForm(f => ({ ...f, procedimento_id: e.target.value }))}
                  className={inp} style={{ ...inpStyle, color: consForm.procedimento_id ? "var(--text-primary)" : "var(--text-muted)" }}>
                  <option value="">Selecionar procedimento</option>
                  {procedimentos.map(p => <option key={p.id} value={p.id}>{p.nome}{p.preco ? ` — R$ ${p.preco}` : ""}</option>)}
                </select>
              </div>
              {(() => {
                const proc = procedimentos.find(p => p.id === consForm.procedimento_id);
                if (!proc) return null;
                const preco = Number(proc.preco) || 0;
                const repasse = preco * (Number((proc as any).repasse_percentual) || 0) / 100;
                return (
                  <div className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ background: "var(--gold-bg)", border: "1px solid var(--border-color)" }}>
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Valor · seu repasse</span>
                    <span className="text-sm font-semibold" style={{ color: "var(--gold)" }}>
                      R$ {preco.toFixed(2)} · <span style={{ color: "#c87ae8" }}>R$ {repasse.toFixed(2)}</span>
                    </span>
                  </div>
                );
              })()}
              <button onClick={lancarConsultorio} disabled={salvando || !consForm.paciente_id || !consForm.procedimento_id}
                className="w-full py-3 rounded-2xl text-sm font-semibold transition hover:scale-105"
                style={{ background: "var(--gold)", color: "#0a0707", opacity: salvando || !consForm.paciente_id || !consForm.procedimento_id ? 0.5 : 1 }}>
                {salvando ? "Lançando..." : "Lançar atendimento"}
              </button>
            </div>
          </div>

          {/* Meus lançamentos recentes */}
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>Meus lançamentos ({registros.filter(r => r.funcionario_id === meuId).length})</p>
          <div className="flex flex-col gap-2">
            {registros.filter(r => r.funcionario_id === meuId).length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum lançamento seu no período.</p>
            ) : registros.filter(r => r.funcionario_id === meuId).map(r => {
              const st = statusPag.find(s => s.key === r.status_pagamento);
              return (
                <div key={r.id} className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{r.pacientes?.nome ?? "—"} · {r.procedimentos?.nome ?? "—"}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(r.criado_em).toLocaleDateString("pt-BR")} · repasse R$ {Number(r.repasse_valor ?? 0).toFixed(2)}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: st?.color, background: st?.bg }}>{st?.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aba: Custos avulsos */}
      {abaFin === "custos" && (
        <div className="max-w-xl">
          <div className="rounded-3xl p-6 mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Lançar custo (saída)</p>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>Ex.: aluguel, conta de luz, compra de material geral.</p>
            <div className="flex flex-col gap-3">
              <input type="text" value={custoForm.descricao} onChange={e => setCustoForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Descrição" className={inp} style={inpStyle} />
              <div className="grid grid-cols-2 gap-3">
                <select value={custoForm.categoria} onChange={e => setCustoForm(f => ({ ...f, categoria: e.target.value }))}
                  className={inp} style={{ ...inpStyle, color: "var(--text-primary)" }}>
                  {["Material","Aluguel","Conta","Salário","Marketing","Equipamento","Imposto","Outro"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="date" value={custoForm.data} onChange={e => setCustoForm(f => ({ ...f, data: e.target.value }))}
                  className={inp} style={{ ...inpStyle, colorScheme: "dark" }} />
              </div>
              <input type="number" value={custoForm.valor} onChange={e => setCustoForm(f => ({ ...f, valor: e.target.value }))}
                placeholder="Valor (R$)" className={inp} style={inpStyle} />
              <button onClick={lancarCusto} disabled={salvando || !custoForm.descricao.trim() || !(Number(custoForm.valor) > 0)}
                className="w-full py-3 rounded-2xl text-sm font-semibold transition hover:scale-105"
                style={{ background: "#e87a7a", color: "#0a0707", opacity: salvando || !custoForm.descricao.trim() || !(Number(custoForm.valor) > 0) ? 0.5 : 1 }}>
                {salvando ? "Lançando..." : "Lançar custo"}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--gold)" }}>Custos do período ({custos.length})</p>
            <p className="text-sm font-semibold" style={{ color: "#e87a7a" }}>Total: {fmt(extrato.totalCustoAvulso)}</p>
          </div>
          <div className="flex flex-col gap-2">
            {custos.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum custo no período.</p>
            ) : custos.map(c => (
              <div key={c.id} className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{c.descricao}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{c.categoria ?? "—"} · {new Date(c.data + "T12:00:00").toLocaleDateString("pt-BR")}{c.funcionarios?.nome ? ` · ${c.funcionarios.nome}` : ""}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold" style={{ color: "#e87a7a" }}>− {fmt(c.valor)}</span>
                  <button onClick={() => excluirCusto(c.id)} title="Excluir" className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-70" style={{ background: "rgba(232,122,122,0.1)", color: "#e87a7a" }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aba: Extrato */}
      {abaFin === "extrato" && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            {[
              { label: "Entrou", valor: fmt(extrato.totalEntrou), cor: "#7ae8a0" },
              { label: "Custos (material + avulsos)", valor: fmt(extrato.custosTotais), cor: "#e87a7a" },
              { label: "Repasses profissionais", valor: fmt(extrato.totalRepasse), cor: "#c87ae8" },
              { label: "Faturamento − custos", valor: fmt(extrato.fatMenosCustos), cor: "var(--text-primary)" },
              { label: "Lucro real", valor: fmt(extrato.lucroReal), cor: "var(--gold)", forte: true },
            ].map(c => (
              <div key={c.label} className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: `1px solid ${(c as any).forte ? "var(--gold)" : "var(--border-color)"}` }}>
                <p className="text-lg font-bold" style={{ color: c.cor }}>{c.valor}</p>
                <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>{c.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {([
                { key: "tudo", label: "Tudo" },
                { key: "entradas", label: "Entradas" },
                { key: "custos", label: "Custos" },
                { key: "repasses", label: "Repasses" },
              ] as const).map(f => (
                <button key={f.key} onClick={() => setExtFiltro(f.key)}
                  className="px-3 py-1.5 rounded-xl text-xs transition"
                  style={{ background: extFiltro === f.key ? "var(--gold-bg)" : "var(--bg-card)", color: extFiltro === f.key ? "var(--gold)" : "var(--text-muted)", border: `1px solid ${extFiltro === f.key ? "var(--border-color)" : "var(--border-subtle)"}` }}>
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={() => setExtDetalhado(v => !v)}
              className="px-3 py-1.5 rounded-xl text-xs transition"
              style={{ background: extDetalhado ? "var(--gold-bg)" : "var(--bg-card)", color: extDetalhado ? "var(--gold)" : "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
              {extDetalhado ? "🔎 Detalhado" : "Detalhar"}
            </button>
          </div>

          <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            {movimentosFiltrados.length === 0 ? (
              <div className="py-14 text-center"><p className="text-3xl mb-2">📄</p><p className="text-sm" style={{ color: "var(--text-muted)" }}>Nada no período/filtro.</p></div>
            ) : movimentosFiltrados.map((m, i) => {
              const cor = m.tipo === "entrada" ? "#7ae8a0" : m.tipo === "repasse" ? "#c87ae8" : "#e87a7a";
              return (
                <div key={m.id} className="flex items-start justify-between gap-4 px-5 py-3.5" style={{ borderBottom: i < movimentosFiltrados.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.titulo}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(m.data).toLocaleDateString("pt-BR")} · {m.tipo === "entrada" ? "Entrada" : m.tipo === "repasse" ? "Repasse" : "Custo"}
                    </p>
                    {extDetalhado && Array.isArray(m.materiais) && m.materiais.length > 0 && (
                      <div className="mt-1.5 flex flex-col gap-0.5">
                        {m.materiais.map((mat: any, k: number) => (
                          <p key={k} className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            • {mat.material}: {mat.quantidade} × {fmt(mat.valor)} = {fmt((Number(mat.quantidade) || 0) * (Number(mat.valor) || 0))}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: cor }}>
                    {m.valor >= 0 ? "+" : "−"} {fmt(Math.abs(m.valor))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aba: Repasse por profissional */}
      {abaFin === "repasse" && (
        <div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <p className="text-lg font-bold" style={{ color: "#c87ae8" }}>{fmt(repasseTotalPago)}</p>
              <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>Repasse a pagar (pagamentos confirmados)</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <p className="text-lg font-bold" style={{ color: "var(--warning)" }}>{fmt(repasseTotalPendente)}</p>
              <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>A confirmar (ainda pendente)</p>
            </div>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Repasse gerado por profissional no período. Clique num profissional para ver o histórico.</p>
          <div className="flex flex-col gap-2">
            {repasseGrupos.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum atendimento com profissional no período.</p>
            ) : repasseGrupos.map(g => {
              const aberto = repasseExpandido === g.id;
              return (
                <div key={g.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                  <button onClick={() => setRepasseExpandido(aberto ? null : g.id)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-[var(--bg-hover)]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(200,122,232,0.15)", color: "#c87ae8" }}>
                        {g.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{g.nome}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{g.count} atendimento{g.count !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: "#c87ae8" }}>{fmt(g.pago)}</p>
                        {g.pendente > 0 && <p className="text-[11px]" style={{ color: "var(--warning)" }}>+ {fmt(g.pendente)} a confirmar</p>}
                      </div>
                      <span style={{ color: "var(--text-muted)", transform: aberto ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
                    </div>
                  </button>
                  {aberto && (
                    <div className="px-5 pb-4 pl-16 flex flex-col gap-1.5">
                      {g.itens.map(r => {
                        const st = statusPag.find(s => s.key === r.status_pagamento);
                        return (
                          <div key={r.id} className="flex items-center justify-between gap-3 text-xs rounded-xl px-3 py-2" style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                            <span style={{ color: "var(--text-secondary)" }}>
                              {new Date(r.criado_em).toLocaleDateString("pt-BR")} · {r.pacientes?.nome ?? "—"} · {r.procedimentos?.nome ?? "—"}
                            </span>
                            <span className="flex items-center gap-2 flex-shrink-0">
                              <span style={{ color: "var(--text-muted)" }}>{fmt(Number(r.valor_final || 0))}</span>
                              <span style={{ color: "#c87ae8", fontWeight: 600 }}>{fmt(Number(r.repasse_valor || 0))}</span>
                              <span className="px-1.5 py-0.5 rounded-full font-medium" style={{ color: st?.color, background: st?.bg }}>{st?.label}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Paciente</label>
                  <select value={form.paciente_id} onChange={e => setForm(f => ({ ...f, paciente_id: e.target.value }))}
                    className={inp} style={{ ...inpStyle, color: form.paciente_id ? "var(--text-primary)" : "var(--text-muted)" }}>
                    <option value="">{editando ? "Manter atual" : "Selecionar paciente"}</option>
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Procedimento</label>
                  <select value={form.procedimento_id}
                    onChange={e => {
                      const pid = e.target.value;
                      const proc = procedimentos.find(p => p.id === pid);
                      setForm(f => ({
                        ...f,
                        procedimento_id: pid,
                        formas_pagamento: proc?.preco && f.formas_pagamento.length === 1 && !f.formas_pagamento[0].valor
                          ? [{ forma: f.formas_pagamento[0].forma, valor: String(proc.preco) }]
                          : f.formas_pagamento,
                      }));
                    }}
                    className={inp} style={{ ...inpStyle, color: form.procedimento_id ? "var(--text-primary)" : "var(--text-muted)" }}>
                    <option value="">{editando ? "Manter atual" : "Selecionar procedimento"}</option>
                    {procedimentos.map(p => <option key={p.id} value={p.id}>{p.nome}{p.preco ? ` — R$ ${p.preco}` : ""}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Profissional</label>
                <select value={form.funcionario_id} onChange={e => setForm(f => ({ ...f, funcionario_id: e.target.value }))}
                  className={inp} style={{ ...inpStyle, color: form.funcionario_id ? "var(--text-primary)" : "var(--text-muted)" }}>
                  <option value="">Selecionar profissional</option>
                  {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>

              {/* Formas de pagamento (uma ou várias — Pix + Cartão + Dinheiro...) */}
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Formas de pagamento</label>
                <div className="flex flex-col gap-2">
                  {form.formas_pagamento.map((linha, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select value={linha.forma} onChange={e => setFormaLinha(i, "forma", e.target.value)}
                        className="rounded-2xl px-3 py-3 text-sm outline-none" style={{ ...inpStyle, width: 170, flexShrink: 0, color: "var(--text-primary)" }}>
                        {formas.map(f => <option key={f.key} value={f.key}>{f.icon} {f.label}</option>)}
                      </select>
                      <input type="number" value={linha.valor} onChange={e => setFormaLinha(i, "valor", e.target.value)}
                        placeholder="0,00" className={inp} style={inpStyle} />
                      {form.formas_pagamento.length > 1 && (
                        <button onClick={() => removeForma(i)} title="Remover forma"
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition hover:opacity-70"
                          style={{ background: "rgba(232,122,122,0.1)", color: "#e87a7a" }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addForma}
                  className="mt-2 text-xs px-3 py-1.5 rounded-xl transition hover:opacity-70"
                  style={{ background: "var(--gold-bg)", color: "var(--gold)", border: "1px solid var(--border-subtle)" }}>
                  + Adicionar forma de pagamento
                </button>
              </div>

              <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
                style={{ background: "var(--gold-bg)", border: "1px solid var(--border-color)" }}>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Total</span>
                <span className="text-xl font-bold" style={{ color: "var(--gold)" }}>R$ {valorFinal.toFixed(2)}</span>
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
                <button onClick={salvar} disabled={salvando || valorFinal <= 0}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold transition hover:scale-105"
                  style={{ background: "var(--gold)", color: "#0a0707", opacity: salvando || valorFinal <= 0 ? 0.5 : 1 }}>
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
