"use client";

import { useEffect, useState } from "react";

type Funcionario = {
  id: string;
  nome: string;
  email: string;
  role: string;
  cargo: string;
  cor: string;
  ativo: boolean;
};

const cargos = [
  { key: "administrador", label: "Administrador" },
  { key: "recepcionista", label: "Recepcionista" },
  { key: "massagista", label: "Massagista" },
  { key: "laser", label: "Laser" },
  { key: "esteticista", label: "Esteticista" },
  { key: "financeiro", label: "Financeiro" },
];

const cores = ["#c8a078","#7ae8a0","#7ab8e8","#e87a7a","#e8c97a","#c87ae8","#e8a07a","#7ae8d8"];

export default function ConfiguracoesPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", role: "funcionario", cargo: "recepcionista", cor: "#c8a078" });

  async function buscar() {
    setCarregando(true);
    const res = await fetch("/api/funcionarios");
    const data = await res.json();
    setFuncionarios(Array.isArray(data) ? data : []);
    setCarregando(false);
  }

  useEffect(() => { buscar(); }, []);

  async function salvar() {
    setSalvando(true);
    const res = await fetch("/api/funcionarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSucesso(true);
      setModalAberto(false);
      setForm({ nome: "", email: "", senha: "", role: "funcionario", cargo: "recepcionista", cor: "#c8a078" });
      buscar();
      setTimeout(() => setSucesso(false), 3000);
    }
    setSalvando(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>Sistema</p>
          <h1 className="text-3xl font-bold" style={{ color: "#e8d5c0" }}>Configuracoes</h1>
        </div>
        <button onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{ background: "#c8a078", color: "#0a0707" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          Novo Funcionario
        </button>
      </div>

      {sucesso && (
        <div className="mb-4 rounded-2xl px-5 py-3 text-sm"
          style={{ background: "rgba(122,232,160,0.1)", border: "1px solid rgba(122,232,160,0.2)", color: "#7ae8a0" }}>
          Funcionario criado com sucesso!
        </div>
      )}

      <div className="rounded-3xl overflow-hidden" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(200,160,120,0.1)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#c8a078" }}>Equipe</h2>
        </div>
        {carregando ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "#c8a078" }} />
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(200,160,120,0.06)" }}>
            {funcionarios.map(f => (
              <div key={f.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: `${f.cor}22`, color: f.cor }}>
                  {f.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "#e8d5c0" }}>{f.nome}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6b5a4e" }}>{f.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: f.cor }} />
                  <span className="text-xs px-3 py-1 rounded-full"
                    style={{ background: "rgba(200,160,120,0.1)", color: "#c8a078" }}>
                    {cargos.find(c => c.key === f.cargo)?.label ?? f.cargo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-3xl p-8 max-h-[90vh] overflow-y-auto" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: "#c8a078" }}>Novo Funcionario</h2>
              <button onClick={() => setModalAberto(false)} style={{ color: "#6b5a4e" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { label: "Nome completo", key: "nome", type: "text" },
                { label: "Email", key: "email", type: "email" },
                { label: "Senha", key: "senha", type: "password" },
              ].map(campo => (
                <div key={campo.key}>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>{campo.label}</label>
                  <input type={campo.type} value={(form as any)[campo.key]}
                    onChange={e => setForm(f => ({ ...f, [campo.key]: e.target.value }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
                </div>
              ))}
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Cargo</label>
                <div className="grid grid-cols-2 gap-2">
                  {cargos.map(c => (
                    <button key={c.key} onClick={() => setForm(f => ({ ...f, cargo: c.key, role: c.key === "administrador" ? "admin" : "funcionario" }))}
                      className="py-2.5 rounded-xl text-xs uppercase tracking-widest transition"
                      style={{ background: form.cargo === c.key ? "rgba(200,160,120,0.15)" : "transparent", color: form.cargo === c.key ? "#c8a078" : "#6b5a4e", border: `1px solid ${form.cargo === c.key ? "rgba(200,160,120,0.3)" : "rgba(200,160,120,0.1)"}` }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-3" style={{ color: "#a89080" }}>Cor identificadora</label>
                <div className="flex gap-2 flex-wrap">
                  {cores.map(cor => (
                    <button key={cor} onClick={() => setForm(f => ({ ...f, cor }))}
                      className="w-8 h-8 rounded-full transition hover:scale-110"
                      style={{ background: cor, border: form.cor === cor ? "3px solid white" : "2px solid transparent" }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#6b5a4e" }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando || !form.nome || !form.email || !form.senha}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: "#c8a078", color: "#0a0707" }}>
                {salvando ? "Salvando..." : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`input::placeholder { color: #3a2e28; }`}</style>
    </div>
  );
}