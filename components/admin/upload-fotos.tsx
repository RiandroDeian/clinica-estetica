"use client";

import { useEffect, useState, useRef } from "react";

type Upload = {
  id: string;
  url: string;
  url_publica: string;
  tipo: string;
  descricao?: string;
  criado_em: string;
};

const tipos = [
  { key: "foto_antes", label: "Antes" },
  { key: "foto_depois", label: "Depois" },
  { key: "documento", label: "Documento" },
  { key: "outro", label: "Outro" },
];

export default function UploadFotos({ pacienteId }: { pacienteId: string }) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [tipo, setTipo] = useState("foto_antes");
  const [descricao, setDescricao] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [fotoAmpliada, setFotoAmpliada] = useState<Upload | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function buscar() {
    setCarregando(true);
    const res = await fetch(`/api/uploads?paciente_id=${pacienteId}`);
    const data = await res.json();
    setUploads(Array.isArray(data) ? data : []);
    setCarregando(false);
  }

  useEffect(() => { buscar(); }, [pacienteId]);

  function selecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setArquivo(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function enviar() {
    if (!arquivo) return;
    setEnviando(true);
    const fd = new FormData();
    fd.append("arquivo", arquivo);
    fd.append("paciente_id", pacienteId);
    fd.append("tipo", tipo);
    fd.append("descricao", descricao);

    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    if (res.ok) {
      setArquivo(null);
      setPreview(null);
      setDescricao("");
      if (inputRef.current) inputRef.current.value = "";
      buscar();
    }
    setEnviando(false);
  }

  async function deletar(id: string, url: string) {
    if (!confirm("Deletar este arquivo?")) return;
    await fetch(`/api/uploads?id=${id}&url=${encodeURIComponent(url)}`, { method: "DELETE" });
    buscar();
  }

  const fotos = uploads.filter(u => u.tipo === "foto_antes" || u.tipo === "foto_depois");
  const docs  = uploads.filter(u => u.tipo === "documento" || u.tipo === "outro");

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl p-5" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
        <h3 className="text-xs uppercase tracking-widest mb-4" style={{ color: "#c8a078" }}>Novo Upload</h3>

        <div className="flex gap-2 mb-4 flex-wrap">
          {tipos.map(t => (
            <button key={t.key} onClick={() => setTipo(t.key)}
              className="px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition"
              style={{ background: tipo === t.key ? "rgba(200,160,120,0.15)" : "#0e0a0a", color: tipo === t.key ? "#c8a078" : "#6b5a4e", border: `1px solid ${tipo === t.key ? "rgba(200,160,120,0.3)" : "rgba(200,160,120,0.1)"}` }}>
              {t.label}
            </button>
          ))}
        </div>

        {!preview ? (
          <div onClick={() => inputRef.current?.click()}
            className="rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition hover:opacity-80"
            style={{ border: "2px dashed rgba(200,160,120,0.2)", minHeight: 140, background: "#0e0a0a" }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth={1.5} style={{ color: "#6b5a4e" }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-sm" style={{ color: "#6b5a4e" }}>Clique para selecionar arquivo</p>
            <p className="text-xs" style={{ color: "#3a2e28" }}>JPG, PNG, PDF ate 10MB</p>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden mb-3" style={{ maxHeight: 200 }}>
            <img src={preview} alt="Preview" className="w-full object-cover" style={{ maxHeight: 200 }} />
            <button onClick={() => { setPreview(null); setArquivo(null); if (inputRef.current) inputRef.current.value = ""; }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.7)", color: "white" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}

        <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={selecionarArquivo} />

        <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
          placeholder="Descricao (opcional)..."
          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none mt-3"
          style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />

        <button onClick={enviar} disabled={enviando || !arquivo}
          className="w-full mt-3 py-3 rounded-xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
          style={{ background: arquivo ? "#c8a078" : "rgba(200,160,120,0.3)", color: "#0a0707" }}>
          {enviando ? "Enviando..." : "Enviar Arquivo"}
        </button>
      </div>

      {fotos.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-widest mb-3" style={{ color: "#c8a078" }}>Fotos Antes e Depois</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {fotos.map(foto => (
              <div key={foto.id} className="relative rounded-2xl overflow-hidden group"
                style={{ border: "1px solid rgba(200,160,120,0.1)", aspectRatio: "1" }}>
                <img src={foto.url_publica} alt={foto.descricao ?? foto.tipo}
                  className="w-full h-full object-cover cursor-pointer transition group-hover:scale-105 duration-300"
                  onClick={() => setFotoAmpliada(foto)} />
                <div className="absolute inset-0 flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100 transition"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}>
                  <button onClick={() => deletar(foto.id, foto.url)}
                    className="self-end w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(232,122,122,0.9)" }}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="white" strokeWidth={2}>
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: foto.tipo === "foto_antes" ? "rgba(232,201,122,0.9)" : "rgba(122,232,160,0.9)", color: "#0a0707" }}>
                      {foto.tipo === "foto_antes" ? "Antes" : "Depois"}
                    </span>
                    {foto.descricao && <p className="text-xs mt-1 text-white">{foto.descricao}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {docs.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-widest mb-3" style={{ color: "#c8a078" }}>Documentos</h3>
          <div className="flex flex-col gap-2">
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center gap-4 rounded-xl p-3"
                style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(200,160,120,0.1)" }}>
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5} style={{ color: "#c8a078" }}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#e8d5c0" }}>{doc.descricao || doc.tipo}</p>
                  <p className="text-xs" style={{ color: "#6b5a4e" }}>{new Date(doc.criado_em).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex gap-2">
                  <a href={doc.url_publica} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition hover:opacity-70"
                    style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#c8a078" }}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                  <button onClick={() => deletar(doc.id, doc.url)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition hover:opacity-70"
                    style={{ border: "1px solid rgba(232,122,122,0.2)", color: "#e87a7a" }}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {carregando && (
        <div className="flex items-center justify-center h-24">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "#c8a078" }} />
        </div>
      )}

      {!carregando && uploads.length === 0 && (
        <div className="text-center py-10 rounded-2xl" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
          <p className="text-3xl mb-3">🖼</p>
          <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhum arquivo ainda</p>
        </div>
      )}

      {fotoAmpliada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.95)" }}
          onClick={() => setFotoAmpliada(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img src={fotoAmpliada.url_publica} alt={fotoAmpliada.descricao ?? ""}
              className="w-full rounded-3xl object-contain" style={{ maxHeight: "80vh" }} />
            <div className="flex items-center justify-between mt-4 px-2">
              <div>
                <span className="text-xs px-3 py-1 rounded-full mr-2"
                  style={{ background: fotoAmpliada.tipo === "foto_antes" ? "rgba(232,201,122,0.2)" : "rgba(122,232,160,0.2)", color: fotoAmpliada.tipo === "foto_antes" ? "#e8c97a" : "#7ae8a0" }}>
                  {fotoAmpliada.tipo === "foto_antes" ? "Antes" : "Depois"}
                </span>
                {fotoAmpliada.descricao && <span className="text-sm" style={{ color: "#a89080" }}>{fotoAmpliada.descricao}</span>}
              </div>
              <button onClick={() => setFotoAmpliada(null)}
                className="px-4 py-2 rounded-xl text-sm transition hover:opacity-70"
                style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#c8a078" }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`input::placeholder { color: #3a2e28; }`}</style>
    </div>
  );
}