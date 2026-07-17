"use client";

import { useState, useRef, useEffect } from "react";
import { useNotificacoes, type Notificacao } from "@/hooks/useNotificacoes";

const tipoConfig: Record<string, { cor: string; bg: string; icone: string }> = {
  agendamento: { cor: "#c8a078", bg: "rgba(200,160,120,0.1)", icone: "C" },
  chat:        { cor: "#7ab8e8", bg: "rgba(122,184,232,0.1)", icone: "M" },
  faturamento: { cor: "#7ae8a0", bg: "rgba(122,232,160,0.1)", icone: "P" },
  estoque:     { cor: "#e8c97a", bg: "rgba(232,201,122,0.1)", icone: "E" },
  recepcao:    { cor: "#c87ae8", bg: "rgba(200,122,232,0.1)", icone: "R" },
};

function IconeTipo({ tipo }: { tipo: string }) {
  const cfg = tipoConfig[tipo] ?? tipoConfig.agendamento;
  if (tipo === "agendamento") return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke={cfg.cor} strokeWidth={1.5}>
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  );
  if (tipo === "chat") return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke={cfg.cor} strokeWidth={1.5}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  );
  if (tipo === "faturamento") return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke={cfg.cor} strokeWidth={1.5}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  );
  if (tipo === "estoque") return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke={cfg.cor} strokeWidth={1.5}>
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke={cfg.cor} strokeWidth={1.5}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    </svg>
  );
}

function tempoRelativo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

type FollowUp = {
  agendamento_id: string;
  paciente_id: string;
  paciente_nome: string;
  tipo: string;
  label: string;
  icone: string;
};

export default function Notificacoes() {
  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas, limpar } = useNotificacoes();
  const [aberto, setAberto] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  // ✅ Tarefas de contato pendentes (só para quem tem o alerta ligado)
  useEffect(() => {
    let vivo = true;
    async function carregar() {
      try {
        const res = await fetch("/api/follow-ups");
        if (!res.ok) return;
        const d = await res.json();
        if (vivo) setFollowUps(d.ativo ? (d.itens ?? []) : []);
      } catch { /* silencioso */ }
    }
    carregar();
    const t = setInterval(carregar, 5 * 60 * 1000); // reavalia a cada 5 min
    return () => { vivo = false; clearInterval(t); };
  }, []);

  const totalBadge = naoLidas + followUps.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setAberto(!aberto); if (aberto) marcarTodasLidas(); }}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition hover:opacity-80"
        style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#c8a078" }}>
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}>
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {totalBadge > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: "#e87a7a", color: "white" }}>
            {totalBadge > 9 ? "9+" : totalBadge}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-12 w-80 rounded-3xl overflow-hidden z-50 shadow-2xl"
          style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)" }}>
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(200,160,120,0.1)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#e8d5c0" }}>Notificacoes</p>
              {naoLidas > 0 && (
                <p className="text-xs" style={{ color: "#6b5a4e" }}>{naoLidas} nao lidas</p>
              )}
            </div>
            <div className="flex gap-2">
              {notificacoes.length > 0 && (
                <>
                  <button onClick={marcarTodasLidas} className="text-xs transition hover:opacity-70"
                    style={{ color: "#c8a078" }}>
                    Marcar lidas
                  </button>
                  <button onClick={limpar} className="text-xs transition hover:opacity-70"
                    style={{ color: "#6b5a4e" }}>
                    Limpar
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
            {/* ✅ Follow-ups pendentes (tarefas de contato) */}
            {followUps.length > 0 && (
              <div style={{ borderBottom: "1px solid rgba(200,160,120,0.12)" }}>
                <div className="px-4 py-2 flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#c8a078" }}>
                    Precisa mandar mensagem ({followUps.length})
                  </p>
                  <a href="/admin/pacientes" className="text-[10px] transition hover:opacity-70" style={{ color: "#c8a078" }}>
                    Ver na aba Pacientes
                  </a>
                </div>
                {followUps.slice(0, 5).map(f => (
                  <a key={`${f.agendamento_id}:${f.tipo}`} href="/admin/pacientes"
                    className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-[rgba(200,160,120,0.04)]"
                    style={{ borderTop: "1px solid rgba(200,160,120,0.05)" }}>
                    <span className="text-sm flex-shrink-0">{f.icone}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "#e8d5c0" }}>{f.paciente_nome}</p>
                      <p className="text-[11px]" style={{ color: "#6b5a4e" }}>{f.label}</p>
                    </div>
                  </a>
                ))}
                {followUps.length > 5 && (
                  <p className="px-4 py-2 text-[10px]" style={{ color: "#3a2e28" }}>
                    + {followUps.length - 5} outro(s) na aba Pacientes
                  </p>
                )}
              </div>
            )}

            {notificacoes.length === 0 && followUps.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-3">-</p>
                <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhuma notificacao</p>
                <p className="text-xs mt-1" style={{ color: "#3a2e28" }}>Elas aparecem aqui em tempo real</p>
              </div>
            ) : (
              notificacoes.map(n => {
                const cfg = tipoConfig[n.tipo] ?? tipoConfig.agendamento;
                return (
                  <div key={n.id}
                    onClick={() => marcarLida(n.id)}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition hover:bg-[rgba(200,160,120,0.04)]"
                    style={{ borderBottom: "1px solid rgba(200,160,120,0.05)", background: n.lida ? "transparent" : "rgba(200,160,120,0.03)" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: cfg.bg }}>
                      <IconeTipo tipo={n.tipo} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold" style={{ color: n.lida ? "#6b5a4e" : "#e8d5c0" }}>
                          {n.titulo}
                        </p>
                        <span className="text-[10px] flex-shrink-0" style={{ color: "#3a2e28" }}>
                          {tempoRelativo(n.criado_em)}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 leading-4" style={{ color: "#6b5a4e" }}>
                        {n.mensagem}
                      </p>
                    </div>
                    {!n.lida && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                        style={{ background: cfg.cor }} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="px-5 py-3 text-center" style={{ borderTop: "1px solid rgba(200,160,120,0.08)" }}>
            <p className="text-xs" style={{ color: "#3a2e28" }}>Notificacoes em tempo real via Supabase</p>
          </div>
        </div>
      )}
    </div>
  );
}