"use client";

import { useChatRealtime } from "@/hooks/chat/useChatRealtime";
import { useEffect, useRef, useState, useCallback } from "react";

type Canal = { id: string; nome: string; descricao?: string };
type Mensagem = {
  id: string;
  conteudo: string;
  criado_em: string;
  editado: boolean;
  deletado: boolean;
  funcionario_id: string;
  mencoes: string[];
  arquivo_url?: string;
  arquivo_nome?: string;
  arquivo_tipo?: string;
  funcionarios?: { nome: string; cor: string };
  reply?: { id: string; conteudo: string; funcionarios?: { nome: string } } | null;
  chat_reacoes?: { emoji: string; funcionario_id: string }[];
};
type Online = { funcionario_id: string; funcionarios?: { nome: string; cor: string } };
type Me = { id: string; nome: string };

const EMOJIS = ["👍","❤️","😂","😮","😢","🔥","✅","👏"];

export default function ChatPage() {
  const [canais, setCanais] = useState<Canal[]>([]);
  const [canalAtivo, setCanalAtivo] = useState<Canal | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [online, setOnline] = useState<Online[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [replyMsg, setReplyMsg] = useState<Mensagem | null>(null);
  const [editandoMsg, setEditandoMsg] = useState<Mensagem | null>(null);
  const [textoEdit, setTextoEdit] = useState("");
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null);
  const [emojiPickerId, setEmojiPickerId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [digitando, setDigitando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const buscarMensagens = useCallback(async () => {
    if (!canalAtivo) return;
    const res = await fetch(`/api/chat/mensagens?canal_id=${canalAtivo.id}`);
    const data = await res.json();
    if (Array.isArray(data)) setMensagens(data);
  }, [canalAtivo]);

  const buscarOnline = useCallback(async () => {
    await fetch("/api/chat/online", { method: "POST" });
    const res = await fetch("/api/chat/online");
    const data = await res.json();
    if (Array.isArray(data)) setOnline(data);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setMe(d));
    fetch("/api/chat/canais").then(r => r.json()).then(d => {
      if (Array.isArray(d) && d.length > 0) {
        setCanais(d);
        setCanalAtivo(d[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (!canalAtivo) return;
    buscarMensagens();
    const interval = setInterval(buscarMensagens, 3000);
    return () => clearInterval(interval);
  }, [buscarMensagens, canalAtivo]);

  useEffect(() => {
    buscarOnline();
    const interval = setInterval(buscarOnline, 30000);
    return () => clearInterval(interval);
  }, [buscarOnline]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function enviar() {
    if ((!texto.trim() && !editandoMsg) || enviando) return;
    setEnviando(true);

    if (editandoMsg) {
      await fetch(`/api/chat/mensagens/${editandoMsg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "editar", conteudo: textoEdit }),
      });
      setEditandoMsg(null);
      setTextoEdit("");
    } else {
      const mencoes = (texto.match(/@(\w+)/g) ?? []).map(m => m.slice(1));
      await fetch("/api/chat/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo: texto.trim(), canal_id: canalAtivo?.id, reply_id: replyMsg?.id ?? null, mencoes }),
      });
      setTexto("");
      setReplyMsg(null);
    }

    await buscarMensagens();
    setEnviando(false);
    inputRef.current?.focus();
  }

  async function deletar(id: string) {
    await fetch(`/api/chat/mensagens/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "deletar" }),
    });
    setMenuMsgId(null);
    buscarMensagens();
  }

  async function reagir(msgId: string, emoji: string) {
    await fetch(`/api/chat/mensagens/${msgId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "reagir", emoji }),
    });
    setEmojiPickerId(null);
    buscarMensagens();
  }

  async function fixar(msgId: string) {
    await fetch(`/api/chat/mensagens/${msgId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "fixar", canal_id: canalAtivo?.id }),
    });
    setMenuMsgId(null);
    buscarMensagens();
  }

  async function enviarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !canalAtivo) return;
    const fd = new FormData();
    fd.append("arquivo", file);
    fd.append("paciente_id", "chat");
    fd.append("tipo", "outro");
    fd.append("descricao", file.name);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url_publica) {
      await fetch("/api/chat/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo: file.name, canal_id: canalAtivo.id, arquivo_url: data.url_publica, arquivo_nome: file.name, arquivo_tipo: file.type }),
      });
      buscarMensagens();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
    setDigitando(true);
    setTimeout(() => setDigitando(false), 2000);
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
    if (ultimo && ultimo.data === data) ultimo.msgs.push(msg);
    else acc.push({ data, msgs: [msg] });
    return acc;
  }, []);

  const msgsFiltradas = busca
    ? mensagens.filter(m => m.conteudo?.toLowerCase().includes(busca.toLowerCase()))
    : null;

  const reacoesPorEmoji = (reacoes: Mensagem["chat_reacoes"]) => {
    const map: Record<string, { count: number; minha: boolean }> = {};
    reacoes?.forEach(r => {
      if (!map[r.emoji]) map[r.emoji] = { count: 0, minha: false };
      map[r.emoji].count++;
      if (r.funcionario_id === me?.id) map[r.emoji].minha = true;
    });
    return map;
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      <div className="hidden lg:flex flex-col w-56 flex-shrink-0 rounded-3xl overflow-hidden"
        style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
        <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(200,160,120,0.08)" }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: "#c8a078" }}>Canais</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {canais.map(c => (
            <button key={c.id} onClick={() => setCanalAtivo(c)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition mb-0.5"
              style={{ background: canalAtivo?.id === c.id ? "rgba(200,160,120,0.12)" : "transparent", color: canalAtivo?.id === c.id ? "#c8a078" : "#6b5a4e", border: canalAtivo?.id === c.id ? "1px solid rgba(200,160,120,0.2)" : "1px solid transparent" }}>
              <span className="text-sm">#</span>
              <span className="text-sm font-medium">{c.nome}</span>
            </button>
          ))}
        </div>
        <div className="p-3" style={{ borderTop: "1px solid rgba(200,160,120,0.08)" }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#3a2e28" }}>Online ({online.length})</p>
          {online.map(o => (
            <div key={o.funcionario_id} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#7ae8a0" }} />
              <span className="text-xs truncate" style={{ color: "#6b5a4e" }}>{o.funcionarios?.nome?.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 rounded-3xl flex flex-col overflow-hidden"
        style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(200,160,120,0.08)" }}>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold" style={{ color: "#c8a078" }}>#{canalAtivo?.nome ?? "geral"}</span>
            {canalAtivo?.descricao && <span className="text-xs hidden sm:block" style={{ color: "#3a2e28" }}>{canalAtivo.descricao}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setBuscaAberta(!buscaAberta)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition hover:opacity-70"
              style={{ border: "1px solid rgba(200,160,120,0.15)", color: "#6b5a4e" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: "#7ae8a0" }} />
              <span className="text-xs" style={{ color: "#6b5a4e" }}>{online.length} online</span>
            </div>
          </div>
        </div>

        {buscaAberta && (
          <div className="px-4 py-2 flex-shrink-0" style={{ borderBottom: "1px solid rgba(200,160,120,0.06)" }}>
            <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar mensagens..." autoFocus
              className="w-full rounded-xl px-4 py-2 text-sm outline-none"
              style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.2)", color: "#e8d5c0" }} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {(msgsFiltradas ?? agrupadas.flatMap(g => g.msgs)).length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-sm" style={{ color: "#6b5a4e" }}>{busca ? "Nenhuma mensagem encontrada" : "Nenhuma mensagem ainda"}</p>
              </div>
            </div>
          ) : (
            msgsFiltradas ? (
              msgsFiltradas.map(msg => <MsgCard key={msg.id} msg={msg} me={me} menuMsgId={menuMsgId} setMenuMsgId={setMenuMsgId} emojiPickerId={emojiPickerId} setEmojiPickerId={setEmojiPickerId} onReply={setReplyMsg} onEditar={(m:Mensagem) => { setEditandoMsg(m); setTextoEdit(m.conteudo); }} onDeletar={deletar} onReagir={reagir} onFixar={fixar} reacoesPorEmoji={reacoesPorEmoji} formatarHora={formatarHora} />)
            ) : (
              agrupadas.map((grupo, gi) => (
                <div key={gi}>
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px" style={{ background: "rgba(200,160,120,0.08)" }} />
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(200,160,120,0.06)", color: "#3a2e28" }}>{grupo.data}</span>
                    <div className="flex-1 h-px" style={{ background: "rgba(200,160,120,0.08)" }} />
                  </div>
                  {grupo.msgs.map(msg => <MsgCard key={msg.id} msg={msg} me={me} menuMsgId={menuMsgId} setMenuMsgId={setMenuMsgId} emojiPickerId={emojiPickerId} setEmojiPickerId={setEmojiPickerId} onReply={setReplyMsg} onEditar={(m:Mensagem) => { setEditandoMsg(m); setTextoEdit(m.conteudo); }} onDeletar={deletar} onReagir={reagir} onFixar={fixar} reacoesPorEmoji={reacoesPorEmoji} formatarHora={formatarHora} />)}
                </div>
              ))
            )
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: "1px solid rgba(200,160,120,0.08)" }}>
          {replyMsg && (
            <div className="flex items-center gap-3 mb-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(200,160,120,0.06)", border: "1px solid rgba(200,160,120,0.12)" }}>
              <div className="w-0.5 h-full rounded-full" style={{ background: "#c8a078" }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: "#c8a078" }}>{replyMsg.funcionarios?.nome}</p>
                <p className="text-xs truncate" style={{ color: "#6b5a4e" }}>{replyMsg.conteudo}</p>
              </div>
              <button onClick={() => setReplyMsg(null)} style={{ color: "#6b5a4e" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
          )}
          {editandoMsg && (
            <div className="flex items-center gap-3 mb-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(200,160,120,0.06)", border: "1px solid rgba(200,160,120,0.12)" }}>
              <p className="text-xs flex-1" style={{ color: "#c8a078" }}>Editando mensagem...</p>
              <button onClick={() => { setEditandoMsg(null); setTextoEdit(""); }} style={{ color: "#6b5a4e" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "rgba(200,160,120,0.12)", color: "#c8a078" }}>
              {me?.nome?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-2"
              style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)" }}>
              <input ref={inputRef} type="text"
                value={editandoMsg ? textoEdit : texto}
                onChange={e => editandoMsg ? setTextoEdit(e.target.value) : setTexto(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Mensagem em #${canalAtivo?.nome ?? "geral"}... Use @nome para mencionar`}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "#e8d5c0", caretColor: "#c8a078" }} />
              <button onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 transition hover:opacity-70" style={{ color: "#6b5a4e" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button onClick={enviar} disabled={enviando || (!texto.trim() && !editandoMsg)}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition hover:scale-110"
                style={{ background: (texto.trim() || editandoMsg) ? "#c8a078" : "rgba(200,160,120,0.2)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"
                  stroke={(texto.trim() || editandoMsg) ? "#0a0707" : "#6b5a4e"} strokeWidth={2}>
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <input ref={fileRef} type="file" className="hidden" onChange={enviarArquivo} />
          </div>
          <p className="text-[10px] mt-1.5 ml-11" style={{ color: "#2a1f1a" }}>Enter para enviar - @nome para mencionar</p>
        </div>
      </div>
    </div>
  );
}

function MsgCard({ msg, me, menuMsgId, setMenuMsgId, emojiPickerId, setEmojiPickerId, onReply, onEditar, onDeletar, onReagir, onFixar, reacoesPorEmoji, formatarHora }: any) {
  const isMe = msg.funcionario_id === me?.id;
  const cor = msg.funcionarios?.cor ?? "#c8a078";
  const reacoes = reacoesPorEmoji(msg.chat_reacoes ?? []);
  const EMOJIS = ["👍","❤️","😂","😮","😢","🔥","✅","👏"];

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2 group relative`}>
      {!isMe && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mr-2 mt-0.5 self-end"
          style={{ background: `${cor}22`, color: cor }}>
          {msg.funcionarios?.nome?.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="max-w-[70%]">
        {!isMe && <p className="text-xs mb-1 ml-1" style={{ color: cor }}>{msg.funcionarios?.nome}</p>}

        {msg.reply && (
          <div className="rounded-xl px-3 py-1.5 mb-1 ml-1"
            style={{ background: "rgba(200,160,120,0.06)", borderLeft: "2px solid rgba(200,160,120,0.3)" }}>
            <p className="text-xs font-semibold" style={{ color: "#c8a078" }}>{msg.reply.funcionarios?.nome}</p>
            <p className="text-xs truncate" style={{ color: "#6b5a4e" }}>{msg.reply.conteudo}</p>
          </div>
        )}

        <div className="relative">
          <div className="px-4 py-2.5 rounded-2xl"
            style={{ background: isMe ? "#c8a078" : "#0e0a0a", borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px", border: isMe ? "none" : "1px solid rgba(200,160,120,0.1)" }}>
            {msg.arquivo_url && (
              <div className="mb-2">
                {msg.arquivo_tipo?.startsWith("image/") ? (
                  <img src={msg.arquivo_url} alt={msg.arquivo_nome} className="rounded-xl max-w-[200px] max-h-[200px] object-cover" />
                ) : (
                  <a href={msg.arquivo_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs underline" style={{ color: isMe ? "#0a0707" : "#c8a078" }}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                    {msg.arquivo_nome}
                  </a>
                )}
              </div>
            )}
            <p className="text-sm leading-5 whitespace-pre-wrap" style={{ color: isMe ? "#0a0707" : msg.deletado ? "#3a2e28" : "#e8d5c0" }}>
              {msg.conteudo}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px]" style={{ color: isMe ? "rgba(10,7,7,0.5)" : "#3a2e28" }}>
                {formatarHora(msg.criado_em)}{msg.editado && " (editado)"}
              </p>
            </div>
          </div>

          <div className="absolute top-1 opacity-0 group-hover:opacity-100 transition flex gap-1"
            style={{ [isMe ? "left" : "right"]: "-100px" }}>
            <button onClick={() => setEmojiPickerId(emojiPickerId === msg.id ? null : msg.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition hover:scale-110"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)" }}>
              😊
            </button>
            <button onClick={() => onReply(msg)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:scale-110"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)", color: "#6b5a4e" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
                <path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 21l-3-3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button onClick={() => setMenuMsgId(menuMsgId === msg.id ? null : msg.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:scale-110"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)", color: "#6b5a4e" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
          </div>

          {emojiPickerId === msg.id && (
            <div className="absolute z-20 flex gap-1 p-2 rounded-2xl"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)", bottom: "100%", [isMe ? "right" : "left"]: 0 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => onReagir(msg.id, e)}
                  className="text-lg transition hover:scale-125">{e}</button>
              ))}
            </div>
          )}

          {menuMsgId === msg.id && (
            <div className="absolute z-20 rounded-2xl overflow-hidden"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)", bottom: "100%", [isMe ? "right" : "left"]: 0, minWidth: 140 }}>
              <button onClick={() => onFixar(msg.id)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs transition hover:bg-[rgba(200,160,120,0.08)]"
                style={{ color: "#a89080" }}>
                Fixar mensagem
              </button>
              {isMe && !msg.deletado && (
                <>
                  <button onClick={() => { onEditar(msg); setMenuMsgId(null); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs transition hover:bg-[rgba(200,160,120,0.08)]"
                    style={{ color: "#a89080" }}>
                    Editar
                  </button>
                  <button onClick={() => onDeletar(msg.id)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs transition hover:bg-[rgba(232,122,122,0.08)]"
                    style={{ color: "#e87a7a" }}>
                    Deletar
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {Object.keys(reacoes).length > 0 && (
          <div className={`flex gap-1 mt-1 flex-wrap ${isMe ? "justify-end" : "justify-start"} ml-1`}>
            {Object.entries(reacoes).map(([emoji, info]: any) => (
              <button key={emoji} onClick={() => onReagir(msg.id, emoji)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition hover:scale-105"
                style={{ background: info.minha ? "rgba(200,160,120,0.2)" : "rgba(200,160,120,0.08)", border: `1px solid ${info.minha ? "rgba(200,160,120,0.4)" : "rgba(200,160,120,0.1)"}` }}>
                <span>{emoji}</span>
                <span style={{ color: "#6b5a4e" }}>{info.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}