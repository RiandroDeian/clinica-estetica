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
  valor_mensal?: number;
  data_inicio?: string;
  data_acerto?: string;
  dia_vencimento_boleto?: number;
  assinou_contrato?: boolean;
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
  totalPacotes: number;
  totalGratuitos: number;
  totalAvulsos: number;
  totalBoleto: number;
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
  Pacote:   { label: "Pacote",   color: "var(--gold)", bg: "var(--gold-bg)" },
  Gratuito: { label: "Gratuito", color: "#7ae8a0",     bg: "rgba(122,232,160,0.1)" },
  Avulso:   { label: "Avulso",   color: "#a89bcc",     bg: "rgba(168,155,204,0.1)" },
};

const formas = ["pix", "debito", "credito", "dinheiro", "transferencia", "boleto"];

const formaCfg: Record<string, { label: string; color: string; bg: string }> = {
  boleto:        { label: "Boleto",        color: "#e87a7a", bg: "rgba(232,122,122,0.1)" },
  pix:           { label: "PIX",           color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  credito:       { label: "Cartão Créd.",  color: "#a89bcc", bg: "rgba(168,155,204,0.1)" },
  debito:        { label: "Cartão Déb.",   color: "#7ab8e8", bg: "rgba(122,184,232,0.1)" },
  dinheiro:      { label: "Dinheiro",      color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  transferencia: { label: "Transferência", color: "var(--gold)", bg: "var(--gold-bg)" },
};

const AREAS = [
  "Axila","Buço","Queixo","Virilha","Meia Perna","Perna Completa","Braço Completo",
  "Antebraço","Rosto","Pescoço","Abdômen","Costas","Peitoral","Glúteos",
  "Full Body","Virilha Completa","Dedos das Maos","Dedos dos Pes","Faixa da Barba",
];

const formInicial = {
  paciente_id: "", funcionario_id: "", areas: [] as string[],
  categoria: "Pacote", total_sessoes: "6", valor: "", valor_mensal: "",
  forma_pagamento: "pix", status_pagamento: "pendente",
  data_inicio: new Date().toISOString().slice(0, 10),
  data_acerto: "", dia_vencimento_boleto: "", assinou_contrato: false,
  observacoes: "", assinou_termo: false,
};

function toggleArea(areas: string[], area: string) {
  return areas.includes(area) ? areas.filter(a => a !== area) : [...areas, area];
}

function camposFaltando(paciente?: { nome: string; telefone: string; cpf?: string }) {
  if (!paciente) return [];
  const faltando = [];
  if (!paciente.cpf) faltando.push("CPF");
  return faltando;
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
  const [filtroForma, setFiltroForma] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Pacote | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [pacientesLista, setPacientesLista] = useState<any[]>([]);
  const [funcionariosLista, setFuncionariosLista] = useState<any[]>([]);
  const [form, setForm] = useState(formInicial);

  const buscar = useCallback(async () => {
    setCarregando(true);
    let url = `/api/laser?busca=${encodeURIComponent(busca)}`;
    if (filtroStatus)    url += `&status=${filtroStatus}`;
    if (filtroPag)       url += `&status_pagamento=${filtroPag}`;
    if (filtroCategoria) url += `&categoria=${filtroCategoria}`;
    if (filtroForma)     url += `&forma_pagamento=${filtroForma}`;
    const res = await fetch(url);
    const data = await res.json();
    setPacotes(data.pacotes ?? []);
    setResumo(data.resumo ?? null);
    setCarregando(false);
  }, [busca, filtroStatus, filtroPag, filtroCategoria, filtroForma]);

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

  async function excluirPacote(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Deseja realmente excluir? Todas as sessões vinculadas também serão removidas.")) return;
    try {
      const res = await fetch(`/api/laser/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.erro || "Erro ao excluir"); return; }
      buscar();
      toast.success("Pacote excluído com sucesso!");
    } catch { toast.error("Erro ao excluir pacote"); }
  }

  function abrirEdicao(p: Pacote, e: React.MouseEvent) {
    e.stopPropagation();
    setEditando(p);
    setForm({
      paciente_id: p.pacientes ? (pacientesLista.find(x => x.nome === p.pacientes?.nome)?.id ?? "") : "",
      funcionario_id: p.funcionarios ? (funcionariosLista.find(x => x.nome === p.funcionarios?.nome)?.id ?? "") : "",
      areas: Array.isArray(p.procedimento) ? p.procedimento : ((p.procedimento as string) ?? "").split(", ").map((a: string) => a.trim()).filter(Boolean),
      categoria: p.categoria ?? "Pacote",
      total_sessoes: String(p.total_sessoes),
      valor: String(p.valor ?? ""),
      valor_mensal: String(p.valor_mensal ?? ""),
      forma_pagamento: p.forma_pagamento ?? "pix",
      status_pagamento: p.status_pagamento,
      data_inicio: p.data_inicio ?? new Date().toISOString().slice(0, 10),
      data_acerto: p.data_acerto ?? "",
      dia_vencimento_boleto: p.dia_vencimento_boleto ? String(p.dia_vencimento_boleto) : "",
      assinou_contrato: p.assinou_contrato ?? false,
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
      valor_mensal: form.forma_pagamento === "boleto" && form.valor_mensal ? Number(form.valor_mensal) : null,
      data_acerto: form.forma_pagamento === "boleto" ? (form.data_acerto || null) : null,
      dia_vencimento_boleto: form.forma_pagamento === "boleto" && form.dia_vencimento_boleto
        ? Number(form.dia_vencimento_boleto) : null,
    };
    const method = editando ? "PATCH" : "POST";
    const url = editando ? `/api/laser/${editando.id}` : "/api/laser";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { const d = await res.json(); toast.error(d.erro ?? "Erro ao salvar"); }
    else { toast.success(editando ? "Pacote atualizado!" : "Pacote criado!"); }
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
        <div className="flex gap-2">
          {/* ✅ Botão para acessar aba de Boletos */}
          <button onClick={() => router.push("/admin/laser/boletos")}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
            style={{ background: "rgba(232,122,122,0.1)", color: "#e87a7a", border: "1px solid rgba(232,122,122,0.3)" }}>
            🔴 Boletos
            {resumo && resumo.totalBoleto > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#e87a7a", color: "white" }}>
                {resumo.totalBoleto}
              </span>
            )}
          </button>
          <button onClick={abrirNovo}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
            style={{ background: "var(--gold)", color: "var(--bg-input)" }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Novo Pacote
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      {resumo && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          {[
            { label: "Total",      valor: resumo.totalPacientes, icon: "👥", cor: "var(--gold)" },
            { label: "Ativos",     valor: resumo.pacotesAtivos,  icon: "🔆", cor: "#7ae8a0" },
            { label: "Sessões",    valor: resumo.sessoesMes,     icon: "✅", cor: "#a89bcc" },
            { label: "Faturamento",valor: `R$ ${resumo.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: "💰", cor: "var(--gold)" },
            { label: "Pacotes",    valor: resumo.totalPacotes,   icon: "📦", cor: "var(--gold)" },
            { label: "Gratuitos",  valor: resumo.totalGratuitos, icon: "🎁", cor: "#7ae8a0" },
            { label: "Avulsos",    valor: resumo.totalAvulsos,   icon: "⚡", cor: "#a89bcc" },
            { label: "Boleto",     valor: resumo.totalBoleto,    icon: "🔴", cor: "#e87a7a" },
          ].map((c, i) => (
            <div key={i} className="rounded-2xl p-4"
              onClick={() => c.label === "Boleto" && router.push("/admin/laser/boletos")}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", cursor: c.label === "Boleto" ? "pointer" : "default" }}>
              <div className="text-lg mb-1">{c.icon}</div>
              <p className="text-lg font-bold" style={{ color: c.cor }}>{c.valor}</p>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{c.label}</p>
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

        <select value={filtroForma} onChange={e => setFiltroForma(e.target.value)}
          className="rounded-2xl px-4 py-3 text-sm outline-none"
          style={{ background: filtroForma === "boleto" ? "rgba(232,122,122,0.1)" : "var(--bg-card)", border: filtroForma === "boleto" ? "1px solid #e87a7a" : "1px solid var(--border-color)", color: filtroForma ? "var(--text-primary)" : "var(--text-muted)" }}>
          <option value="">Todas as formas</option>
          {formas.map(f => <option key={f} value={f}>{formaCfg[f]?.label ?? f}</option>)}
        </select>

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
        <div className="text-center py-20 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <p className="text-4xl mb-4">🔆</p>
          <p className="text-lg font-semibold mb-2" style={{ color: "var(--gold)" }}>Nenhum pacote encontrado</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Cadastre o primeiro pacote laser</p>
        </div>
      ) : (
        <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {["Paciente", "Áreas", "Categoria", "Forma Pag.", "Status Pag.", "Acerto", "Contrato", "Sessões", "Status", "Profissional", ""].map(h => (
                    <th key={h} className="text-left px-4 py-4 text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pacotes.map((p, i) => {
                  const areas = Array.isArray(p.procedimento) ? p.procedimento : ((p.procedimento as string) ?? "").split(", ").filter(Boolean);
                  const pct = Math.round((p.sessoes_feitas / p.total_sessoes) * 100);
                  const restantes = p.total_sessoes - p.sessoes_feitas;
                  const sc = statusCfg[p.status] ?? statusCfg.em_tratamento;
                  const pc = pagCfg[p.status_pagamento] ?? pagCfg.pendente;
                  const cc = categoriaCfg[p.categoria] ?? categoriaCfg.Pacote;
                  const fc = formaCfg[p.forma_pagamento ?? ""] ?? null;
                  const eBoleto = p.forma_pagamento === "boleto";
                  const faltaCadastro = camposFaltando(p.pacientes);

                  return (
                    <tr key={p.id}
                      className="transition cursor-pointer"
                      style={{
                        borderBottom: i < pacotes.length - 1 ? "1px solid var(--border-subtle)" : "none",
                        background: eBoleto ? "rgba(232,122,122,0.03)" : "transparent",
                      }}
                      onClick={() => router.push(`/admin/laser/${p.id}`)}>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
                            {p.pacientes?.nome?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{p.pacientes?.nome}</p>
                              {faltaCadastro.length > 0 && (
                                <span title={`Faltando: ${faltaCadastro.join(", ")}`}
                                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                                  style={{ background: "rgba(232,201,122,0.15)", color: "#e8c97a" }}>
                                  ⚠ {faltaCadastro.join(", ")}
                                </span>
                              )}
                            </div>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{p.pacientes?.telefone}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {areas.map(a => (
                            <span key={a} className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: "var(--border-subtle)", color: "var(--text-muted)" }}>{a}</span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: cc.color, background: cc.bg }}>{cc.label}</span>
                      </td>

                      <td className="px-4 py-4">
                        {fc ? (
                          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: fc.color, background: fc.bg }}>
                            {eBoleto ? "🔴 " : ""}{fc.label}
                            {eBoleto && p.dia_vencimento_boleto && ` (dia ${p.dia_vencimento_boleto})`}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: pc.color, background: pc.bg }}>{pc.label}</span>
                      </td>

                      <td className="px-4 py-4 text-xs" style={{ color: eBoleto ? "#e87a7a" : "var(--text-muted)" }}>
                        {eBoleto && p.data_acerto
                          ? new Date(p.data_acerto + "T12:00:00").toLocaleDateString("pt-BR")
                          : eBoleto ? <span style={{ color: "#e87a7a" }}>⚠ Sem data</span> : "—"}
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: p.assinou_contrato ? "rgba(122,232,160,0.1)" : "rgba(232,122,122,0.1)", color: p.assinou_contrato ? "#7ae8a0" : "#e87a7a" }}>
                          {p.assinou_contrato ? "Sim" : "Não"}
                        </span>
                      </td>

                      <td className="px-4 py-4" style={{ minWidth: 120 }}>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full" style={{ background: "var(--border-subtle)" }}>
                            <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: "var(--gold)" }} />
                          </div>
                          <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>{p.sessoes_feitas}/{p.total_sessoes}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: sc.color, background: sc.bg }}>{sc.label}</span>
                      </td>

                      <td className="px-4 py-4 text-sm" style={{ color: "var(--text-muted)" }}>{p.funcionarios?.nome ?? "—"}</td>

                      <td className="px-4 py-4">
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={e => abrirEdicao(p, e)}
                            className="p-1.5 rounded-lg transition hover:opacity-70"
                            style={{ background: "var(--gold-bg)" }} title="Editar">
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="var(--gold)" strokeWidth={1.5}>
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button onClick={e => excluirPacote(p.id, e)}
                            className="p-1.5 rounded-lg transition hover:opacity-70"
                            style={{ background: "rgba(232,122,122,0.1)" }} title="Excluir">
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#e87a7a" strokeWidth={1.5}>
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
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
              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>Paciente</label>
                <select value={form.paciente_id} onChange={e => setForm(f => ({ ...f, paciente_id: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={inputStyle}>
                  <option value="">Selecionar paciente...</option>
                  {pacientesLista.map((p: any) => <option key={p.id} value={p.id}>{p.nome} - {p.telefone}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>Categoria</label>
                <div className="flex gap-2">
                  {(["Pacote", "Gratuito", "Avulso"] as const).map(cat => (
                    <button key={cat} type="button"
                      onClick={() => setForm(f => ({ ...f, categoria: cat }))}
                      className="flex-1 py-2.5 rounded-2xl text-sm font-medium transition"
                      style={{
                        background: form.categoria === cat ? "var(--gold)" : "var(--bg-input)",
                        color: form.categoria === cat ? "var(--bg-card)" : "var(--text-muted)",
                        border: "1px solid var(--border-color)",
                      }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-widest block mb-3" style={{ color: "var(--text-muted)" }}>
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
                          background: selecionada ? "var(--gold-bg)" : "var(--bg-input)",
                          border: selecionada ? "1px solid rgba(200,160,120,0.5)" : "1px solid var(--border-color)",
                          color: selecionada ? "var(--gold)" : "var(--text-muted)",
                        }}>
                        <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                          style={{ background: selecionada ? "var(--gold)" : "transparent", border: selecionada ? "none" : "1px solid var(--border-color)" }}>
                          {selecionada && (
                            <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="var(--bg-card)" strokeWidth={3}>
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

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>Total de Sessões</label>
                <input type="number" value={form.total_sessoes}
                  onChange={e => setForm(f => ({ ...f, total_sessoes: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>
                  {form.forma_pagamento === "boleto" ? "Valor Total do Pacote (R$)" : "Valor (R$)"} {form.categoria === "Gratuito" && <span style={{ color: "#7ae8a0" }}>— Gratuito</span>}
                </label>
                <input type="number" value={form.valor}
                  onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                  placeholder="0,00" disabled={form.categoria === "Gratuito"}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ ...inputStyle, opacity: form.categoria === "Gratuito" ? 0.4 : 1 }} />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>Forma de Pagamento</label>
                <select value={form.forma_pagamento} onChange={e => setForm(f => ({ ...f, forma_pagamento: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ ...inputStyle, color: form.forma_pagamento === "boleto" ? "#e87a7a" : "var(--text-primary)" }}
                  disabled={form.categoria === "Gratuito"}>
                  {formas.map(f => <option key={f} value={f}>{formaCfg[f]?.label ?? f}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>Status Pagamento</label>
                <select value={form.status_pagamento} onChange={e => setForm(f => ({ ...f, status_pagamento: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={inputStyle}
                  disabled={form.categoria === "Gratuito"}>
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="parcial">Parcial</option>
                </select>
              </div>

              {/* ✅ Campos exclusivos de boleto */}
              {form.forma_pagamento === "boleto" && (
                <>
                  <div>
                    <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#e87a7a" }}>
                      🔴 Valor Mensal / Parcela (R$)
                    </label>
                    <input type="number" value={form.valor_mensal}
                      onChange={e => setForm(f => ({ ...f, valor_mensal: e.target.value }))}
                      placeholder="0,00"
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{ ...inputStyle, borderColor: "#e87a7a" }} />
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Parcela que o paciente paga por mês no boleto.
                    </p>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#e87a7a" }}>
                      🔴 Dia de Vencimento
                    </label>
                    <div className="flex gap-2">
                      {["10", "15", "20"].map(dia => (
                        <button key={dia} type="button"
                          onClick={() => setForm(f => ({ ...f, dia_vencimento_boleto: dia }))}
                          className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition"
                          style={{
                            background: form.dia_vencimento_boleto === dia ? "#e87a7a" : "var(--bg-input)",
                            color: form.dia_vencimento_boleto === dia ? "white" : "var(--text-muted)",
                            border: "1px solid rgba(232,122,122,0.3)",
                          }}>
                          Dia {dia}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#e87a7a" }}>
                      Data do Último Acerto
                    </label>
                    <input type="date" value={form.data_acerto}
                      onChange={e => setForm(f => ({ ...f, data_acerto: e.target.value }))}
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{ ...inputStyle, borderColor: "#e87a7a", colorScheme: "dark" }} />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>Data de Início</label>
                <input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ ...inputStyle, colorScheme: "dark" }} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>Profissional</label>
                <select value={form.funcionario_id} onChange={e => setForm(f => ({ ...f, funcionario_id: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={inputStyle}>
                  <option value="">Selecionar profissional...</option>
                  {funcionariosLista.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  rows={2} placeholder="Observações do pacote..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inputStyle} />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3">
                <button type="button" onClick={() => setForm(f => ({ ...f, assinou_contrato: !f.assinou_contrato }))}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition flex-shrink-0"
                  style={{ background: form.assinou_contrato ? "#7ae8a0" : "transparent", border: `1px solid ${form.assinou_contrato ? "#7ae8a0" : "var(--border-color)"}` }}>
                  {form.assinou_contrato && (
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="var(--bg-card)" strokeWidth={2.5}>
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>Assinou o contrato</span>
              </div>

              <div className="sm:col-span-2 flex items-center gap-3">
                <button type="button" onClick={() => setForm(f => ({ ...f, assinou_termo: !f.assinou_termo }))}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition flex-shrink-0"
                  style={{ background: form.assinou_termo ? "var(--gold)" : "transparent", border: `1px solid ${form.assinou_termo ? "var(--gold)" : "var(--border-color)"}` }}>
                  {form.assinou_termo && (
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="var(--bg-card)" strokeWidth={2.5}>
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>Assinou o termo de consentimento</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                Cancelar
              </button>
              <button onClick={salvar}
                disabled={salvando || !form.paciente_id || form.areas.length === 0}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{
                  background: !salvando && form.paciente_id && form.areas.length > 0 ? "var(--gold)" : "rgba(200,160,120,0.3)",
                  color: "var(--bg-card)",
                }}>
                {salvando ? "Salvando..." : editando ? "Salvar Alterações" : "Salvar Pacote"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`select option { background: var(--bg-card); } input::placeholder, textarea::placeholder { color: var(--text-muted); }`}</style>
    </div>
  );
}