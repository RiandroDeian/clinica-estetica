"use client";

import { useEffect, useState } from "react";

type Avaliacao = {
  id: string;
  nota_atendimento: number;
  nota_profissional: number;
  nota_experiencia: number;
  nota_ambiente: number;
  comentario?: string;
  criado_em: string;
  pacientes?: { nome: string };
  funcionarios?: { nome: string };
};

type Resumo = {
  total: number;
  media_atendimento: number;
  media_profissional: number;
  media_experiencia: number;
  media_ambiente: number;
  media_geral: number;
};

function Estrelas({ nota }: { nota: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="w-4 h-4"
          fill={i < Math.round(nota) ? "#c8a078" : "none"}
          stroke="#c8a078" strokeWidth={1.5}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

export default function AvaliacoesPage() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [form, setForm] = useState({
    paciente_id: "", funcionario_id: "",
    nota_atendimento: 5, nota_profissional: 5,
    nota_experiencia: 5, nota_ambiente: 5, comentario: ""
  });

  async function carregar() {
    const res = await fetch("/api/avaliacoes");
    const d = await res.json();
    setAvaliacoes(d.avaliacoes ?? []);
    setResumo(d.resumo ?? null);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    fetch("/api/pacientes").then(r => r.json()).then(d => setPacientes(Array.isArray(d) ? d : []));
    fetch("/api/funcionarios").then(r => r.json()).then(d => setFuncionarios(Array.isArray(d) ? d : []));
  }, []);

  async function salvar() {
    setSalvando(true);
    await fetch("/api/avaliacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    await carregar();
    setModalAberto(false);
    setSalvando(false);
  }

  const campos = [
    { label: "Atendimento", key: "nota_atendimento" },
    { label: "Profissional", key: "nota_profissional" },
    { label: "Experiencia", key: "nota_experiencia" },
    { label: "Ambiente", key: "nota_ambiente" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>Satisfacao</p>
          <h1 className="text-3xl font-bold" style={{ color: "#e8d5c0" }}>Avaliacoes</h1>
        </div>
        <button onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{ background: "#c8a078", color: "#0a0707" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
          Nova Avaliacao
        </button>
      </div>

      {resumo && resumo.total > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="lg:col-span-1 rounded-3xl p-6 text-center"
            style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)" }}>
            <p className="text-4xl font-bold mb-2" style={{ color: "#c8a078" }}>
              {resumo.media_geral.toFixed(1)}
            </p>
            <Estrelas nota={resumo.media_geral} />
            <p className="text-xs mt-2 uppercase tracking-widest" style={{ color: "#6b5a4e" }}>Media geral</p>
            <p className="text-xs mt-1" style={{ color: "#3a2e28" }}>{resumo.total} avaliacoes</p>
          </div>
          {[
            { label: "Atendimento", val: resumo.media_atendimento },
            { label: "Profissional", val: resumo.media_profissional },
            { label: "Experiencia", val: resumo.media_experiencia },
            { label: "Ambiente", val: resumo.media_ambiente },
          ].map((m, i) => (
            <div key={i} className="rounded-3xl p-6 text-center"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
              <p className="text-2xl font-bold mb-2" style={{ color: "#c8a078" }}>{m.val.toFixed(1)}</p>
              <Estrelas nota={m.val} />
              <p className="text-xs mt-2 uppercase tracking-widest" style={{ color: "#6b5a4e" }}>{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {carregando ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "#c8a078" }} />
        </div>
      ) : avaliacoes.length === 0 ? (
        <div className="text-center py-20 rounded-3xl"
          style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
          <p className="text-4xl mb-4">*</p>
          <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhuma avaliacao ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {avaliacoes.map(av => {
            const media = (av.nota_atendimento + av.nota_profissional + av.nota_experiencia + av.nota_ambiente) / 4;
            return (
              <div key={av.id} className="rounded-3xl p-6"
                style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#e8d5c0" }}>{av.pacientes?.nome}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6b5a4e" }}>
                      {av.funcionarios?.nome && `Prof: ${av.funcionarios.nome} - `}
                      {new Date(av.criado_em).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold" style={{ color: "#c8a078" }}>{media.toFixed(1)}</p>
                    <Estrelas nota={media} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { label: "Atendimento", nota: av.nota_atendimento },
                    { label: "Profissional", nota: av.nota_profissional },
                    { label: "Experiencia", nota: av.nota_experiencia },
                    { label: "Ambiente", nota: av.nota_ambiente },
                  ].map((n, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl"
                      style={{ background: "#0e0a0a" }}>
                      <span className="text-xs" style={{ color: "#6b5a4e" }}>{n.label}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <div key={j} className="w-1.5 h-1.5 rounded-full"
                            style={{ background: j < n.nota ? "#c8a078" : "rgba(200,160,120,0.2)" }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {av.comentario && (
                  <p className="text-sm leading-6 italic" style={{ color: "#a89080" }}>
                    "{av.comentario}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
            style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: "#c8a078" }}>Nova Avaliacao</h2>
              <button onClick={() => setModalAberto(false)} style={{ color: "#6b5a4e" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Paciente</label>
                <select value={form.paciente_id} onChange={e => setForm(f => ({ ...f, paciente_id: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: form.paciente_id ? "#e8d5c0" : "#3a2e28" }}>
                  <option value="">Selecionar paciente...</option>
                  {pacientes.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Profissional</label>
                <select value={form.funcionario_id} onChange={e => setForm(f => ({ ...f, funcionario_id: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: form.funcionario_id ? "#e8d5c0" : "#3a2e28" }}>
                  <option value="">Selecionar profissional...</option>
                  {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              {campos.map(campo => (
                <div key={campo.key}>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>
                    {campo.label}
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setForm(f => ({ ...f, [campo.key]: n }))}
                        className="flex-1 py-2 rounded-xl text-sm font-bold transition hover:scale-110"
                        style={{
                          background: (form as any)[campo.key] >= n ? "rgba(200,160,120,0.2)" : "#0e0a0a",
                          color: (form as any)[campo.key] >= n ? "#c8a078" : "#3a2e28",
                          border: "1px solid rgba(200,160,120,0.15)"
                        }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Comentario</label>
                <textarea value={form.comentario} onChange={e => setForm(f => ({ ...f, comentario: e.target.value }))}
                  rows={3} placeholder="Comentario opcional..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#6b5a4e" }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando || !form.paciente_id}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: form.paciente_id ? "#c8a078" : "rgba(200,160,120,0.3)", color: "#0a0707" }}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`select option { background: #120d0d; } textarea::placeholder { color: #3a2e28; }`}</style>
    </div>
  );
}