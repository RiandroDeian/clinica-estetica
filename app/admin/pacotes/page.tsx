"use client";

import { useEffect, useState } from "react";

type Paciente = { id: string; nome: string };
type Procedimento = { id: string; nome: string };

type Pacote = {
  id: string;
  nome_pacote: string;
  categoria: string;
  total_sessoes: number;
  sessoes_usadas: number;
  status: string;
  valor?: number;
  observacoes?: string;
  pacientes?: { nome: string };
  procedimentos?: { nome: string }[];
};

const categoriaCfg: Record<string, { color: string; bg: string }> = {
  Pacote:   { color: "#c8a078", bg: "rgba(200,160,120,0.1)" },
  Gratuito: { color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  Avulso:   { color: "#a89bcc", bg: "rgba(168,155,204,0.1)" },
};

const formInicial = {
  nome_pacote: "",
  paciente_id: "",
  procedimento_ids: [] as string[],
  categoria: "Pacote",
  total_sessoes: 10,
  valor: "",
  observacoes: "",
};

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
}

export default function PacotesPage() {
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Pacote | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(formInicial);

  async function carregarDados() {
    try {
      const [pacotesRes, pacientesRes, procedimentosRes] = await Promise.all([
        fetch("/api/pacotes"),
        fetch("/api/pacientes"),
        fetch("/api/procedimentos"),
      ]);
      const pacotesData = await pacotesRes.json();
      const pacientesData = await pacientesRes.json();
      const procedimentosJson = await procedimentosRes.json();
      setPacotes(Array.isArray(pacotesData) ? pacotesData : pacotesData.data ?? []);
      setPacientes(Array.isArray(pacientesData) ? pacientesData : pacientesData.data ?? []);
      setProcedimentos(Array.isArray(procedimentosJson) ? procedimentosJson : procedimentosJson.data ?? []);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => { carregarDados(); }, []);

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
      procedimento_ids: [],
      categoria: pacote.categoria,
      total_sessoes: pacote.total_sessoes,
      valor: String(pacote.valor ?? ""),
      observacoes: pacote.observacoes ?? "",
    });
    setModalAberto(true);
  }

  async function salvar() {
    if (!form.paciente_id && !editando) { alert("Selecione um paciente"); return; }
    if (form.procedimento_ids.length === 0 && !editando) { alert("Selecione ao menos um procedimento"); return; }
    setSalvando(true);

    const payload = {
      nome_pacote: form.nome_pacote,
      paciente_id: form.paciente_id || undefined,
      procedimento_ids: form.procedimento_ids.length > 0 ? form.procedimento_ids : undefined,
      total_sessoes: Number(form.total_sessoes),
      categoria: form.categoria,
      valor: form.valor ? Number(form.valor) : null,
      observacoes: form.observacoes || null,
    };

    const method = editando ? "PATCH" : "POST";
    const url = editando ? `/api/pacotes/${editando.id}` : "/api/pacotes";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) { alert(data.erro || "Erro ao salvar pacote"); }
    else { setModalAberto(false); setEditando(null); carregarDados(); }
    setSalvando(false);
  }

  const totalPacotes   = pacotes.filter(p => p.categoria === "Pacote").length;
  const totalGratuitos = pacotes.filter(p => p.categoria === "Gratuito").length;
  const totalAvulsos   = pacotes.filter(p => p.categoria === "Avulso").length;

  const inputStyle = {
    background: "#0e0a0a",
    border: "1px solid rgba(200,160,120,0.15)",
    color: "#e8d5c0",
  } as const;

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>Gestão</p>
          <h1 className="text-3xl font-bold" style={{ color: "#e8d5c0" }}>Pacotes e Procedimentos</h1>
        </div>
        <button onClick={abrirNovo}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{ background: "#c8a078", color: "#0a0707" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Novo Pacote
        </button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Pacotes",   valor: totalPacotes,   icon: "📦" },
          { label: "Gratuitos", valor: totalGratuitos, icon: "🎁" },
          { label: "Avulsos",   valor: totalAvulsos,   icon: "⚡" },
        ].map((c, i) => (
          <div key={i} className="rounded-3xl p-6" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
            <div className="text-2xl mb-3">{c.icon}</div>
            <p className="text-2xl font-bold mb-1" style={{ color: "#c8a078" }}>{c.valor}</p>
            <p className="text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Lista de pacotes */}
      <div className="grid gap-4">
        {pacotes.length === 0 ? (
          <div className="text-center py-20 rounded-3xl" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
            <p className="text-4xl mb-4">📦</p>
            <p className="text-lg font-semibold mb-2" style={{ color: "#c8a078" }}>Nenhum pacote cadastrado</p>
            <p className="text-sm" style={{ color: "#6b5a4e" }}>Clique em Novo Pacote para começar</p>
          </div>
        ) : pacotes.map(pacote => {
          const cc = categoriaCfg[pacote.categoria] ?? categoriaCfg.Pacote;
          const pct = pacote.total_sessoes > 0 ? Math.round((pacote.sessoes_usadas / pacote.total_sessoes) * 100) : 0;
          const procs = pacote.procedimentos ?? [];
          return (
            <div key={pacote.id} className="rounded-3xl p-6" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h2 className="font-bold text-lg" style={{ color: "#e8d5c0" }}>{pacote.nome_pacote}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: cc.color, background: cc.bg }}>
                      {pacote.categoria}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "#6b5a4e" }}>
                    Paciente: <span style={{ color: "#a89080" }}>{pacote.pacientes?.nome ?? "—"}</span>
                  </p>
                </div>
                {/* ✅ Botão editar */}
                <button onClick={() => abrirEdicao(pacote)}
                  className="p-2 rounded-xl transition hover:opacity-70 flex-shrink-0"
                  style={{ background: "rgba(200,160,120,0.1)" }} title="Editar pacote">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#c8a078" strokeWidth={1.5}>
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* ✅ Múltiplos procedimentos exibidos como tags */}
              {procs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {procs.map((proc, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(200,160,120,0.08)", color: "#a89080", border: "1px solid rgba(200,160,120,0.15)" }}>
                      {proc.nome}
                    </span>
                  ))}
                </div>
              )}

              {/* Progresso de sessões */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs" style={{ color: "#6b5a4e" }}>
                  <span>Sessões: {pacote.sessoes_usadas} / {pacote.total_sessoes}</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: "rgba(200,160,120,0.1)" }}>
                  <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: "#c8a078" }} />
                </div>
              </div>

              {pacote.valor !== undefined && pacote.valor > 0 && (
                <p className="text-sm mt-3" style={{ color: "#6b5a4e" }}>
                  Valor: <span style={{ color: "#c8a078", fontWeight: 600 }}>
                    R$ {Number(pacote.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal cadastro / edição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: "#c8a078" }}>
                {editando ? "Editar Pacote" : "Novo Pacote"}
              </h2>
              <button onClick={() => setModalAberto(false)} style={{ color: "#6b5a4e" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Nome do Pacote</label>
                <input value={form.nome_pacote} onChange={e => setForm(f => ({ ...f, nome_pacote: e.target.value }))}
                  placeholder="Ex: Pacote Feminino Completo"
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={inputStyle} />
              </div>

              {/* Paciente (só no cadastro) */}
              {!editando && (
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Paciente</label>
                  <select value={form.paciente_id} onChange={e => setForm(f => ({ ...f, paciente_id: e.target.value }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={inputStyle}>
                    <option value="">Selecionar paciente...</option>
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
              )}

              {/* Categoria */}
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Categoria</label>
                <div className="flex gap-2">
                  {(["Pacote", "Gratuito", "Avulso"] as const).map(cat => (
                    <button key={cat} type="button"
                      onClick={() => setForm(f => ({ ...f, categoria: cat }))}
                      className="flex-1 py-2.5 rounded-2xl text-sm font-medium transition"
                      style={{
                        background: form.categoria === cat ? "#c8a078" : "rgba(200,160,120,0.08)",
                        color: form.categoria === cat ? "#0a0707" : "#a89080",
                        border: "1px solid rgba(200,160,120,0.2)",
                      }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* ✅ Múltiplos procedimentos por checkboxes */}
              <div>
                <label className="text-xs uppercase tracking-widest block mb-3" style={{ color: "#a89080" }}>
                  Procedimentos / Áreas <span style={{ color: "#6b5a4e" }}>({form.procedimento_ids.length} selecionado{form.procedimento_ids.length !== 1 ? "s" : ""})</span>
                </label>
                {procedimentos.length === 0 ? (
                  <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhum procedimento cadastrado</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {procedimentos.map(proc => {
                      const sel = form.procedimento_ids.includes(proc.id);
                      return (
                        <button key={proc.id} type="button"
                          onClick={() => setForm(f => ({ ...f, procedimento_ids: toggleId(f.procedimento_ids, proc.id) }))}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition"
                          style={{
                            background: sel ? "rgba(200,160,120,0.15)" : "rgba(200,160,120,0.04)",
                            border: sel ? "1px solid rgba(200,160,120,0.5)" : "1px solid rgba(200,160,120,0.12)",
                            color: sel ? "#e8d5c0" : "#6b5a4e",
                          }}>
                          <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                            style={{ background: sel ? "#c8a078" : "transparent", border: sel ? "none" : "1px solid rgba(200,160,120,0.3)" }}>
                            {sel && (
                              <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="#0a0707" strokeWidth={3}>
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          {proc.nome}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sessões e Valor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Total de Sessões</label>
                  <input type="number" value={form.total_sessoes}
                    onChange={e => setForm(f => ({ ...f, total_sessoes: Number(e.target.value) }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>
                    Valor (R$) {form.categoria === "Gratuito" && <span style={{ color: "#7ae8a0" }}>— Gratuito</span>}
                  </label>
                  <input type="number" value={form.valor}
                    onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                    placeholder="0,00" disabled={form.categoria === "Gratuito"}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ ...inputStyle, opacity: form.categoria === "Gratuito" ? 0.4 : 1 }} />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  rows={2} placeholder="Observações do pacote..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inputStyle} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#6b5a4e" }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: salvando ? "rgba(200,160,120,0.3)" : "#c8a078", color: "#0a0707" }}>
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