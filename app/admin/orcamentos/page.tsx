"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";

type Item = { nome: string; quantidade: number; preco: number };
type Orcamento = {
  id: string; nome?: string; telefone?: string; cpf?: string;
  status: string; itens: Item[]; valor_total: number;
  desconto: number; valor_final: number; validade?: string;
  notas?: string; criado_em: string;
  pacientes?: { nome: string; telefone: string };
  funcionarios?: { nome: string };
};
type Paciente = { id: string; nome: string; telefone?: string; cpf?: string };
type Procedimento = { id: string; nome: string; preco?: number };

const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
  rascunho:  { label: "Rascunho",  color: "#a89080", bg: "rgba(168,144,128,0.1)" },
  enviado:   { label: "Enviado",   color: "#7ab8e8", bg: "rgba(122,184,232,0.1)" },
  aprovado:  { label: "Aprovado",  color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  recusado:  { label: "Recusado",  color: "#e87a7a", bg: "rgba(232,122,122,0.1)" },
  expirado:  { label: "Expirado",  color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
};

const formInicial = {
  paciente_id: "", nome: "", telefone: "", cpf: "",
  desconto: "0", validade: "", notas: "", status: "rascunho",
};

export default function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Orcamento | null>(null);
  const [detalhe, setDetalhe] = useState<Orcamento | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [form, setForm] = useState(formInicial);
  const [itens, setItens] = useState<Item[]>([{ nome: "", quantidade: 1, preco: 0 }]);

  const buscar = useCallback(async () => {
    setCarregando(true);
    const params = new URLSearchParams();
    if (filtroStatus) params.set("status", filtroStatus);
    if (busca) params.set("busca", busca);
    const res = await fetch(`/api/orcamentos?${params}`);
    const data = await res.json();
    setOrcamentos(Array.isArray(data) ? data : []);
    setCarregando(false);
  }, [busca, filtroStatus]);

  useEffect(() => { buscar(); }, [buscar]);

  useEffect(() => {
    fetch("/api/pacientes").then(r => r.json()).then(d => setPacientes(Array.isArray(d) ? d : []));
    fetch("/api/procedimentos").then(r => r.json()).then(d => setProcedimentos(Array.isArray(d) ? d.filter((p: any) => p.ativo) : []));
  }, []);

  function abrirNovo() {
    setEditando(null);
    setForm(formInicial);
    setItens([{ nome: "", quantidade: 1, preco: 0 }]);
    setModalAberto(true);
  }

  function abrirEditar(o: Orcamento) {
    setEditando(o);
    setForm({
      paciente_id: "", nome: o.nome ?? "", telefone: o.telefone ?? "",
      cpf: o.cpf ?? "", desconto: String(o.desconto ?? 0),
      validade: o.validade ?? "", notas: o.notas ?? "", status: o.status,
    });
    setItens(o.itens?.length > 0 ? o.itens : [{ nome: "", quantidade: 1, preco: 0 }]);
    setDetalhe(null);
    setModalAberto(true);
  }

  function selecionarPaciente(id: string) {
    const p = pacientes.find(p => p.id === id);
    if (!p) { setForm(f => ({ ...f, paciente_id: "", nome: "", telefone: "", cpf: "" })); return; }
    setForm(f => ({ ...f, paciente_id: id, nome: p.nome, telefone: p.telefone ?? "", cpf: p.cpf ?? "" }));
  }

  function adicionarItem() {
    setItens(prev => [...prev, { nome: "", quantidade: 1, preco: 0 }]);
  }

  function removerItem(i: number) {
    setItens(prev => prev.filter((_, idx) => idx !== i));
  }

  function atualizarItem(i: number, campo: keyof Item, valor: string | number) {
    setItens(prev => prev.map((item, idx) => idx === i ? { ...item, [campo]: campo === "nome" ? valor : Number(valor) } : item));
  }

  function selecionarProcedimento(i: number, nome: string) {
    const proc = procedimentos.find(p => p.nome === nome);
    setItens(prev => prev.map((item, idx) => idx === i ? { ...item, nome, preco: proc?.preco ?? item.preco } : item));
  }

  const valorTotal = useMemo(() => itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0), [itens]);
  const valorFinal = useMemo(() => valorTotal - Number(form.desconto || 0), [valorTotal, form.desconto]);

  async function salvar() {
    if (itens.every(i => !i.nome)) { toast.error("Adicione pelo menos um item"); return; }
    setSalvando(true);
    const payload = { ...form, itens: itens.filter(i => i.nome) };
    const url    = editando ? `/api/orcamentos/${editando.id}` : "/api/orcamentos";
    const method = editando ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) toast.success(editando ? "Orçamento atualizado!" : "Orçamento criado!");
    else toast.error("Erro ao salvar");
    setModalAberto(false);
    buscar();
    setSalvando(false);
  }

  async function atualizarStatus(id: string, status: string) {
    await fetch(`/api/orcamentos/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success(`Status atualizado para ${statusCfg[status]?.label}`);
    buscar();
    if (detalhe?.id === id) setDetalhe(prev => prev ? { ...prev, status } : null);
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este orçamento?")) return;
    await fetch(`/api/orcamentos/${id}`, { method: "DELETE" });
    toast.success("Orçamento excluído");
    setDetalhe(null);
    buscar();
  }

  function gerarWhatsApp(o: Orcamento) {
    const telefone = o.pacientes?.telefone ?? o.telefone ?? "";
    const num = telefone.replace(/\D/g, "");
    const itensTexto = (o.itens ?? []).map(i => `  • ${i.nome} x${i.quantidade} — R$ ${(i.preco * i.quantidade).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`).join("\n");
    const msg = encodeURIComponent(
      `Olá${o.pacientes?.nome ?? o.nome ? `, ${(o.pacientes?.nome ?? o.nome)?.split(" ")[0]}` : ""}! 🌸\n\n` +
      `Segue seu orçamento da Moncié Esthetique:\n\n${itensTexto}\n\n` +
      `${o.desconto > 0 ? `Desconto: -R$ ${o.desconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` : ""}` +
      `*Total: R$ ${o.valor_final.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}*\n\n` +
      `${o.validade ? `Válido até: ${new Date(o.validade + "T12:00:00").toLocaleDateString("pt-BR")}\n\n` : ""}` +
      `Ficou alguma dúvida? Estamos à disposição! 💆‍♀️`
    );
    return `https://wa.me/55${num}?text=${msg}`;
  }

  const kpis = {
    total:    orcamentos.length,
    aprovados: orcamentos.filter(o => o.status === "aprovado").length,
    enviados:  orcamentos.filter(o => o.status === "enviado").length,
    valor:     orcamentos.filter(o => o.status === "aprovado").reduce((acc, o) => acc + Number(o.valor_final || 0), 0),
  };

  const inp = "w-full rounded-2xl px-4 py-3 text-sm outline-none";
  const inpStyle = { background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Vendas</p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Orçamentos</h1>
        </div>
        <button onClick={abrirNovo}
          className="px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{ background: "var(--gold)", color: "#0a0707" }}>
          + Novo Orçamento
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: "Total",     valor: kpis.total,                                                                              cor: "var(--gold)"    },
          { label: "Enviados",  valor: kpis.enviados,                                                                           cor: "var(--info)"    },
          { label: "Aprovados", valor: kpis.aprovados,                                                                          cor: "var(--success)" },
          { label: "Receita",   valor: `R$ ${kpis.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,               cor: "var(--gold)"    },
        ].map(k => (
          <div key={k.label} className="rounded-2xl px-5 py-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <p className="text-xl font-bold" style={{ color: k.cor }}>{k.valor}</p>
            <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" stroke="currentColor" strokeWidth={1.5} style={{ color: "var(--text-muted)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input type="text" placeholder="Buscar por nome ou telefone..." value={busca} onChange={e => setBusca(e.target.value)}
            className="w-full rounded-2xl pl-11 pr-5 py-3 text-sm outline-none"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="rounded-2xl px-4 py-3 text-sm outline-none"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: filtroStatus ? "var(--text-primary)" : "var(--text-muted)" }}>
          <option value="">Todos os status</option>
          {Object.entries(statusCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Lista */}
      <div className="flex gap-5">
        <div className={`flex-1 flex flex-col gap-3 ${detalhe ? "hidden lg:flex" : ""}`}>
          {carregando ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} />
            </div>
          ) : orcamentos.length === 0 ? (
            <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum orçamento encontrado</p>
            </div>
          ) : (
            orcamentos.map(o => {
              const cfg = statusCfg[o.status] ?? statusCfg.rascunho;
              const nome = o.pacientes?.nome ?? o.nome ?? "Sem nome";
              const tel  = o.pacientes?.telefone ?? o.telefone ?? "";
              const vencido = o.validade && new Date(o.validade) < new Date() && o.status !== "aprovado";
              return (
                <div key={o.id} className="rounded-3xl p-5 cursor-pointer transition hover:scale-[1.005]"
                  style={{ background: "var(--bg-card)", border: `1px solid ${detalhe?.id === o.id ? "var(--gold)" : "var(--border-color)"}` }}
                  onClick={() => setDetalhe(detalhe?.id === o.id ? null : o)}>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
                        {nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{nome}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {tel} · {(o.itens ?? []).length} item(s)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {vencido && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(232,201,122,0.1)", color: "var(--warning)" }}>Expirado</span>}
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      <p className="text-sm font-bold" style={{ color: "var(--gold)" }}>
                        R$ {Number(o.valor_final).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(o.criado_em).toLocaleDateString("pt-BR")}
                      {o.validade && ` · Válido até ${new Date(o.validade + "T12:00:00").toLocaleDateString("pt-BR")}`}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{o.funcionarios?.nome}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Painel detalhe */}
        {detalhe && (
          <div className="w-full lg:w-80 flex-shrink-0 rounded-3xl overflow-hidden flex flex-col"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <p className="text-xs uppercase tracking-widest" style={{ color: "var(--gold)" }}>Orçamento</p>
                <p className="font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{detalhe.pacientes?.nome ?? detalhe.nome}</p>
              </div>
              <button onClick={() => setDetalhe(null)} style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {/* Status */}
              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(statusCfg).map(([k, v]) => (
                    <button key={k} onClick={() => atualizarStatus(detalhe.id, k)}
                      className="py-2 rounded-xl text-xs transition"
                      style={{ background: detalhe.status === k ? v.bg : "var(--bg-input)", color: v.color, border: `1px solid ${detalhe.status === k ? v.color : "var(--border-subtle)"}` }}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Itens */}
              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Itens</p>
                <div className="flex flex-col gap-2">
                  {(detalhe.itens ?? []).map((item, i) => (
                    <div key={i} className="flex justify-between py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <div>
                        <p className="text-sm" style={{ color: "var(--text-primary)" }}>{item.nome}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>x{item.quantidade}</p>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "var(--gold)" }}>
                        R$ {(item.preco * item.quantidade).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totais */}
              <div className="rounded-2xl p-4" style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                {detalhe.desconto > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>Subtotal</span>
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>R$ {Number(detalhe.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {detalhe.desconto > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-sm" style={{ color: "var(--danger)" }}>Desconto</span>
                    <span className="text-sm" style={{ color: "var(--danger)" }}>- R$ {Number(detalhe.desconto).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Total</span>
                  <span className="text-lg font-bold" style={{ color: "var(--gold)" }}>R$ {Number(detalhe.valor_final).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {detalhe.notas && (
                <div className="rounded-xl p-3 text-sm" style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>
                  {detalhe.notas}
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="p-4 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <a href={gerarWhatsApp(detalhe)} target="_blank" rel="noopener noreferrer"
                onClick={() => atualizarStatus(detalhe.id, "enviado")}
                className="w-full py-2.5 rounded-2xl text-sm font-medium text-center transition hover:scale-105"
                style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>
                💬 Enviar pelo WhatsApp
              </a>
              <button onClick={() => abrirEditar(detalhe)}
                className="w-full py-2.5 rounded-2xl text-sm transition hover:opacity-80"
                style={{ background: "var(--gold-bg)", color: "var(--gold)", border: "1px solid var(--border-color)" }}>
                Editar
              </button>
              <button onClick={() => excluir(detalhe.id)}
                className="w-full py-2.5 rounded-2xl text-sm transition hover:opacity-80"
                style={{ background: "rgba(232,122,122,0.08)", color: "var(--danger)", border: "1px solid rgba(232,122,122,0.2)" }}>
                Excluir
              </button>
            </div>
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
                <p className="text-xs uppercase tracking-widest" style={{ color: "var(--gold)" }}>Vendas</p>
                <h2 className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
                  {editando ? "Editar Orçamento" : "Novo Orçamento"}
                </h2>
              </div>
              <button onClick={() => setModalAberto(false)} style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div className="flex flex-col gap-5">
              {/* Paciente */}
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>Paciente cadastrado (opcional)</label>
                <select value={form.paciente_id} onChange={e => selecionarPaciente(e.target.value)}
                  className={inp} style={{ ...inpStyle, color: form.paciente_id ? "var(--text-primary)" : "var(--text-muted)" }}>
                  <option value="">Selecionar paciente...</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>Nome</label>
                  <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    placeholder="Nome do cliente" className={inp} style={inpStyle} />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>Telefone</label>
                  <input type="tel" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                    placeholder="(61) 99999-9999" className={inp} style={inpStyle} />
                </div>
              </div>

              {/* Itens */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Itens do Orçamento</label>
                  <button onClick={adicionarItem} className="text-xs px-3 py-1.5 rounded-xl transition hover:opacity-80"
                    style={{ background: "var(--gold-bg)", color: "var(--gold)", border: "1px solid var(--border-color)" }}>
                    + Adicionar Item
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {itens.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <select value={item.nome} onChange={e => selecionarProcedimento(i, e.target.value)}
                          className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                          style={{ ...inpStyle, color: item.nome ? "var(--text-primary)" : "var(--text-muted)" }}>
                          <option value="">Procedimento...</option>
                          {procedimentos.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                          <option value="__custom__">Outro (digitar)</option>
                        </select>
                        {(item.nome === "__custom__" || !procedimentos.find(p => p.nome === item.nome)) && item.nome && item.nome !== "__custom__" && (
                          <input type="text" value={item.nome === "__custom__" ? "" : item.nome}
                            onChange={e => atualizarItem(i, "nome", e.target.value)}
                            placeholder="Nome do item" className="w-full rounded-xl px-3 py-2 text-sm outline-none mt-1"
                            style={inpStyle} />
                        )}
                      </div>
                      <div className="col-span-2">
                        <input type="number" value={item.quantidade} min={1}
                          onChange={e => atualizarItem(i, "quantidade", e.target.value)}
                          className="w-full rounded-xl px-3 py-2 text-sm outline-none text-center"
                          style={inpStyle} placeholder="Qtd" />
                      </div>
                      <div className="col-span-3">
                        <input type="number" value={item.preco}
                          onChange={e => atualizarItem(i, "preco", e.target.value)}
                          className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                          style={inpStyle} placeholder="R$" />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {itens.length > 1 && (
                          <button onClick={() => removerItem(i)} style={{ color: "var(--danger)" }}>
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totais */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>Desconto (R$)</label>
                  <input type="number" value={form.desconto} onChange={e => setForm(f => ({ ...f, desconto: e.target.value }))}
                    placeholder="0,00" className={inp} style={inpStyle} />
                </div>
                <div className="rounded-2xl px-4 py-3 flex flex-col justify-center"
                  style={{ background: "var(--gold-bg)", border: "1px solid var(--border-color)" }}>
                  <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Total Final</p>
                  <p className="text-xl font-bold mt-1" style={{ color: "var(--gold)" }}>
                    R$ {valorFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>Validade</label>
                  <input type="date" value={form.validade} onChange={e => setForm(f => ({ ...f, validade: e.target.value }))}
                    className={inp} style={{ ...inpStyle, colorScheme: "dark" }} />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className={inp} style={inpStyle}>
                    {Object.entries(statusCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>Observações</label>
                <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  rows={3} placeholder="Observações adicionais..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                  style={inpStyle} />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setModalAberto(false)}
                  className="flex-1 py-3 rounded-2xl text-sm transition hover:opacity-70"
                  style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                  Cancelar
                </button>
                <button onClick={salvar} disabled={salvando}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold transition hover:scale-105"
                  style={{ background: "var(--gold)", color: "#0a0707", opacity: salvando ? 0.7 : 1 }}>
                  {salvando ? "Salvando..." : editando ? "Salvar Alterações" : "Criar Orçamento"}
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
