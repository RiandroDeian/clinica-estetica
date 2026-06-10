"use client";
import { useEffect, useState, useCallback } from "react";

type Item = {
  id: string;
  nome: string;
  categoria?: string;
  quantidade: number;
  unidade: string;
  quantidade_minima: number;
  custo_medio?: number;
  fornecedor?: string;
  validade?: string;
  ambiente?: string;
};

type Movimentacao = {
  id: string;
  tipo: string;
  quantidade: number;
  motivo?: string;
  profissional_nome?: string;
  ambiente?: string;
  criado_em: string;
  estoque?: { nome: string; unidade: string };
  funcionarios?: { nome: string };
};

const AMBIENTES = [
  { key: "geral",       label: "Geral",       icon: "📦" },
  { key: "banheiro",    label: "Banheiro",    icon: "🚿" },
  { key: "dml",         label: "DML",         icon: "🗄️" },
  { key: "recepcao",    label: "Recepção",    icon: "🏥" },
  { key: "consultorio", label: "Consultório", icon: "🩺" },
];

export default function EstoquePage() {
  const [itens, setItens] = useState<Item[]>([]);
  const [historico, setHistorico] = useState<Movimentacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<"itens" | "historico">("itens");
  const [ambienteAtivo, setAmbienteAtivo] = useState("geral");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalMov, setModalMov] = useState<{ item: Item; tipo: "entrada" | "saida" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Item | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [qtdMov, setQtdMov] = useState("");
  const [motivoMov, setMotivoMov] = useState("");
  const [profissionalMov, setProfissionalMov] = useState("");
  const [pacienteMov, setPacienteMov] = useState("");
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<Item | null>(null);
  const [form, setForm] = useState({
    nome: "", categoria: "", quantidade: "0", unidade: "un",
    quantidade_minima: "5", custo_medio: "", fornecedor: "", validade: "", ambiente: "geral"
  });

  const buscar = useCallback(async () => {
    setCarregando(true);
    const [itemsRes, histRes] = await Promise.all([
      fetch("/api/estoque"),
      fetch("/api/estoque/historico"),
    ]);
    const itemsData = await itemsRes.json();
    const histData = await histRes.json();
    setItens(Array.isArray(itemsData) ? itemsData : []);
    setHistorico(Array.isArray(histData) ? histData : []);
    setCarregando(false);
  }, []);

  useEffect(() => { buscar(); }, [buscar]);

  async function salvar() {
    setSalvando(true);
    const payload = {
      ...form,
      quantidade: Number(form.quantidade),
      quantidade_minima: Number(form.quantidade_minima),
      custo_medio: form.custo_medio ? Number(form.custo_medio) : null,
      ambiente: form.ambiente || ambienteAtivo,
    };
    if (editando) {
      await fetch(`/api/estoque/${editando.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/estoque", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setModalAberto(false);
    setEditando(null);
    setForm({ nome: "", categoria: "", quantidade: "0", unidade: "un", quantidade_minima: "5", custo_medio: "", fornecedor: "", validade: "", ambiente: "geral" });
    buscar();
    setSalvando(false);
  }

  async function movimentar() {
    if (!modalMov || !qtdMov) return;
    setSalvando(true);
    await fetch(`/api/estoque/${modalMov.item.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: modalMov.tipo,
        quantidade: Number(qtdMov),
        motivo: motivoMov,
        profissional_nome: profissionalMov,
        paciente_nome: pacienteMov,
        ambiente: modalMov.item.ambiente || ambienteAtivo,
      }),
    });
    setModalMov(null);
    setQtdMov("");
    setMotivoMov("");
    setProfissionalMov("");
    setPacienteMov("");
    buscar();
    setSalvando(false);
  }

  async function deletar(item: Item) {
    await fetch(`/api/estoque/${item.id}`, { method: "DELETE" });
    setConfirmDelete(null);
    buscar();
  }

  const itensPorAmbiente = itens.filter(i => (i.ambiente || "geral") === ambienteAtivo);
  const itensFiltrados = itensPorAmbiente.filter(i =>
    i.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (i.categoria ?? "").toLowerCase().includes(busca.toLowerCase()) ||
    (i.fornecedor ?? "").toLowerCase().includes(busca.toLowerCase())
  );
  const valorTotal = itensPorAmbiente.reduce((acc, i) => acc + (i.custo_medio ?? 0) * i.quantidade, 0);
  const vencidos = itensPorAmbiente.filter(i => i.validade && new Date(i.validade) < new Date()).length;
  const baixo = itensPorAmbiente.filter(i => i.quantidade <= i.quantidade_minima);
  const alertasGlobal = itens.filter(i => i.quantidade <= i.quantidade_minima);

  return (
    <div>
      {/* Alertas globais */}
      {alertasGlobal.length > 0 && (
        <div className="mb-5 rounded-2xl px-5 py-4" style={{ background: "rgba(232,122,122,0.08)", border: "1px solid rgba(232,122,122,0.3)" }}>
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--danger)" }}>
            🚨 {alertasGlobal.length} {alertasGlobal.length === 1 ? "item abaixo" : "itens abaixo"} do estoque mínimo
          </p>
          <div className="flex flex-wrap gap-2">
            {alertasGlobal.map(i => {
              const amb = AMBIENTES.find(a => a.key === (i.ambiente || "geral"));
              return (
                <span key={i.id} className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(232,122,122,0.1)", color: "var(--danger)" }}>
                  {amb?.icon} {i.nome} ({i.quantidade}/{i.quantidade_minima} {i.unidade})
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Gestão</p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Estoque</h1>
        </div>
        <button onClick={() => { setEditando(null); setForm(f => ({ ...f, ambiente: ambienteAtivo })); setModalAberto(true); }}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{ background: "var(--gold)", color: "#0a0707" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          Novo Item
        </button>
      </div>

      {/* Seletor de ambientes */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {AMBIENTES.map(amb => (
          <button key={amb.key} onClick={() => setAmbienteAtivo(amb.key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm transition hover:scale-105"
            style={{
              background: ambienteAtivo === amb.key ? "var(--gold)" : "var(--bg-card)",
              color: ambienteAtivo === amb.key ? "#0a0707" : "var(--text-muted)",
              border: ambienteAtivo === amb.key ? "1px solid var(--gold)" : "1px solid var(--border-color)",
              fontWeight: ambienteAtivo === amb.key ? 600 : 400,
            }}>
            {amb.icon} {amb.label}
            {itens.filter(i => (i.ambiente || "geral") === amb.key && i.quantidade <= i.quantidade_minima).length > 0 && (
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--danger)" }} />
            )}
          </button>
        ))}
      </div>

      {baixo.length > 0 && (
        <div className="mb-5 rounded-2xl px-5 py-4" style={{ background: "rgba(232,201,122,0.08)", border: "1px solid rgba(232,201,122,0.25)" }}>
          <p className="text-sm font-semibold mb-2" style={{ color: "#e8c97a" }}>
            ⚠ Estoque baixo em {AMBIENTES.find(a => a.key === ambienteAtivo)?.label} ({baixo.length} {baixo.length === 1 ? "item" : "itens"})
          </p>
          <div className="flex flex-wrap gap-2">
            {baixo.map(i => (
              <span key={i.id} className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(232,201,122,0.1)", color: "#e8c97a" }}>
                {i.nome} ({i.quantidade} {i.unidade})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: "Total Itens",   valor: itensPorAmbiente.length, cor: "var(--gold)"    },
          { label: "Estoque Baixo", valor: baixo.length,             cor: "var(--warning)" },
          { label: "Vencidos",      valor: vencidos,                  cor: "var(--danger)"  },
          { label: "Valor Total",   valor: "R$ " + valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 0 }), cor: "var(--success)" },
        ].map(k => (
          <div key={k.label} className="rounded-2xl px-5 py-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <p className="text-xl font-bold" style={{ color: k.cor }}>{k.valor}</p>
            <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>{k.label}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-4">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" stroke="currentColor" strokeWidth={1.5} style={{ color: "var(--text-muted)" }}>
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
        </svg>
        <input type="text" placeholder="Buscar por nome, categoria ou fornecedor..." value={busca} onChange={e => setBusca(e.target.value)}
          className="w-full rounded-2xl pl-11 pr-5 py-3 text-sm outline-none"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        {[{ key: "itens", label: "Itens (" + itensPorAmbiente.length + ")" }, { key: "historico", label: "Histórico (" + historico.length + ")" }].map(a => (
          <button key={a.key} onClick={() => setAbaAtiva(a.key as any)}
            className="flex-1 py-2.5 rounded-xl text-xs uppercase tracking-widest font-medium transition"
            style={{ background: abaAtiva === a.key ? "var(--gold-bg)" : "transparent", color: abaAtiva === a.key ? "var(--gold)" : "var(--text-muted)" }}>
            {a.label}
          </button>
        ))}
      </div>

      {carregando ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : abaAtiva === "itens" ? (
        itensFiltrados.length === 0 ? (
          <div className="text-center py-20 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <p className="text-4xl mb-4">📦</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum item em {AMBIENTES.find(a => a.key === ambienteAtivo)?.label}</p>
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    {["Item","Categoria","Quantidade","Mínimo","Custo","Fornecedor","Validade","Ações"].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {itensFiltrados.map((item, i) => {
                    const critico = item.quantidade <= item.quantidade_minima;
                    return (
                      <tr key={item.id} style={{ borderBottom: i < itensFiltrados.length - 1 ? "1px solid var(--border-subtle)" : "none", background: critico ? "rgba(232,122,122,0.03)" : "transparent" }}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {critico && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--danger)" }} />}
                            <p className="text-sm font-semibold" style={{ color: critico ? "var(--danger)" : "var(--text-primary)" }}>{item.nome}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>{item.categoria ?? "—"}</td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold" style={{ color: critico ? "var(--danger)" : "#7ae8a0" }}>{item.quantidade} {item.unidade}</span>
                          {critico && <span className="ml-2 text-xs" style={{ color: "var(--danger)" }}>⚠ baixo</span>}
                        </td>
                        <td className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>{item.quantidade_minima} {item.unidade}</td>
                        <td className="px-5 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                          {item.custo_medio ? "R$ " + Number(item.custo_medio).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "—"}
                        </td>
                        <td className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>{item.fornecedor ?? "—"}</td>
                        <td className="px-5 py-4 text-sm" style={{ color: item.validade && new Date(item.validade) < new Date() ? "var(--danger)" : "var(--text-muted)" }}>
                          {item.validade ? new Date(item.validade).toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditando(item); setForm({ nome: item.nome, categoria: item.categoria ?? "", quantidade: String(item.quantidade), unidade: item.unidade, quantidade_minima: String(item.quantidade_minima), custo_medio: String(item.custo_medio ?? ""), fornecedor: item.fornecedor ?? "", validade: item.validade ?? "", ambiente: item.ambiente || "geral" }); setModalAberto(true); }}
                              className="px-3 py-1.5 rounded-xl text-xs transition hover:scale-105"
                              style={{ background: "var(--gold-bg)", color: "var(--gold)", border: "1px solid var(--border-color)" }}>
                              Editar
                            </button>
                            <button onClick={() => setModalMov({ item, tipo: "entrada" })}
                              className="px-3 py-1.5 rounded-xl text-xs transition hover:scale-105"
                              style={{ background: "rgba(122,232,160,0.1)", color: "#7ae8a0", border: "1px solid rgba(122,232,160,0.2)" }}>
                              + Entrada
                            </button>
                            <button onClick={() => setModalMov({ item, tipo: "saida" })}
                              className="px-3 py-1.5 rounded-xl text-xs transition hover:scale-105"
                              style={{ background: "rgba(232,122,122,0.1)", color: "#e87a7a", border: "1px solid rgba(232,122,122,0.2)" }}>
                              - Saída
                            </button>
                            <button onClick={() => setConfirmDelete(item)}
                              className="px-3 py-1.5 rounded-xl text-xs transition hover:scale-105"
                              style={{ background: "rgba(232,122,122,0.06)", color: "#e87a7a", border: "1px solid rgba(232,122,122,0.15)" }}>
                              Excluir
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
        )
      ) : (
        {(() => {
        const historicoFiltrado = ambienteAtivo === "geral"
          ? historico
          : historico.filter(m => (m.ambiente || "geral") === ambienteAtivo);
        return historicoFiltrado.length === 0 ? (
          <div className="text-center py-20 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <p className="text-4xl mb-4">📋</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhuma movimentação ainda</p>
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <h2 className="text-xs uppercase tracking-widest" style={{ color: "var(--gold)" }}>Histórico de Movimentações</h2>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {historicoFiltrado.map(mov => (
                <div key={mov.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: mov.tipo === "entrada" ? "rgba(122,232,160,0.1)" : "rgba(232,122,122,0.1)" }}>
                    <span className="text-sm font-bold" style={{ color: mov.tipo === "entrada" ? "#7ae8a0" : "#e87a7a" }}>
                      {mov.tipo === "entrada" ? "+" : "-"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{mov.estoque?.nome}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: mov.tipo === "entrada" ? "rgba(122,232,160,0.1)" : "rgba(232,122,122,0.1)", color: mov.tipo === "entrada" ? "#7ae8a0" : "#e87a7a" }}>
                        {mov.tipo === "entrada" ? "Entrada" : "Saída"}
                      </span>
                      {mov.ambiente && mov.ambiente !== "geral" && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
                          {AMBIENTES.find(a => a.key === mov.ambiente)?.icon} {AMBIENTES.find(a => a.key === mov.ambiente)?.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {mov.motivo ?? "Sem motivo"}
                      {mov.profissional_nome && " · Prof: " + mov.profissional_nome}
                      {(mov as any).paciente_nome && " · Paciente: " + (mov as any).paciente_nome}
                      {" · "}{mov.funcionarios?.nome ?? "Sistema"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: mov.tipo === "entrada" ? "#7ae8a0" : "#e87a7a" }}>
                      {mov.tipo === "entrada" ? "+" : "-"}{mov.quantidade} {mov.estoque?.unidade}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(mov.criado_em).toLocaleDateString("pt-BR")} {new Date(mov.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl p-8 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: "var(--gold)" }}>{editando ? "Editar Item" : "Novo Item"}</h2>
              <button onClick={() => setModalAberto(false)} style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Ambiente</label>
                <div className="flex gap-2 flex-wrap">
                  {AMBIENTES.map(amb => (
                    <button key={amb.key} onClick={() => setForm(f => ({ ...f, ambiente: amb.key }))}
                      className="px-3 py-1.5 rounded-xl text-xs transition"
                      style={{ background: form.ambiente === amb.key ? "var(--gold)" : "var(--bg-input)", color: form.ambiente === amb.key ? "#0a0707" : "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                      {amb.icon} {amb.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Nome", key: "nome", type: "text", col: 2 },
                  { label: "Categoria", key: "categoria", type: "text", col: 1 },
                  { label: "Unidade", key: "unidade", type: "text", col: 1 },
                  { label: "Quantidade inicial", key: "quantidade", type: "number", col: 1 },
                  { label: "Quantidade mínima", key: "quantidade_minima", type: "number", col: 1 },
                  { label: "Custo médio (R$)", key: "custo_medio", type: "number", col: 1 },
                  { label: "Fornecedor", key: "fornecedor", type: "text", col: 1 },
                  { label: "Validade", key: "validade", type: "date", col: 2 },
                ].map(field => (
                  <div key={field.key} className={field.col === 2 ? "col-span-2" : ""}>
                    <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>{field.label}</label>
                    <input type={field.type} value={(form as any)[field.key]}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)", colorScheme: "dark" }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)} className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={salvar} disabled={salvando || !form.nome} className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: form.nome ? "var(--gold)" : "var(--gold-bg)", color: "#0a0707" }}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMov && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-3xl p-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <h2 className="text-xl font-bold mb-2" style={{ color: modalMov.tipo === "entrada" ? "#7ae8a0" : "#e87a7a" }}>
              {modalMov.tipo === "entrada" ? "Entrada" : "Saída"} de Estoque
            </h2>
            <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>{modalMov.item.nome} — Atual: {modalMov.item.quantidade} {modalMov.item.unidade}</p>
            <p className="text-xs mb-5" style={{ color: "var(--gold)" }}>
              {AMBIENTES.find(a => a.key === (modalMov.item.ambiente || "geral"))?.icon} {AMBIENTES.find(a => a.key === (modalMov.item.ambiente || "geral"))?.label}
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Quantidade</label>
                <input type="number" value={qtdMov} onChange={e => setQtdMov(e.target.value)} placeholder="0"
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Motivo / Campo utilizado</label>
                <input type="text" value={motivoMov} onChange={e => setMotivoMov(e.target.value)} placeholder="Ex: Compra, uso em procedimento..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Profissional que utilizou</label>
                <input type="text" value={profissionalMov} onChange={e => setProfissionalMov(e.target.value)} placeholder="Nome do profissional..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Paciente (opcional)</label>
                <input type="text" value={pacienteMov} onChange={e => setPacienteMov(e.target.value)} placeholder="Nome do paciente..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalMov(null)} className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={movimentar} disabled={salvando || !qtdMov} className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: qtdMov ? "var(--gold)" : "var(--gold-bg)", color: "#0a0707" }}>
                {salvando ? "..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-3xl p-8" style={{ background: "var(--bg-card)", border: "1px solid rgba(232,122,122,0.3)" }}>
            <p className="text-xl font-bold mb-2" style={{ color: "var(--danger)" }}>Confirmar Exclusão</p>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              Tem certeza que deseja excluir <strong style={{ color: "var(--text-primary)" }}>{confirmDelete.nome}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={() => deletar(confirmDelete)} className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: "var(--danger)", color: "white" }}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`input::placeholder { color: var(--text-muted); }`}</style>
    </div>
  );
}