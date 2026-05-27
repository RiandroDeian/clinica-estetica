"use client";

import { useEffect, useState, useCallback } from "react";

type Orcamento = {
  id: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  observacoes?: string;
  imagem_url?: string;
  criado_em: string;
  funcionarios?: { nome: string };
};

export default function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [imagemAmpliada, setImagemAmpliada] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [enviandoImg, setEnviandoImg] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", cpf: "", telefone: "", observacoes: "", imagem_url: "" });

  const buscar = useCallback(async () => {
    setCarregando(true);
    const res = await fetch("/api/orcamentos");
    const data = await res.json();
    setOrcamentos(Array.isArray(data) ? data : []);
    setCarregando(false);
  }, []);

  useEffect(() => { buscar(); }, [buscar]);

  async function handleImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEnviandoImg(true);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    const fd = new FormData();
    fd.append("arquivo", file);
    fd.append("paciente_id", "orcamentos");
    fd.append("tipo", "outro");
    fd.append("descricao", `Orcamento - ${form.nome || "Sem nome"}`);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url_publica) setForm(f => ({ ...f, imagem_url: data.url_publica }));
    setEnviandoImg(false);
  }

  async function salvar() {
    if (!form.nome) return;
    setSalvando(true);
    await fetch("/api/orcamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setModalAberto(false);
    setForm({ nome: "", cpf: "", telefone: "", observacoes: "", imagem_url: "" });
    setPreview(null);
    buscar();
    setSalvando(false);
  }

  async function deletar(id: string) {
    if (!confirm("Deletar este orcamento?")) return;
    await fetch(`/api/orcamentos/${id}`, { method: "DELETE" });
    buscar();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>Gestao</p>
          <h1 className="text-3xl font-bold" style={{ color: "#e8d5c0" }}>Orcamentos</h1>
        </div>
        <button onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{ background: "#c8a078", color: "#0a0707" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          Novo Orcamento
        </button>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "#c8a078" }} />
        </div>
      ) : orcamentos.length === 0 ? (
        <div className="text-center py-20 rounded-3xl" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
          <p className="text-4xl mb-4">📄</p>
          <p className="text-lg font-semibold mb-2" style={{ color: "#c8a078" }}>Nenhum orcamento ainda</p>
          <p className="text-sm" style={{ color: "#6b5a4e" }}>Cadastre orcamentos feitos em papel tirando uma foto</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orcamentos.map(orc => (
            <div key={orc.id} className="rounded-3xl overflow-hidden transition hover:scale-[1.01]"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
              {orc.imagem_url ? (
                <div className="relative cursor-pointer" onClick={() => setImagemAmpliada(orc.imagem_url!)}>
                  <img src={orc.imagem_url} alt={orc.nome} className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition"
                    style={{ background: "rgba(0,0,0,0.5)" }}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="white" strokeWidth={1.5}>
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-full h-48 flex items-center justify-center"
                  style={{ background: "#0e0a0a" }}>
                  <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12" stroke="currentColor" strokeWidth={1} style={{ color: "#3a2e28" }}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                  </svg>
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: "#e8d5c0" }}>{orc.nome}</h3>
                    <p className="text-xs mt-0.5" style={{ color: "#6b5a4e" }}>
                      {orc.telefone && `${orc.telefone} `}{orc.cpf && `- CPF: ${orc.cpf}`}
                    </p>
                  </div>
                  <button onClick={() => deletar(orc.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:scale-110 flex-shrink-0"
                    style={{ border: "1px solid rgba(232,122,122,0.2)", color: "#e87a7a" }}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
                  </button>
                </div>
                {orc.observacoes && <p className="text-xs leading-5 mb-3" style={{ color: "#a89080" }}>{orc.observacoes}</p>}
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: "#3a2e28" }}>
                    {new Date(orc.criado_em).toLocaleDateString("pt-BR")} - {orc.funcionarios?.nome ?? "Sistema"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl p-8 max-h-[90vh] overflow-y-auto" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: "#c8a078" }}>Novo Orcamento</h2>
              <button onClick={() => { setModalAberto(false); setPreview(null); }} style={{ color: "#6b5a4e" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Nome do paciente*</label>
                <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Nome completo" className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Telefone</label>
                  <input type="text" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                    placeholder="(61) 99999-9999" className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>CPF</label>
                  <input type="text" value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))}
                    placeholder="000.000.000-00" className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Observacoes</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  rows={3} placeholder="Procedimentos, valores, condicoes..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Foto do orcamento</label>
                {preview ? (
                  <div className="relative rounded-2xl overflow-hidden">
                    <img src={preview} alt="Preview" className="w-full max-h-48 object-cover" />
                    <button onClick={() => { setPreview(null); setForm(f => ({ ...f, imagem_url: "" })); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.7)", color: "white" }}>
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
                    </button>
                    {enviandoImg && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(200,160,120,0.3)", borderTopColor: "#c8a078" }} />
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition hover:opacity-80"
                    style={{ border: "2px dashed rgba(200,160,120,0.2)", minHeight: 120, background: "#0e0a0a" }}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth={1.5} style={{ color: "#6b5a4e" }}>
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
                    </svg>
                    <p className="text-sm" style={{ color: "#6b5a4e" }}>Tirar foto ou selecionar imagem</p>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImagem} />
                  </label>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setModalAberto(false); setPreview(null); }}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#6b5a4e" }}>Cancelar</button>
              <button onClick={salvar} disabled={salvando || !form.nome || enviandoImg}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: form.nome && !enviandoImg ? "#c8a078" : "rgba(200,160,120,0.3)", color: "#0a0707" }}>
                {salvando ? "Salvando..." : enviandoImg ? "Enviando foto..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {imagemAmpliada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.95)" }}
          onClick={() => setImagemAmpliada(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img src={imagemAmpliada} alt="Orcamento" className="w-full rounded-3xl object-contain" style={{ maxHeight: "85vh" }} />
            <button onClick={() => setImagemAmpliada(null)}
              className="absolute top-4 right-4 px-4 py-2 rounded-xl text-sm transition hover:opacity-70"
              style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#c8a078", background: "rgba(0,0,0,0.5)" }}>
              Fechar
            </button>
          </div>
        </div>
      )}
      <style>{`input::placeholder, textarea::placeholder { color: #3a2e28; }`}</style>
    </div>
  );
}