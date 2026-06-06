"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Pacote = {
  id: string;
  procedimento: string[];
  total_sessoes: number;
  sessoes_feitas: number;
  status: string;
  status_pagamento: string;
  categoria: string;
  forma_pagamento?: string;
  valor?: number;
  data_inicio?: string;
  observacoes?: string;
  assinou_termo: boolean;
  criado_em: string;
  pacientes?: { nome: string; telefone: string; cpf?: string };
  funcionarios?: { nome: string; cor: string };
};

type Resumo = {
  totalPacientes: number;
  pacotesAtivos: number;
  sessoesMes: number;
  faturamento: number;
};

const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
  em_tratamento: { label: "Em tratamento", color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  finalizado:    { label: "Finalizado",    color: "var(--text-secondary)", bg: "rgba(168,144,128,0.1)" },
  pausado:       { label: "Pausado",       color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  cancelado:     { label: "Cancelado",     color: "#e87a7a", bg: "rgba(232,122,122,0.1)" },
};

const pagCfg: Record<string, { label: string; color: string; bg: string }> = {
  pago:     { label: "Pago",     color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  pendente: { label: "Pendente", color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  parcial:  { label: "Parcial",  color: "var(--gold)", bg: "var(--gold-bg)" },
};

const categoriaCfg: Record<string, { label: string; color: string; bg: string }> = {
  Pacote:    { label: "Pacote",    color: "var(--gold)", bg: "var(--gold-bg)" },
  Gratuito:  { label: "Gratuito", color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  Avulso:    { label: "Avulso",   color: "#a89bcc", bg: "rgba(168,155,204,0.1)" },
};

const formas = ["pix", "debito", "credito", "dinheiro", "transferencia"];

// ✅ "Busco" corrigido para "Buço" em todo o sistema
const AREAS = [
  "Axila",
  "Buço",
  "Virilha",
  "Meia Perna",
  "Perna Completa",
  "Braço Completo",
  "Antebraço",
  "Rosto",
  "Pescoço",
  "Abdômen",
  "Costas",
  "Peitoral",
  "Glúteos",
  "Full Body",
];

const formInicial = {
  paciente_id: "", funcionario_id: "", areas: [] as string[],
  categoria: "Pacote", total_sessoes: "6", valor: "",
  forma_pagamento: "pix", status_pagamento: "pendente",
  data_inicio: new Date().toISOString().slice(0, 10),
  observacoes: "", assinou_termo: false,
};

function toggleArea(areas: string[], area: string) {
  return areas.includes(area) ? areas.filter(a => a !== area) : [...areas, area];
}

export default function LaserPage() {
  const router = useRouter();
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPag, setFiltroPag] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Pacote | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [pacientesLista, setPacientesLista] = useState<any[]>([]);
  const [funcionariosLista, setFuncionariosLista] = useState<any[]>([]);
  const [form, setForm] = useState(formInicial);

  const buscar = useCallback(async () => {
    setCarregando(true);
    let url = `/api/laser?busca=${encodeURIComponent(busca)}`;
    if (filtroStatus) url += `&status=${filtroStatus}`;
    if (filtroPag) url += `&status_pagamento=${filtroPag}`;
    if (filtroCategoria) url += `&categoria=${filtroCategoria}`;
    const res = await fetch(url);
    const data = await res.json();
    setPacotes(data.pacotes ?? []);
    setResumo(data.resumo ?? null);
    setCarregando(false);
  }, [busca, filtroStatus, filtroPag, filtroCategoria]);

  useEffect(() => {
    const t = setTimeout(buscar, 300);
    return () => clearTimeout(t);
  }, [buscar]);

  useEffect(() => {
    fetch("/api/pacientes").then(r => r.json()).then(d => setPacientesLista(Array.isArray(d) ? d : []));
    fetch("/api/funcionarios").then(r => r.json()).then(d => setFuncionariosLista(Array.isArray(d) ? d : []));
  }, []);

  function abrirNovo() {
    setEditando(null);
    setForm(formInicial);
    setModalAberto(true);
  }
  

  async function excluirPacote (id: string, e: React.MouseEvent) {
    e.stopPropagation();

    const confirmar = confirm(
      "Deseja realmente excluir? Todas as sessões vinculadas também serão removidas."
    );

    if (!confirmar) return;

    try {
    const res = await fetch(`/api/laser/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    
    if (!res.ok) {
      toast.error(data.erro || "Erro ao excluir");
      return;
    }
    buscar ();
    toast.success("Pacote excluído com sucesso!");
    } catch {
      toast.error("Erro ao excluir pacote");
    }
  }

  function abrirEdicao(p: Pacote, e: React.MouseEvent) {
    e.stopPropagation();
    setEditando(p);
    setForm({
      paciente_id: p.pacientes ? (pacientesLista.find(x => x.nome === p.pacientes?.nome)?.id ?? "") : "",
      funcionario_id: p.funcionarios ? (funcionariosLista.find(x => x.nome === p.funcionarios?.nome)?.id ?? "") : "",
      areas: Array.isArray(p.procedimento) ? p.procedimento : (p.procedimento ?? "").split(", ").map((a: string) => a.trim()).filter(Boolean),
      categoria: p.categoria ?? "Pacote",
      total_sessoes: String(p.total_sessoes),
      valor: String(p.valor ?? ""),
      forma_pagamento: p.forma_pagamento ?? "pix",
      status_pagamento: p.status_pagamento,
      data_inicio: p.data_inicio ?? new Date().toISOString().slice(0, 10),
      observacoes: p.observacoes ?? "",
      assinou_termo: p.assinou_termo,
    });
    setModalAberto(true);
  }

  async function salvar() {
    if (!form.paciente_id || form.areas.length === 0) return;
    setSalvando(true);
    const payload = {
      ...form,
      procedimento: form.areas,
      total_sessoes: Number(form.total_sessoes),
      valor: form.valor ? Number(form.valor) : null,
    };
    const method = editando ? "PATCH" : "POST";
    const url = editando ? `/api/laser/${editando.id}` : "/api/laser";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setModalAberto(false);
    setEditando(null);
    setForm(formInicial);
    buscar();
    setSalvando(false);
  }

  

  const inputStyle = {
    background: "var(--bg-input)",
    border: "1px solid var(--border-color)",
    color: "var(--text-primary)",
  } as const;

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Controle</p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Pacientes Laser</h1>
        </div>
        <button onClick={abrirNovo}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{ background: "var(--gold)", color: "var(--bg-input)" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Novo Pacote
        </button>
      </div>

      {/* Cards de resumo */}
      {resumo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Pacientes", valor: resumo.totalPacientes, icon: "👥" },
            { label: "Pacotes Ativos", valor: resumo.pacotesAtivos, icon: "🔆" },
            { label: "Sessões Realizadas", valor: resumo.sessoesMes, icon: "✅" },
            { label: "Faturamento", valor: `R$ ${resumo.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: "💰" },
          ].map((c, i) => (
            <div key={i} className="rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <div className="text-2xl mb-3">{c.icon}</div>
              <p className="text-2xl font-bold mb-1" style={{ color: "var(--gold)" }}>{c.valor}</p>
              <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" stroke="currentColor" strokeWidth={1.5} style={{ color: "var(--text-muted)" }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input type="text" placeholder="Buscar paciente ou CPF..." value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full rounded-2xl pl-11 pr-5 py-3 text-sm outline-none"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
        </div>
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
          className="rounded-2xl px-4 py-3 text-sm outline-none"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: filtroCategoria ? "var(--text-primary)" : "var(--text-muted)" }}>
          <option value="">Todas categorias</option>
          {Object.entries(categoriaCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="rounded-2xl px-4 py-3 text-sm outline-none"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: filtroStatus ? "var(--text-primary)" : "var(--text-muted)" }}>
          <option value="">Todos os status</option>
          {Object.entries(statusCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filtroPag} onChange={e => setFiltroPag(e.target.value)}
          className="rounded-2xl px-4 py-3 text-sm outline-none"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: filtroPag ? "var(--text-primary)" : "var(--text-muted)" }}>
          <option value="">Todos pagamentos</option>
          {Object.entries(pagCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Tabela */}
      {carregando ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : pacotes.length === 0 ? (
        <div className="text-center py-20 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--gold-bg)" }}>
          <p className="text-4xl mb-4">🔆</p>
          <p className="text-lg font-semibold mb-2" style={{ color: "var(--gold)" }}>Nenhum pacote encontrado</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Cadastre o primeiro pacote laser</p>
        </div>
      ) : (
        <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--gold-bg)" }}>
                  {["Paciente", "Áreas", "Categoria", "Sessões", "Progresso", "Status", "Pagamento", "Profissional", ""].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pacotes.map((p, i) => {
                  const areas = Array.isArray(p.procedimento) ? p.procedimento : (p.procedimento ?? "").split(", ").map((a: string) => a.trim()).filter(Boolean);
                  const pct = Math.round((p.sessoes_feitas / p.total_sessoes) * 100);
                  const restantes = p.total_sessoes - p.sessoes_feitas;
                  const sc = statusCfg[p.status] ?? statusCfg.em_tratamento;
                  const pc = pagCfg[p.status_pagamento] ?? pagCfg.pendente;
                  const cc = categoriaCfg[p.categoria] ?? categoriaCfg.Pacote;
                  return (
                    <tr key={p.id} className="transition hover:bg-[var(--bg-hover)] cursor-pointer"
                      style={{ borderBottom: i < pacotes.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                      onClick={() => router.push(`/admin/laser/${p.id}`)}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: "var(--border-color)", color: "var(--gold)" }}>
                            {p.pacientes?.nome?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{p.pacientes?.nome}</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{p.pacientes?.telefone}</p>
                          </div>
                        </div>
                      </td>
                      {/* ✅ Múltiplas áreas exibidas como tags */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {areas.map(a => (
                            <span key={a} className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: "var(--gold-bg)", color: "var(--text-secondary)" }}>{a}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: cc.color, background: cc.bg }}>{cc.label}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-center">
                          <p className="text-lg font-bold" style={{ color: "var(--gold)" }}>{restantes}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>restantes</p>
                        </div>
                      </td>
                      <td className="px-5 py-4" style={{ minWidth: 120 }}>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full" style={{ background: "var(--gold-bg)" }}>
                            <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--gold)" }} />
                          </div>
                          <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>{p.sessoes_feitas}/{p.total_sessoes}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: sc.color, background: sc.bg }}>{sc.label}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: pc.color, background: pc.bg }}>{pc.label}</span>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>{p.funcionarios?.nome ?? "-"}</td>
                      {/* ✅ Botão editar */}
                        <td className="px-5 py-4">
                           <div className="flex gap-2">
    
                            {/* EDITAR */}
                            <button
                              onClick={(e) => abrirEdicao(p, e)}
                              className="p-1.5 rounded-lg transition hover:opacity-70"
                              style={{ background: "var(--gold-bg)" }}
                              title="Editar pacote"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="w-4 h-4"
                                stroke="var(--gold)"
                                strokeWidth={1.5}
                              >
                                <path
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                            </svg>
                          </button>

                            <button
                              onClick={(e) => excluirPacote(p.id, e)}
                              className="p-1.5 rounded-lg transition hover:opacity-70"
                              style={{ background: "rgba(232,122,122,0.15)" }}
                              title="Excluir pacote"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="w-4 h-4"
                                stroke="#e87a7a"
                                strokeWidth={1.8}
                              >
                                <path
                                  d="M3 6h18"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M8 6V4a1 1 0 011-1h6a1     {/* EXCLUIR */}
                        1 0 011 1v2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>

                      </div>
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal cadastro / edição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: "var(--gold)" }}>
                {editando ? "Editar Pacote Laser" : "Novo Pacote Laser"}
              </h2>
              <button onClick={() => setModalAberto(false)} style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Paciente */}
              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Paciente</label>
                <select value={form.paciente_id} onChange={e => setForm(f => ({ ...f, paciente_id: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={inputStyle}>
                  <option value="">Selecionar paciente...</option>
                  {pacientesLista.map((p: any) => <option key={p.id} value={p.id}>{p.nome} - {p.telefone}</option>)}
                </select>
              </div>

              {/* Categoria */}
              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Categoria</label>
                <div className="flex gap-2">
                  {(["Pacote", "Gratuito", "Avulso"] as const).map(cat => (
                    <button key={cat} type="button"
                      onClick={() => setForm(f => ({ ...f, categoria: cat }))}
                      className="flex-1 py-2.5 rounded-2xl text-sm font-medium transition"
                      style={{
                        background: form.categoria === cat ? "var(--gold)" : "var(--border-subtle)",
                        color: form.categoria === cat ? "var(--bg-input)" : "var(--text-secondary)",
                        border: "1px solid rgba(200,160,120,0.2)",
                      }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* ✅ Seleção múltipla de áreas por checkboxes */}
              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-widest block mb-3" style={{ color: "var(--text-secondary)" }}>
                  Áreas Tratadas <span style={{ color: "var(--text-muted)" }}>({form.areas.length} selecionada{form.areas.length !== 1 ? "s" : ""})</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AREAS.map(area => {
                    const selecionada = form.areas.includes(area);
                    return (
                      <button key={area} type="button"
                        onClick={() => setForm(f => ({ ...f, areas: toggleArea(f.areas, area) }))}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition"
                        style={{
                          background: selecionada ? "var(--border-color)" : "var(--bg-hover)",
                          border: selecionada ? "1px solid rgba(200,160,120,0.5)" : "1px solid var(--border-color)",
                          color: selecionada ? "var(--text-primary)" : "var(--text-muted)",
                        }}>
                        <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                          style={{ background: selecionada ? "var(--gold)" : "transparent", border: selecionada ? "none" : "1px solid rgba(200,160,120,0.3)" }}>
                          {selecionada && (
                            <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="var(--bg-input)" strokeWidth={3}>
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        {area}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sessões e Valor */}
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Total de Sessões</label>
                <input type="number" value={form.total_sessoes}
                  onChange={e => setForm(f => ({ ...f, total_sessoes: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>
                  Valor (R$) {form.categoria === "Gratuito" && <span style={{ color: "#7ae8a0" }}>— Gratuito</span>}
                </label>
                <input type="number" value={form.valor}
                  onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                  placeholder={form.categoria === "Gratuito" ? "0,00" : "0,00"}
                  disabled={form.categoria === "Gratuito"}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ ...inputStyle, opacity: form.categoria === "Gratuito" ? 0.4 : 1 }} />
              </div>

              {/* Pagamento */}
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Forma de Pagamento</label>
                <select value={form.forma_pagamento} onChange={e => setForm(f => ({ ...f, forma_pagamento: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={inputStyle}
                  disabled={form.categoria === "Gratuito"}>
                  {formas.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Status Pagamento</label>
                <select value={form.status_pagamento} onChange={e => setForm(f => ({ ...f, status_pagamento: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={inputStyle}
                  disabled={form.categoria === "Gratuito"}>
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="parcial">Parcial</option>
                </select>
              </div>

              {/* Data início e Profissional */}
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Data de Início</label>
                <input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Profissional</label>
                <select value={form.funcionario_id} onChange={e => setForm(f => ({ ...f, funcionario_id: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={inputStyle}>
                  <option value="">Selecionar profissional...</option>
                  {funcionariosLista.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>

              {/* Observações */}
              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  rows={2} placeholder="Observações do pacote..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inputStyle} />
              </div>

              {/* Termo */}
              <div className="sm:col-span-2 flex items-center gap-3">
                <button type="button" onClick={() => setForm(f => ({ ...f, assinou_termo: !f.assinou_termo }))}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition flex-shrink-0"
                  style={{ background: form.assinou_termo ? "var(--gold)" : "transparent", border: "1px solid rgba(200,160,120,0.4)" }}>
                  {form.assinou_termo && (
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="var(--bg-input)" strokeWidth={2.5}>
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Assinou o termo de consentimento</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{ border: "1px solid rgba(200,160,120,0.2)", color: "var(--text-muted)" }}>
                Cancelar
              </button>
              <button onClick={salvar}
                disabled={salvando || !form.paciente_id || form.areas.length === 0}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{
                  background: !salvando && form.paciente_id && form.areas.length > 0 ? "var(--gold)" : "rgba(200,160,120,0.3)",
                  color: "var(--bg-input)",
                }}>
                {salvando ? "Salvando..." : editando ? "Salvar Alterações" : "Salvar Pacote"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`select option { background: #120d0d; } input::placeholder, textarea::placeholder { color: #3a2e28; }`}</style>
    </div>
  );
}



