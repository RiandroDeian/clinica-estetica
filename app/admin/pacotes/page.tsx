"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type Paciente = { id: string; nome: string };
type Procedimento = { id: string; nome: string; cor: string };

type Pacote = {
  id: string;
  nome_pacote: string;
  categoria: string;
  total_sessoes: number;
  sessoes_usadas: number;
  sessoes_bonus: number;
  status: string;
  valor?: number;
  validade?: string;
  observacoes?: string;
  comprado_em?: string;
  pacientes?: { nome: string };
  procedimentos?: { id: string; nome: string }[];
};

const categoriaCfg: Record<string, { color: string; bg: string }> = {
  Pacote:   { color: "var(--gold)", bg: "var(--gold-bg)" },
  Gratuito: { color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  Avulso:   { color: "#a89bcc", bg: "rgba(168,155,204,0.1)" },
};

const statusCfg: Record<string, { color: string; bg: string }> = {
  Ativo:     { color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  Expirado:  { color: "#e87a7a", bg: "rgba(232,122,122,0.1)" },
  Congelado: { color: "#7ab8e8", bg: "rgba(122,184,232,0.1)" },
  Concluido: { color: "var(--text-secondary)", bg: "rgba(168,144,128,0.1)" },
};

const formInicial = {
  nome_pacote: "", paciente_id: "", procedimento_ids: [] as string[],
  categoria: "Pacote", total_sessoes: 10, valor: "",
  validade: "", observacoes: "",
};

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
}

export default function PacotesPage() {
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalGestao, setModalGestao] = useState<Pacote | null>(null);
  const [editando, setEditando] = useState<Pacote | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(formInicial);
  const [abaGestao, setAbaGestao] = useState<"resumo"|"sessoes"|"financeiro">("resumo");

  async function carregar() {
    try {
      const [p1, p2, p3] = await Promise.all([
        fetch("/api/pacotes").then(r => r.json()),
        fetch("/api/pacientes").then(r => r.json()),
        fetch("/api/procedimentos").then(r => r.json()),
      ]);
      setPacotes(Array.isArray(p1) ? p1 : p1.data ?? []);
      setPacientes(Array.isArray(p2) ? p2 : p2.data ?? []);
      setProcedimentos(Array.isArray(p3) ? p3 : p3.data ?? []);
    } catch (e) { console.error(e); }
  }

  useEffect(() => { carregar(); }, []);

  function abrirNovo() {
    setEditando(null);
    setForm(formInicial);
    setModalAberto(true);
  }

  function abrirEdicao(pacote: Pacote) {
    setEditando(pacote);
    setForm({
      nome_pacote: pacote.nome_pacote,
      paciente_id: "",
      procedimento_ids: pacote.procedimentos?.map(p => p.id) ?? [],
      categoria: pacote.categoria,
      total_sessoes: pacote.total_sessoes,
      valor: String(pacote.valor ?? ""),
      validade: pacote.validade ?? "",
      observacoes: pacote.observacoes ?? "",
    });
    setModalAberto(true);
  }

  async function salvar() {
    if (!form.paciente_id && !editando) { toast.error("Selecione um paciente"); return; }
    if (form.procedimento_ids.length === 0 && !editando) { toast.error("Selecione ao menos um procedimento"); return; }
    setSalvando(true);

    const payload = {
      nome_pacote: form.nome_pacote,
      paciente_id: form.paciente_id || undefined,
      procedimento_ids: form.procedimento_ids.length > 0 ? form.procedimento_ids : undefined,
      total_sessoes: Number(form.total_sessoes),
      categoria: form.categoria,
      valor: form.valor ? Number(form.valor) : null,
      validade: form.validade || null,
      observacoes: form.observacoes || null,
    };

    const method = editando ? "PATCH" : "POST";
    const url = editando ? `/api/pacotes/${editando.id}` : "/api/pacotes";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) toast.error(data.erro || "Erro ao salvar");
    else { setModalAberto(false); setEditando(null); carregar(); toast.success(editando ? "Pacote atualizado!" : "Pacote criado!"); }
    setSalvando(false);
  }

  async function excluir(id: string) {
    if (!confirm("Deseja excluir este pacote?")) return;
    const res = await fetch(`/api/pacotes/${id}`, { method: "DELETE" });
    if (res.ok) { carregar(); toast.success("Pacote excluído!"); }
    else toast.error("Erro ao excluir");
  }

  async function salvarGestao(campos: Partial<Pacote>) {
    if (!modalGestao) return;
    const res = await fetch(`/api/pacotes/${modalGestao.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campos),
    });
    if (res.ok) {
      const atualizado = await res.json();
      setModalGestao(prev => prev ? { ...prev, ...atualizado } : null);
      carregar();
      toast.success("Salvo!");
    } else toast.error("Erro ao salvar");
  }

  // KPIs
  const ativos    = pacotes.filter(p => p.status === "Ativo").length;
  const expirados = pacotes.filter(p => p.status === "Expirado").length;
  const receita   = pacotes.reduce((acc, p) => acc + (p.valor ?? 0), 0);

  const inp = "w-full rounded-2xl px-4 py-3 text-sm outline-none";
  const inpStyle = { background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } as const;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Gestão</p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Pacotes</h1>
        </div>
        <button onClick={abrirNovo}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{ background: "var(--gold)", color: "var(--bg-input)" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          Novo Pacote
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total",    valor: pacotes.length, cor: "var(--gold)" },
          { label: "Ativos",   valor: ativos,         cor: "#7ae8a0" },
          { label: "Expirados",valor: expirados,      cor: "#e87a7a" },
          { label: "Receita",  valor: `R$ ${receita.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, cor: "#e8c97a" },
        ].map(k => (
          <div key={k.label} className="rounded-2xl px-5 py-4" style={{ background: "var(--bg-card)", border: "1px solid var(--gold-bg)" }}>
            <p className="text-xl font-bold" style={{ color: k.cor }}>{k.valor}</p>
            <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {pacotes.length === 0 ? (
        <div className="text-center py-20 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--gold-bg)" }}>
          <p className="text-4xl mb-4">📦</p>
          <p className="text-lg font-semibold mb-2" style={{ color: "var(--gold)" }}>Nenhum pacote cadastrado</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Clique em Novo Pacote para começar</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pacotes.map(pacote => {
            const cc = categoriaCfg[pacote.categoria] ?? categoriaCfg.Pacote;
            const sc = statusCfg[pacote.status] ?? statusCfg.Ativo;
            const totalReal = pacote.total_sessoes + (pacote.sessoes_bonus ?? 0);
            const pct = totalReal > 0 ? Math.round((pacote.sessoes_usadas / totalReal) * 100) : 0;
            const restantes = totalReal - pacote.sessoes_usadas;
            const procs = pacote.procedimentos ?? [];

            return (
              <div key={pacote.id} className="rounded-3xl p-6 transition hover:scale-[1.005]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", cursor: "pointer" }}
                onClick={() => { setModalGestao(pacote); setAbaGestao("resumo"); }}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>{pacote.nome_pacote}</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: cc.color, background: cc.bg }}>{pacote.categoria}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: sc.color, background: sc.bg }}>{pacote.status}</span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Paciente: <span style={{ color: "var(--text-secondary)" }}>{pacote.pacientes?.nome ?? "—"}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => abrirEdicao(pacote)} className="p-2 rounded-xl transition hover:opacity-70"
                      style={{ background: "var(--gold-bg)" }}>
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="var(--gold)" strokeWidth={1.5}>
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button onClick={() => excluir(pacote.id)} className="p-2 rounded-xl transition hover:opacity-70"
                      style={{ background: "rgba(232,122,122,0.1)" }}>
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#e87a7a" strokeWidth={1.5}>
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {procs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {procs.map((p, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: "var(--border-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-color)" }}>
                        {p.nome}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>
                      {pacote.sessoes_usadas}/{totalReal} sessões
                      {(pacote.sessoes_bonus ?? 0) > 0 && <span style={{ color: "#7ae8a0" }}> (+{pacote.sessoes_bonus} bônus)</span>}
                    </span>
                    <span style={{ color: restantes <= 2 ? "#e87a7a" : "var(--text-muted)" }}>{restantes} restantes</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "var(--gold-bg)" }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 80 ? "#e87a7a" : "var(--gold)" }} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {pacote.valor ? (
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Valor: <span style={{ color: "var(--gold)", fontWeight: 600 }}>R$ {Number(pacote.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </p>
                  ) : <div />}
                  {pacote.validade && (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Validade: <span style={{ color: new Date(pacote.validade) < new Date() ? "#e87a7a" : "var(--text-secondary)" }}>
                        {new Date(pacote.validade).toLocaleDateString("pt-BR")}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL GESTÃO DO PACOTE */}
      {modalGestao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setModalGestao(null)}>
          <div className="w-full max-w-lg rounded-3xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(200,160,120,0.2)" }}>

            <div className="px-6 py-5 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--gold-bg)" }}>
              <div>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Gestão do Pacote</p>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>{modalGestao.nome_pacote}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{modalGestao.pacientes?.nome}</p>
              </div>
              <button onClick={() => setModalGestao(null)} style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Abas */}
            <div className="flex" style={{ borderBottom: "1px solid var(--gold-bg)" }}>
              {(["resumo","sessoes","financeiro"] as const).map(aba => (
                <button key={aba} onClick={() => setAbaGestao(aba)}
                  className="flex-1 py-3 text-xs uppercase tracking-widest transition"
                  style={{ background: abaGestao === aba ? "var(--gold-bg)" : "transparent", color: abaGestao === aba ? "var(--gold)" : "var(--text-muted)", borderBottom: abaGestao === aba ? "2px solid #c8a078" : "2px solid transparent" }}>
                  {aba === "resumo" ? "Resumo" : aba === "sessoes" ? "Sessões" : "Financeiro"}
                </button>
              ))}
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">

              {/* ABA RESUMO */}
              {abaGestao === "resumo" && (
                <div className="flex flex-col gap-4">
                  {[
                    { label: "Procedimentos", valor: modalGestao.procedimentos?.map(p => p.nome).join(", ") || "—" },
                    { label: "Sessões usadas", valor: `${modalGestao.sessoes_usadas} / ${modalGestao.total_sessoes + (modalGestao.sessoes_bonus ?? 0)}` },
                    { label: "Sessões bônus", valor: String(modalGestao.sessoes_bonus ?? 0) },
                    { label: "Última sessão", valor: "—" },
                    { label: "Validade", valor: modalGestao.validade ? new Date(modalGestao.validade).toLocaleDateString("pt-BR") : "Sem validade" },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{item.label}</span>
                      <span className="text-sm" style={{ color: "var(--text-primary)" }}>{item.valor}</span>
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Status</label>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(statusCfg).map(([key, cfg]) => (
                        <button key={key} onClick={() => salvarGestao({ status: key })}
                          className="px-3 py-1.5 rounded-xl text-xs transition"
                          style={{ background: modalGestao.status === key ? cfg.bg : "transparent", color: cfg.color, border: `1px solid ${modalGestao.status === key ? cfg.color : `${cfg.color}40`}` }}>
                          {key}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA SESSÕES */}
              {abaGestao === "sessoes" && (
                <div className="flex flex-col gap-4">
                  <div className="px-4 py-3 rounded-2xl text-sm"
                    style={{ background: "var(--border-subtle)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                    Total atual: <strong style={{ color: "var(--gold)" }}>{modalGestao.total_sessoes + (modalGestao.sessoes_bonus ?? 0)}</strong> sessões
                    ({modalGestao.total_sessoes} + {modalGestao.sessoes_bonus ?? 0} bônus)
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Adicionar sessões bônus</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 5].map(n => (
                        <button key={n} onClick={() => salvarGestao({ sessoes_bonus: (modalGestao.sessoes_bonus ?? 0) + n })}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold transition hover:scale-105"
                          style={{ background: "rgba(122,232,160,0.1)", color: "#7ae8a0", border: "1px solid rgba(122,232,160,0.3)" }}>
                          +{n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Sessões usadas</label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => salvarGestao({ sessoes_usadas: Math.max(0, modalGestao.sessoes_usadas - 1) })}
                        className="w-10 h-10 rounded-xl text-lg font-bold transition hover:scale-105"
                        style={{ background: "rgba(232,122,122,0.1)", color: "#e87a7a" }}>−</button>
                      <span className="flex-1 text-center text-xl font-bold" style={{ color: "var(--gold)" }}>{modalGestao.sessoes_usadas}</span>
                      <button onClick={() => salvarGestao({ sessoes_usadas: Math.min(modalGestao.total_sessoes + (modalGestao.sessoes_bonus ?? 0), modalGestao.sessoes_usadas + 1) })}
                        className="w-10 h-10 rounded-xl text-lg font-bold transition hover:scale-105"
                        style={{ background: "rgba(122,232,160,0.1)", color: "#7ae8a0" }}>+</button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Nova validade</label>
                    <input type="date" defaultValue={modalGestao.validade ?? ""}
                      onBlur={e => salvarGestao({ validade: e.target.value || null })}
                      className={inp} style={{ ...inpStyle, colorScheme: "dark" }} />
                  </div>
                </div>
              )}

              {/* ABA FINANCEIRO */}
              {abaGestao === "financeiro" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Valor do pacote (R$)</label>
                    <input type="number" defaultValue={modalGestao.valor ?? ""}
                      onBlur={e => salvarGestao({ valor: e.target.value ? Number(e.target.value) : null })}
                      className={inp} style={inpStyle} placeholder="0,00" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl"
                    style={{ background: "var(--border-subtle)", border: "1px solid var(--border-color)" }}>
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Valor por sessão</p>
                    <p className="text-xl font-bold" style={{ color: "var(--gold)" }}>
                      {modalGestao.valor && modalGestao.total_sessoes > 0
                        ? `R$ ${(modalGestao.valor / modalGestao.total_sessoes).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Observações</label>
                    <textarea defaultValue={modalGestao.observacoes ?? ""}
                      onBlur={e => salvarGestao({ observacoes: e.target.value })}
                      rows={3} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                      style={inpStyle} placeholder="Observações..." />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO/EDITAR */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: "var(--gold)" }}>{editando ? "Editar Pacote" : "Novo Pacote"}</h2>
              <button onClick={() => setModalAberto(false)} style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Nome do Pacote</label>
                <input value={form.nome_pacote} onChange={e => setForm(f => ({ ...f, nome_pacote: e.target.value }))}
                  placeholder="Ex: Pacote Laser Feminino" className={inp} style={inpStyle} />
              </div>

              {!editando && (
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Paciente</label>
                  <select value={form.paciente_id} onChange={e => setForm(f => ({ ...f, paciente_id: e.target.value }))}
                    className={inp} style={{ ...inpStyle, color: form.paciente_id ? "var(--text-primary)" : "var(--text-muted)" }}>
                    <option value="">Selecionar paciente...</option>
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Categoria</label>
                <div className="flex gap-2">
                  {(["Pacote","Gratuito","Avulso"] as const).map(cat => (
                    <button key={cat} type="button" onClick={() => setForm(f => ({ ...f, categoria: cat }))}
                      className="flex-1 py-2.5 rounded-2xl text-sm font-medium transition"
                      style={{ background: form.categoria === cat ? "var(--gold)" : "var(--border-subtle)", color: form.categoria === cat ? "var(--bg-input)" : "var(--text-secondary)", border: "1px solid rgba(200,160,120,0.2)" }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest block mb-3" style={{ color: "var(--text-secondary)" }}>
                  Procedimentos <span style={{ color: "var(--text-muted)" }}>({form.procedimento_ids.length} selecionado{form.procedimento_ids.length !== 1 ? "s" : ""})</span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {procedimentos.map(proc => {
                    const sel = form.procedimento_ids.includes(proc.id);
                    return (
                      <button key={proc.id} type="button"
                        onClick={() => setForm(f => ({ ...f, procedimento_ids: toggleId(f.procedimento_ids, proc.id) }))}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition"
                        style={{ background: sel ? "var(--border-color)" : "var(--bg-hover)", border: sel ? "1px solid rgba(200,160,120,0.5)" : "1px solid var(--border-color)", color: sel ? "var(--text-primary)" : "var(--text-muted)" }}>
                        <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                          style={{ background: sel ? "var(--gold)" : "transparent", border: sel ? "none" : "1px solid rgba(200,160,120,0.3)" }}>
                          {sel && <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="var(--bg-input)" strokeWidth={3}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        {proc.nome}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Total de Sessões</label>
                  <input type="number" value={form.total_sessoes}
                    onChange={e => setForm(f => ({ ...f, total_sessoes: Number(e.target.value) }))}
                    className={inp} style={inpStyle} />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>
                    Valor (R$) {form.categoria === "Gratuito" && <span style={{ color: "#7ae8a0" }}>— Gratuito</span>}
                  </label>
                  <input type="number" value={form.valor}
                    onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                    placeholder="0,00" disabled={form.categoria === "Gratuito"}
                    className={inp} style={{ ...inpStyle, opacity: form.categoria === "Gratuito" ? 0.4 : 1 }} />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Validade</label>
                <input type="date" value={form.validade}
                  onChange={e => setForm(f => ({ ...f, validade: e.target.value }))}
                  className={inp} style={{ ...inpStyle, colorScheme: "dark" }} />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  rows={2} placeholder="Observações do pacote..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inpStyle} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{ border: "1px solid rgba(200,160,120,0.2)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={salvar} disabled={salvando}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: salvando ? "rgba(200,160,120,0.3)" : "var(--gold)", color: "var(--bg-input)" }}>
                {salvando ? "Salvando..." : editando ? "Salvar Alterações" : "Criar Pacote"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`select option { background: #120d0d; } input::placeholder, textarea::placeholder { color: #3a2e28; }`}</style>
    </div>
  );
}


