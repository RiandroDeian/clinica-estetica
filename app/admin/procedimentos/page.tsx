"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type Procedimento = {
  id: string;
  nome: string;
  cor: string;
  duracao_minutos: number;
  preco?: number;
  desconto_maximo?: number;
  ativo: boolean;
  retornos_meses?: number[] | null;
  alertas_contato?: string[] | null;
  mostrar_no_site?: boolean;
  zerar_por_agendamento?: boolean;
};

const ALERTAS_CONTATO_OPCOES = [
  { key: "24h",          label: "24h" },
  { key: "48h",          label: "48h" },
  { key: "72h_feedback", label: "Feedback 72h" },
  { key: "7d",           label: "7 dias" },
];
const CONTATO_PADRAO = ALERTAS_CONTATO_OPCOES.map(o => o.key);

const CORES = ["#c8a078","#b08060","#a07050","#d0a080","#c09070","#7ae8a0","#7ab8e8","#e87a7a","#e8c97a","#c87ae8","#78c8e8","#e8a07a","#a0c878","#e87ac8","#8a6f5a"];

const MESES_PRESET = [3, 6, 12];

const formInicial = { nome: "", cor: "#c8a078", duracao_minutos: 60, preco: "", desconto_maximo: "0", retornos_meses: [] as number[], alertas_contato: [...CONTATO_PADRAO] as string[], mostrar_no_site: true, zerar_por_agendamento: true };

