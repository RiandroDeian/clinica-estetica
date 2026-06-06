"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Resultado = {
  tipo: "paciente" | "agendamento" | "pacote";
  id: string;
  titulo: string;
  subtitulo: string;
  href: string;
};

export function BuscaGlobal() {
  const [aberta, setAberta] = useState(false);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [carregando, setCarregando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setAberta(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setAberta(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!busca.trim() || busca.length < 2) { setResultados([]); return; }
    const t = setTimeout(async () => {
      setCarregando(true);
      try {
        const [pacientesRes, pacotesRes] = await Promise.all([
          fetch(`/api/pacientes?busca=${encodeURIComponent(busca)}`),
          fetch("/api/pacotes"),
        ]);
        const pacientes = await pacientesRes.json();
        const pacotesData = await pacotesRes.json();

        const resPacientes: Resultado[] = (Array.isArray(pacientes) ? pacientes : [])
          .slice(0, 4)
          .map((p: any) => ({
            tipo: "paciente",
            id: p.id,
            titulo: p.nome,
            subtitulo: p.telefone ?? "Sem telefone",
            href: `/admin/pacientes`,
          }));

        const resPacotes: Resultado[] = (Array.isArray(pacotesData) ? pacotesData : [])
          .filter((p: any) => p.pacientes?.nome?.toLowerCase().includes(busca.toLowerCase()) || p.nome_pacote?.toLowerCase().includes(busca.toLowerCase()))
          .slice(0, 3)
          .map((p: any) => ({
            tipo: "pacote",
            id: p.id,
            titulo: p.nome_pacote,
            subtitulo: p.pacientes?.nome ?? "Sem paciente",
            href: `/admin/pacotes`,
          }));

        setResultados([...resPacientes, ...resPacotes]);
      } catch {}
      setCarregando(false);
    }, 300);
    return () => clearTimeout(t);
  }, [busca]);

  function navegar(href: string) {
    setAberta(false);
    setBusca("");
    setResultados([]);
    router.push(href);
  }

  const icones: Record<string, string> = {
    paciente:    "👤",
    agendamento: "📅",
    pacote:      "📦",
  };

  if (!aberta) return (
    <button onClick={() => { setAberta(true); setTimeout(() => inputRef.current?.focus(), 50); }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition hover:opacity-70"
      style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
      </svg>
      <span className="hidden sm:inline">Buscar...</span>
      <span className="text-xs px-1.5 py-0.5 rounded hidden sm:inline" style={{ background: "var(--border-color)" }}>⌘K</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && setAberta(false)}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>

        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: resultados.length > 0 ? "1px solid var(--border-subtle)" : "none" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 flex-shrink-0" stroke="currentColor" strokeWidth={1.5} style={{ color: "var(--text-muted)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input ref={inputRef} type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar paciente, pacote, procedimento..."
            className="flex-1 outline-none text-sm bg-transparent"
            style={{ color: "var(--text-primary)" }} />
          {carregando && <div className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} />}
          <button onClick={() => setAberta(false)} className="text-xs px-2 py-1 rounded flex-shrink-0"
            style={{ background: "var(--border-color)", color: "var(--text-muted)" }}>ESC</button>
        </div>

        {resultados.length > 0 && (
          <div className="max-h-80 overflow-y-auto">
            {resultados.map(r => (
              <button key={r.id} onClick={() => navegar(r.href)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left transition hover:bg-[var(--bg-hover)]"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <span className="text-lg flex-shrink-0">{icones[r.tipo]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{r.titulo}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{r.subtitulo}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
                  {r.tipo}
                </span>
              </button>
            ))}
          </div>
        )}

        {busca.length >= 2 && resultados.length === 0 && !carregando && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum resultado para "{busca}"</p>
          </div>
        )}

        <div className="px-5 py-2 flex items-center gap-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>↑↓ navegar</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>↵ selecionar</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>esc fechar</span>
        </div>
      </div>
    </div>
  );
}
