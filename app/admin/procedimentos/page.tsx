"use client";

import { useEffect, useState } from "react";

type Procedimento = {
  id: string;
  nome: string;
  cor: string;
  duracao_minutos: number;
  preco?: number;
  desconto_maximo?: number;
  ativo: boolean;
};

const CORES = ["#c8a078","#b08060","#a07050","#d0a080","#c09070","#a08070","#b09080","#8a6f5a","#d4b896","#7a9080","#7ae8a0","#7ab8e8","#e87a7a","#e8c97a","#c87ae8"];

export default function ProcedimentosPage() {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Procedimento | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ nome: "", cor: "#c8a078", duracao_minutos: 60, preco: "", desconto_maximo: "0" });

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
    setForm({ nome: "", cor: "#c8a078", duracao_minutos: 60, preco: "", desconto_maximo: "0" });
    setModalAberto(true);
  }

  function abrirEditar(p: Procedimento) {
    setEditando(p);
    setForm({ nome: p.nome, cor: p.cor, duracao_minutos: p.duracao_minutos, preco: p.preco?.toString() ?? "", desconto_maximo: p.desconto_maximo?.toString() ?? "0" });
    setModalAberto(true);
  }

  async function salvar() {
    setSalvando(true);
    const body = {
      ...form,
      preco: form.preco ? parseFloat(form.preco) : null,
      desconto_maximo: form.desconto_maximo ? parseFloat(form.desconto_maximo) : 0,
      duracao_minutos: Number(form.duracao_minutos)
    };
    if (editando) {
      await fetch(`/api/procedimentos/${editando.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/procedimentos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    setModalAberto(false);
    buscar();
    setSalvando(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>Gestao</p>
          <h1 className="text-3xl font-bold" style={{ color: "#e8d5c0" }}>Procedimentos</h1>
        </div>
        <button onClick={abrirNovo}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{ background: "#c8a078", color: "#0a0707" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          Novo Procedimento
        </button>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "#c8a078" }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {procedimentos.map(p => (
            <div key={p.id} className="rounded-3xl p-6 transition hover:scale-[1.02] duration-200 cursor-pointer"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}
              onClick={() => abrirEditar(p)}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: p.cor }} />
                <h3 className="text-sm font-semibold" style={{ color: "#e8d5c0" }}>{p.nome}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#3a2e28" }}>Duracao</p>
                  <p className="text-sm font-semibold" style={{ color: "#c8a078" }}>{p.duracao_minutos} min</p>
                </div>
                {p.preco && (
                  <div>
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#3a2e28" }}>Preco</p>
                    <p className="text-sm font-semibold" style={{ color: "#c8a078" }}>
                      R$ {p.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
                {p.desconto_maximo && p.desconto_maximo > 0 ? (
                  <div>
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#3a2e28" }}>Desc. maximo</p>
                    <p className="text-sm font-semibold" style={{ color: "#e8c97a" }}>
                      R$ {p.desconto_maximo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-3xl p-8 max-h-[90vh] overflow-y-auto" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: "#c8a078" }}>
                {editando ? "Editar Procedimento" : "Novo Procedimento"}
              </h2>
              <button onClick={() => setModalAberto(false)} style={{ color: "#6b5a4e" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Nome</label>
                <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Botox Full Face"
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Duracao (min)</label>
                  <input type="number" value={form.duracao_minutos} onChange={e => setForm(f => ({ ...f, duracao_minutos: parseInt(e.target.value) }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Preco (R$)</label>
                  <input type="number" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))}
                    placeholder="0,00"
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Desconto maximo permitido (R$)</label>
                <input type="number" value={form.desconto_maximo} onChange={e => setForm(f => ({ ...f, desconto_maximo: e.target.value }))}
                  placeholder="0,00"
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
                <p className="text-xs mt-1" style={{ color: "#3a2e28" }}>Limite de desconto que a recepcionista pode conceder</p>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-3" style={{ color: "#a89080" }}>Cor no calendario</label>
                <div className="flex gap-2 flex-wrap">
                  {CORES.map(cor => (
                    <button key={cor} onClick={() => setForm(f => ({ ...f, cor }))}
                      className="w-8 h-8 rounded-full transition hover:scale-110"
                      style={{ background: cor, border: form.cor === cor ? "3px solid white" : "2px solid transparent" }} />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-4 h-4 rounded-full" style={{ background: form.cor }} />
                  <span className="text-xs" style={{ color: "#6b5a4e" }}>Cor selecionada</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#6b5a4e" }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando || !form.nome}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: !form.nome ? "rgba(200,160,120,0.3)" : "#c8a078", color: "#0a0707" }}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`input::placeholder { color: #3a2e28; }`}</style>
    </div>
  );
}