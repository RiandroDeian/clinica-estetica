"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Mensagem = {
  id: string;
  conteudo: string;
  criado_em: string;
  funcionario_id: string;
  funcionarios?: { nome: string; cor: string };
};

type Me = { id: string; nome: string; role: string };

export default function ChatPage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const buscarMensagens = useCallback(async () => {
    const res = await fetch("/api/chat/mensagens");
    const data = await res.json();
    if (Array.isArray(data)) setMensagens(data);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setMe(d));
    buscarMensagens();
    const interval = setInterval(buscarMensagens, 3000);
    return () => clearInterval(interval);
  }, [buscarMensagens]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function enviar() {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    const conteudo = texto.trim();
    setTexto("");
    await fetch("/api/chat/mensagens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conteudo }),
    });
    await buscarMensagens();
    setEnviando(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
  }

  function formatarHora(iso: string) {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function formatarData(iso: string) {
    const d = new Date(iso);
    const hoje = new Date();
    if (d.toDateString() === hoje.toDateString()) return "Hoje";
    const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1);
    if (d.toDateString() === ontem.toDateString()) return "Ontem";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  const agrupadas = mensagens.reduce<{ data: string; msgs: Mensagem[] }[]>((acc, msg) => {
    const data = formatarData(msg.criado_em);
    const ultimo = acc[acc.length - 1];
    if (ultimo && ultimo.data === data) { ultimo.msgs.push(msg); }
    else acc.push({ data, msgs: [msg] });
    return acc;
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>Interno</p>
        <h1 className="text-3xl font-bold" style={{ color: "#e8d5c0" }}>Chat da Equipe</h1>
      </div>

      <div className="flex-1 rounded-3xl flex flex-col overflow-hidden" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
        <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(200,160,120,0.08)" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: "#7ae8a0" }} />
          <span className="text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>Chat interno — equipe Moncie</span>
          <span className="ml-auto text-xs" style={{ color: "#3a2e28" }}>Atualiza a cada 3s</span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1">
          {mensagens.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhuma mensagem ainda</p>
                <p className="text-xs mt-1" style={{ color: "#3a2e28" }}>Seja o primeiro a enviar!</p>
              </div>
            </div>
          ) : (
            agrupadas.map((grupo, gi) => (
              <div key={gi}>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px" style={{ background: "rgba(200,160,120,0.08)" }} />
                  <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(200,160,120,0.06)", color: "#3a2e28" }}>{grupo.data}</span>
                  <div className="flex-1 h-px" style={{ background: "rgba(200,160,120,0.08)" }} />
                </div>
                {grupo.msgs.map((msg, mi) => {
                  const isMe = msg.funcionario_id === me?.id;
                  const anterior = mi > 0 ? grupo.msgs[mi - 1] : null;
                  const mesmoPessoa = anterior?.funcionario_id === msg.funcionario_id;
                  const cor = msg.funcionarios?.cor ?? "#c8a078";
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} ${mesmoPessoa ? "mt-0.5" : "mt-3"}`}>
                      {!isMe && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mr-2 mt-0.5"
                          style={{ background: mesmoPessoa ? "transparent" : `${cor}22`, color: cor, visibility: mesmoPessoa ? "hidden" : "visible" }}>
                          {msg.funcionarios?.nome?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="max-w-[70%]">
                        {!isMe && !mesmoPessoa && (
                          <p className="text-xs mb-1 ml-1" style={{ color: cor }}>{msg.funcionarios?.nome}</p>
                        )}
                        <div className="px-4 py-2.5 rounded-2xl"
                          style={{
                            background: isMe ? "#c8a078" : "#0e0a0a",
                            borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                            border: isMe ? "none" : "1px solid rgba(200,160,120,0.1)",
                          }}>
                          <p className="text-sm leading-5" style={{ color: isMe ? "#0a0707" : "#e8d5c0" }}>{msg.conteudo}</p>
                        </div>
                        <p className={`text-[10px] mt-1 ${isMe ? "text-right" : "text-left ml-1"}`} style={{ color: "#3a2e28" }}>
                          {formatarHora(msg.criado_em)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(200,160,120,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "rgba(200,160,120,0.12)", color: "#c8a078" }}>
              {me?.nome?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-2"
              style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)" }}>
              <input
                ref={inputRef}
                type="text"
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Mensagem para a equipe..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "#e8d5c0", caretColor: "#c8a078" }}
              />
              <button onClick={enviar} disabled={enviando || !texto.trim()}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition hover:scale-110"
                style={{ background: texto.trim() ? "#c8a078" : "rgba(200,160,120,0.2)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke={texto.trim() ? "#0a0707" : "#6b5a4e"} strokeWidth={2}>
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          <p className="text-[10px] mt-2 ml-11" style={{ color: "#2a1f1a" }}>Enter para enviar</p>
        </div>
      </div>
      <style>{`input::placeholder { color: #3a2e28; }`}</style>
    </div>
  );
}