export default function ProcedimentosPage() {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Procedimento | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState<"todos"|"ativos"|"inativos">("ativos");
  const [form, setForm] = useState(formInicial);
  const [novoMes, setNovoMes] = useState("");

  function toggleContato(key: string) {
    setForm(f => ({ ...f, alertas_contato: f.alertas_contato.includes(key) ? f.alertas_contato.filter(k => k !== key) : [...f.alertas_contato, key] }));
  }
  function toggleMes(m: number) {
    setForm(f => ({ ...f, retornos_meses: f.retornos_meses.includes(m) ? f.retornos_meses.filter(x => x !== m) : [...f.retornos_meses, m] }));
  }
  function adicionarMes() {
    const m = Math.trunc(Number(novoMes));
    if (!Number.isFinite(m) || m <= 0 || m > 24) return;
    setForm(f => ({ ...f, retornos_meses: f.retornos_meses.includes(m) ? f.retornos_meses : [...f.retornos_meses, m] }));
    setNovoMes("");
  }

  async function buscar() {
    setCarregando(true);
    const res = await fetch("/api/procedimentos");
    const data = await res.json();
    setProcedimentos(Array.isArray(data) ? data : []);
    setCarregando(false);
  }

  useEffect(() => { buscar(); }, []);

  function abrirNovo() {
    setEditando(null);
    setForm(formInicial);
    setModalAberto(true);
  }

  function abrirEditar(p: Procedimento) {
    setEditando(p);
    setForm({ nome: p.nome, cor: p.cor, duracao_minutos: p.duracao_minutos, preco: p.preco?.toString() ?? "", desconto_maximo: p.desconto_maximo?.toString() ?? "0", retornos_meses: [...(p.retornos_meses ?? [])], alertas_contato: p.alertas_contato ?? [...CONTATO_PADRAO], mostrar_no_site: p.mostrar_no_site ?? true, zerar_por_agendamento: p.zerar_por_agendamento ?? true });
    setModalAberto(true);
  }

  async function salvar() {
    setSalvando(true);
    const meses = Array.from(new Set(form.retornos_meses)).sort((a, b) => a - b);
    const body = { ...form, preco: form.preco ? parseFloat(form.preco) : null, desconto_maximo: parseFloat(form.desconto_maximo) || 0, duracao_minutos: Number(form.duracao_minutos), retornos_meses: meses.length ? meses : null, alertas_contato: form.alertas_contato };
    const url = editando ? `/api/procedimentos/${editando.id}` : "/api/procedimentos";
    const method = editando ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) toast.success(editando ? "Procedimento atualizado!" : "Procedimento criado!");
    else toast.error("Erro ao salvar");
    setModalAberto(false);
    buscar();
    setSalvando(false);
  }

  async function toggleAtivo(p: Procedimento) {
    await fetch(`/api/procedimentos/${p.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, ativo: !p.ativo }),
    });
    toast.success(p.ativo ? "Procedimento desativado" : "Procedimento ativado");
    buscar();
  }

  async function excluir(p: Procedimento) {
    if (!confirm(`Excluir "${p.nome}"? Esta ação não pode ser desfeita.`)) return;
    await fetch(`/api/procedimentos/${p.id}`, { method: "DELETE" });
    toast.success("Procedimento excluído");
    buscar();
  }

  const filtrados = procedimentos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    const matchAtivo = filtroAtivo === "todos" ? true : filtroAtivo === "ativos" ? p.ativo : !p.ativo;
    return matchBusca && matchAtivo;
  });

  const ativos   = procedimentos.filter(p => p.ativo).length;
  const inativos = procedimentos.filter(p => !p.ativo).length;
  const comPreco = procedimentos.filter(p => p.preco).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Gestão</p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Procedimentos</h1>
        </div>
        <button onClick={abrirNovo}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{ background: "var(--gold)", color: "#0a0707" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          Novo Procedimento
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Total",     valor: procedimentos.length, cor: "var(--gold)"    },
          { label: "Ativos",    valor: ativos,               cor: "var(--success)" },
          { label: "Com Preço", valor: comPreco,             cor: "var(--info)"    },
        ].map(k => (
          <div key={k.label} className="rounded-2xl px-5 py-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <p className="text-xl font-bold" style={{ color: k.cor }}>{k.valor}</p>
            <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Busca e filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" stroke="currentColor" strokeWidth={1.5} style={{ color: "var(--text-muted)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input type="text" placeholder="Buscar procedimento..." value={busca} onChange={e => setBusca(e.target.value)}
            className="w-full rounded-2xl pl-11 pr-5 py-3 text-sm outline-none"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
        </div>
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          {(["todos","ativos","inativos"] as const).map(f => (
            <button key={f} onClick={() => setFiltroAtivo(f)}
              className="px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition"
              style={{ background: filtroAtivo === f ? "var(--gold-bg)" : "transparent", color: filtroAtivo === f ? "var(--gold)" : "var(--text-muted)" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {carregando ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-4xl mb-3">💆</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum procedimento encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(p => (
            <div key={p.id} className="rounded-3xl p-6 transition hover:scale-[1.01] duration-200"
              style={{ background: "var(--bg-card)", border: `1px solid ${p.ativo ? "var(--border-color)" : "var(--border-subtle)"}`, opacity: p.ativo ? 1 : 0.6 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: p.cor }} />
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{p.nome}</h3>
                </div>
                {!p.ativo && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--border-color)", color: "var(--text-muted)" }}>Inativo</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Duração</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--gold)" }}>{p.duracao_minutos} min</p>
                </div>
                {p.preco && (
                  <div>
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Preço</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--gold)" }}>
                      R$ {p.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
                {p.desconto_maximo && p.desconto_maximo > 0 ? (
                  <div>
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Desc. máximo</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--warning)" }}>
                      R$ {p.desconto_maximo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <button onClick={() => abrirEditar(p)}
                  className="flex-1 py-2 rounded-xl text-xs transition hover:opacity-80"
                  style={{ background: "var(--gold-bg)", color: "var(--gold)", border: "1px solid var(--border-color)" }}>
                  Editar
                </button>
                <button onClick={() => toggleAtivo(p)}
                  className="flex-1 py-2 rounded-xl text-xs transition hover:opacity-80"
                  style={{ background: p.ativo ? "var(--border-subtle)" : "rgba(122,232,160,0.1)", color: p.ativo ? "var(--text-muted)" : "var(--success)", border: "1px solid var(--border-subtle)" }}>
                  {p.ativo ? "Desativar" : "Ativar"}
                </button>
                <button onClick={() => excluir(p)}
                  className="py-2 px-3 rounded-xl text-xs transition hover:opacity-80"
                  style={{ background: "rgba(232,122,122,0.08)", color: "var(--danger)", border: "1px solid rgba(232,122,122,0.2)" }}>
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-3xl p-8 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest" style={{ color: "var(--gold)" }}>Gestão</p>
                <h2 className="text-xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
                  {editando ? "Editar Procedimento" : "Novo Procedimento"}
                </h2>
              </div>
              <button onClick={() => setModalAberto(false)} style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Nome</label>
                <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Botox Full Face"
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Duração (min)</label>
                  <input type="number" value={form.duracao_minutos} onChange={e => setForm(f => ({ ...f, duracao_minutos: parseInt(e.target.value) }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Preço (R$)</label>
                  <input type="number" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))}
                    placeholder="0,00"
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Desconto máximo (R$)</label>
                <input type="number" value={form.desconto_maximo} onChange={e => setForm(f => ({ ...f, desconto_maximo: e.target.value }))}
                  placeholder="0,00"
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Limite de desconto que a recepcionista pode conceder</p>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-1" style={{ color: "var(--text-secondary)" }}>Alertas</label>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                  Marque os alertas que este procedimento dispara na aba Pacientes / sininho. <strong>Desmarque todos</strong> = sem alerta (ex.: Depilação a Laser).
                </p>

                {/* Pós-atendimento (zeram a cada atendimento) */}
                <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Pós-atendimento</p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {ALERTAS_CONTATO_OPCOES.map(op => {
                    const on = form.alertas_contato.includes(op.key);
                    return (
                      <button key={op.key} type="button" onClick={() => toggleContato(op.key)}
                        className="px-3 py-1.5 rounded-xl text-xs transition"
                        style={{ background: on ? "var(--gold-bg)" : "var(--bg-input)", color: on ? "var(--gold)" : "var(--text-muted)", border: `1px solid ${on ? "rgba(200,160,120,0.3)" : "var(--border-subtle)"}` }}>
                        {on ? "✓ " : ""}📞 {op.label}
                      </button>
                    );
                  })}
                </div>

                {/* Retornos (por meses) */}
                <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Retornos (meses)</p>
                <div className="flex gap-2 flex-wrap items-center">
                  {Array.from(new Set([...MESES_PRESET, ...form.retornos_meses])).sort((a, b) => a - b).map(m => {
                    const on = form.retornos_meses.includes(m);
                    return (
                      <button key={m} type="button" onClick={() => toggleMes(m)}
                        className="px-3 py-1.5 rounded-xl text-xs transition"
                        style={{ background: on ? "rgba(200,122,232,0.15)" : "var(--bg-input)", color: on ? "#c87ae8" : "var(--text-muted)", border: `1px solid ${on ? "rgba(200,122,232,0.35)" : "var(--border-subtle)"}` }}>
                        {on ? "✓ " : ""}💉 {m} {m === 1 ? "mês" : "meses"}
                      </button>
                    );
                  })}
                  <div className="flex items-center gap-1">
                    <input type="number" value={novoMes} onChange={e => setNovoMes(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); adicionarMes(); } }}
                      placeholder="+ meses" min={1} max={24}
                      className="w-24 rounded-xl px-3 py-1.5 text-xs outline-none"
                      style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
                    <button type="button" onClick={adicionarMes}
                      className="px-2.5 py-1.5 rounded-xl text-xs transition hover:opacity-70"
                      style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>Adicionar</button>
                  </div>
                </div>

                {/* Zerar alertas a cada novo agendamento (deste procedimento) */}
                <div className="flex items-center justify-between mt-3 rounded-2xl px-3 py-2.5" style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                  <div className="pr-3">
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>Zerar alertas a cada novo agendamento</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Ligado (ex.: capilar): um novo agendamento apaga o alerta antigo deste procedimento. Desligado (ex.: botox): mantém.
                    </p>
                  </div>
                  <button type="button" onClick={() => setForm(f => ({ ...f, zerar_por_agendamento: !f.zerar_por_agendamento }))}
                    className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                    style={{ background: form.zerar_por_agendamento ? "var(--gold)" : "var(--border-color)" }}>
                    <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: form.zerar_por_agendamento ? "calc(100% - 20px)" : "4px" }} />
                  </button>
                </div>
              </div>

              {/* Mostrar no site público */}
              <div className="flex items-center justify-between rounded-2xl px-3 py-2.5" style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                <div className="pr-3">
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>Mostrar no site</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Se ligado, aparece na lista de procedimentos do site de agendamento público.
                  </p>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, mostrar_no_site: !f.mostrar_no_site }))}
                  className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                  style={{ background: form.mostrar_no_site ? "#7ae8a0" : "var(--border-color)" }}>
                  <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: form.mostrar_no_site ? "calc(100% - 20px)" : "4px" }} />
                </button>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-3" style={{ color: "var(--text-secondary)" }}>Cor no calendário</label>
                <div className="flex gap-2 flex-wrap">
                  {CORES.map(cor => (
                    <button key={cor} onClick={() => setForm(f => ({ ...f, cor }))}
                      className="w-8 h-8 rounded-full transition hover:scale-110"
                      style={{ background: cor, border: form.cor === cor ? "3px solid white" : "2px solid transparent" }} />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-4 h-4 rounded-full" style={{ background: form.cor }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Cor selecionada</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando || !form.nome}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: form.nome ? "var(--gold)" : "var(--gold-bg)", color: "#0a0707", opacity: salvando ? 0.7 : 1 }}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`input::placeholder { color: var(--text-muted); }`}</style>
    </div>
  );
}
