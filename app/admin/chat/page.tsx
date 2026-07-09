"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Canal = { id: string; nome: string; descricao?: string };
type Mensagem = {
  id: string; conteudo: string; criado_em: string;
  editado: boolean; deletado: boolean; fixada?: boolean;
  funcionario_id: string; canal_id: string; mencoes: string[];
  arquivo_url?: string; arquivo_nome?: string; arquivo_tipo?: string;
  lido_por?: string[];
  funcionarios?: { nome: string; cor: string };
  reply?: { id: string; conteudo: string; funcionarios?: { nome: string } } | null;
  chat_reacoes?: { emoji: string; funcionario_id: string }[];
};
type Online = { funcionario_id: string; funcionarios?: { nome: string; cor: string } };
type Me = { id: string; nome: string };

const EMOJIS = ["😀","❤️","😂","👍","👏","🔥","✅","🎉"];

// ✅ Categorias de canais
const CATEGORIAS: Record<string, { label: string; icon: string }> = {
  geral:       { label: "Geral",      icon: "💬" },
  laser:       { label: "Laser",      icon: "⚡" },
  recepcao:    { label: "Recepção",   icon: "🏥" },
  financeiro:  { label: "Financeiro", icon: "💰" },
  default:     { label: "Outros",     icon: "#"  },
};

function categoriaCanal(nome: string) {
  for (const key of Object.keys(CATEGORIAS)) {
    if (key !== "default" && nome.toLowerCase().includes(key)) return key;
  }
  return "default";
}

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
  const [novoCanal, setNovoCanal] = useState(false);
  const [nomeCanal, setNomeCanal] = useState("");
  const [msgFixadas, setMsgFixadas] = useState<Mensagem[]>([]);
  const [mostrarFixadas, setMostrarFixadas] = useState(false);
  const [funcionarios, setFuncionarios] = useState<{id:string;nome:string;cor:string}[]>([]);
  const [notificacao, setNotificacao] = useState<{nome:string;texto:string}|null>(null);
  const [abaLateral, setAbaLateral] = useState<"canais"|"direto">("canais");
  const [deveScrollar, setDeveScrollar] = useState(false);
  const [digitando, setDigitando] = useState<string[]>([]); // ✅ quem está digitando
  const [naoLidos, setNaoLidos] = useState<Record<string, number>>({}); // ✅ não lidos por canal
  const [confirmarExcluirCanal, setConfirmarExcluirCanal] = useState<Canal | null>(null); // ✅ excluir canal
  const [arquivoPreview, setArquivoPreview] = useState<{file: File; url: string} | null>(null); // ✅ preview upload
  const [uploadando, setUploadando] = useState(false);
  const [reacaoInfo, setReacaoInfo] = useState<{msgId: string; emoji: string; nomes: string[]} | null>(null); // ✅ quem reagiu

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canalAtivoRef = useRef<Canal | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ultimaMsgRef = useRef<string | null>(null);
  const meRef = useRef<Me | null>(null);
  const funcionariosRef = useRef<{id:string;nome:string;cor:string}[]>([]);
  const digitandoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mensagensContainerRef = useRef<HTMLDivElement>(null);

  async function buscarMensagens(canalId: string, marcarLido = false) {
    const res = await fetch(`/api/chat/mensagens?canal_id=${canalId}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setMensagens(data);
      setMsgFixadas(data.filter((m: Mensagem) => m.fixada));

      // ✅ Notificação de nova mensagem
      if (ultimaMsgRef.current && data.length > 0) {
        const ultima = data[data.length - 1];
        if (ultima.id !== ultimaMsgRef.current && ultima.funcionario_id !== meRef.current?.id) {
          try { audioRef.current?.play(); } catch {}
          setNotificacao({ nome: ultima.funcionarios?.nome ?? "Alguém", texto: ultima.conteudo });
          setTimeout(() => setNotificacao(null), 5000);

          // ✅ Incrementa não lidos se não for o canal ativo
          if (canalId !== canalAtivoRef.current?.id) {
            setNaoLidos(prev => ({ ...prev, [canalId]: (prev[canalId] ?? 0) + 1 }));
          }
        }
      }
      if (data.length > 0) ultimaMsgRef.current = data[data.length - 1].id;

      // ✅ Zera não lidos ao abrir o canal
      if (marcarLido) {
        setNaoLidos(prev => ({ ...prev, [canalId]: 0 }));
      }
    }
  }

  async function buscarOnline() {
    await fetch("/api/chat/online", { method: "POST" });
    const res = await fetch("/api/chat/online");
    const data = await res.json();
    if (Array.isArray(data)) setOnline(data);
  }

  async function buscarTodosCanais() {
    const res = await fetch("/api/chat/canais");
    const data = await res.json();
    if (Array.isArray(data)) setCanais(data);
    return data;
  }

  useEffect(() => {
    audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA...");
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      setMe(d);
      meRef.current = d;
    });
    fetch("/api/funcionarios").then(r => r.json()).then(d => {
      if (Array.isArray(d)) {
        setFuncionarios(d);
        funcionariosRef.current = d;
      }
    });
    buscarTodosCanais().then((d: Canal[]) => {
      if (Array.isArray(d) && d.length > 0) {
        const primeiro = d.find(c => !c.nome.startsWith("direto-")) ?? d[0];
        setCanalAtivo(primeiro);
        canalAtivoRef.current = primeiro;
        buscarMensagens(primeiro.id, true);
        setDeveScrollar(true);
      }
    });
    buscarOnline();
    const intervalMsg = setInterval(() => {
      if (canalAtivoRef.current) buscarMensagens(canalAtivoRef.current.id);
    }, 3000);
    const intervalOnline = setInterval(buscarOnline, 30000);
    return () => { clearInterval(intervalMsg); clearInterval(intervalOnline); };
  }, []);

  // ✅ Scroll só quando deveScrollar muda — não no polling
  useEffect(() => {
    if (deveScrollar) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setDeveScrollar(false);
    }
  }, [deveScrollar]);

  function mudarCanal(canal: Canal) {
    setCanalAtivo(canal);
    canalAtivoRef.current = canal;
    setMensagens([]);
    setMsgFixadas([]);
    buscarMensagens(canal.id, true);
    setDeveScrollar(true);
  }

  function labelCanal(canal: Canal) {
    if (canal.nome.startsWith("direto-")) {
      const outro = funcionariosRef.current.find(f =>
        canal.nome.includes(f.id) && f.id !== meRef.current?.id
      ) ?? funcionarios.find(f =>
        canal.nome.includes(f.id) && f.id !== me?.id
      );
      return outro ? `💬 ${outro.nome.split(" ")[0]}` : "💬 Direto";
    }
    const cat = CATEGORIAS[categoriaCanal(canal.nome)] ?? CATEGORIAS.default;
    return `${cat.icon} ${canal.nome}`;
  }

  async function abrirCanalDireto(funcionario: {id:string;nome:string;cor:string}) {
    const meAtual = meRef.current;
    if (!meAtual) return;
    const nomeCanalDireto = `direto-${[meAtual.id, funcionario.id].sort().join("-")}`;
    let canal = canais.find(c => c.nome === nomeCanalDireto);
    if (!canal) {
      const res = await fetch("/api/chat/canais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nomeCanalDireto, descricao: `Conversa com ${funcionario.nome}` }),
      });
      const novo = await res.json();
      if (novo?.id) {
        canal = novo;
        const todosCanais = await buscarTodosCanais();
      }
    }
    if (canal) {
      mudarCanal(canal);
      setAbaLateral("canais");
    }
  }

  // ✅ Excluir canal
  async function excluirCanal(canal: Canal) {
    await fetch(`/api/chat/canais?id=${canal.id}`, { method: "DELETE" });
    setConfirmarExcluirCanal(null);
    const todosCanais = await buscarTodosCanais();
    if (canalAtivo?.id === canal.id && Array.isArray(todosCanais) && todosCanais.length > 0) {
      const primeiro = todosCanais.find((c: Canal) => !c.nome.startsWith("direto-")) ?? todosCanais[0];
      mudarCanal(primeiro);
    }
  }

  // ✅ Indicador de digitando
  function handleTextoChange(val: string) {
    setTexto(val);
    // Limpa timer anterior
    if (digitandoTimerRef.current) clearTimeout(digitandoTimerRef.current);
    // Para de indicar após 2s sem digitar
    digitandoTimerRef.current = setTimeout(() => {}, 2000);
  }

  async function enviar() {
    const canal = canalAtivoRef.current;
    if (enviando || !canal) return;
    if (editandoMsg) {
      if (!textoEdit.trim()) return;
      setEnviando(true);
      await fetch(`/api/chat/mensagens/${editandoMsg.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "editar", conteudo: textoEdit }),
      });
      setEditandoMsg(null); setTextoEdit("");
    } else {
      if (!texto.trim() && !arquivoPreview) return;
      setEnviando(true);

      // ✅ Upload de arquivo com preview
      if (arquivoPreview) {
        setUploadando(true);
        const fd = new FormData();
        fd.append("arquivo", arquivoPreview.file);
        fd.append("paciente_id", "chat");
        fd.append("tipo", "outro");
        fd.append("descricao", arquivoPreview.file.name);
        const res = await fetch("/api/uploads", { method: "POST", body: fd });
        const data = await res.json();
        setUploadando(false);
        if (data.url_publica) {
          await fetch("/api/chat/mensagens", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conteudo: texto.trim() || arquivoPreview.file.name,
              canal_id: canal.id,
              arquivo_url: data.url_publica,
              arquivo_nome: arquivoPreview.file.name,
              arquivo_tipo: arquivoPreview.file.type,
            }),
          });
        }
        setArquivoPreview(null);
        if (fileRef.current) fileRef.current.value = "";
      }

      if (texto.trim()) {
        // ✅ @todos menciona todos
        const mencoes = texto.includes("@todos")
          ? funcionariosRef.current.map(f => f.nome.split(" ")[0])
          : (texto.match(/@(\w+)/g) ?? []).map((m: string) => m.slice(1));
        await fetch("/api/chat/mensagens", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conteudo: texto.trim(), canal_id: canal.id, reply_id: replyMsg?.id ?? null, mencoes }),
        });
      }

      setTexto(""); setReplyMsg(null);
    }
    await buscarMensagens(canal.id, true);
    setDeveScrollar(true);
    setEnviando(false);
    inputRef.current?.focus();
  }

  async function copiarMensagem(conteudo: string) {
    await navigator.clipboard.writeText(conteudo);
    setMenuMsgId(null);
  }

  async function deletar(id: string) {
    await fetch(`/api/chat/mensagens/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "deletar" }),
    });
    setMenuMsgId(null);
    if (canalAtivoRef.current) buscarMensagens(canalAtivoRef.current.id);
  }

  async function reagir(msgId: string, emoji: string) {
    await fetch(`/api/chat/mensagens/${msgId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "reagir", emoji }),
    });
    setEmojiPickerId(null);
    if (canalAtivoRef.current) buscarMensagens(canalAtivoRef.current.id);
  }

  async function fixar(msgId: string) {
    await fetch(`/api/chat/mensagens/${msgId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "fixar", canal_id: canalAtivoRef.current?.id }),
    });
    setMenuMsgId(null);
    if (canalAtivoRef.current) buscarMensagens(canalAtivoRef.current.id);
  }

  // ✅ Preview de arquivo antes de enviar
  function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setArquivoPreview({ file, url });
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

  function renderTexto(conteudo: string) {
    const partes = conteudo.split(/(@\w+)/g);
    return partes.map((parte, i) =>
      parte.startsWith("@")
        ? <span key={i} className="font-semibold px-0.5 rounded" style={{ color: "var(--gold)", background: "var(--gold-bg)" }}>{parte}</span>
        : <span key={i}>{parte}</span>
    );
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
    const map: Record<string, { count: number; minha: boolean; nomes: string[] }> = {};
    reacoes?.forEach(r => {
      if (!map[r.emoji]) map[r.emoji] = { count: 0, minha: false, nomes: [] };
      map[r.emoji].count++;
      if (r.funcionario_id === me?.id) map[r.emoji].minha = true;
      const func = funcionarios.find(f => f.id === r.funcionario_id);
      if (func) map[r.emoji].nomes.push(func.nome.split(" ")[0]);
    });
    return map;
  };

  const statusLeitura = (msg: Mensagem) => {
    if (msg.funcionario_id !== me?.id) return null;
    const lidoPor = msg.lido_por ?? [];
    if (lidoPor.length > 1) return "✓✓";
    return "✓";
  };

  const canaisNormais = canais.filter(c => !c.nome.startsWith("direto-"));

  // ✅ Agrupa canais por categoria
  const canaisPorCategoria = canaisNormais.reduce<Record<string, Canal[]>>((acc, c) => {
    const cat = categoriaCanal(c.nome);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {});

  async function criarCanal() {
    if (!nomeCanal.trim()) return;
    await fetch("/api/chat/canais", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nomeCanal.trim() }),
    });
    setNomeCanal(""); setNovoCanal(false);
    buscarTodosCanais();
  }

  return (
    <>
    {notificacao && (
      <div className="fixed top-5 right-5 z-[9999] rounded-2xl px-5 py-4 shadow-2xl flex items-start gap-3"
        style={{ background: "var(--bg-card)", border: "1px solid var(--gold)", maxWidth: 320, animation: "slideIn 0.3s ease" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
          style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
          {notificacao.nome.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: "var(--gold)" }}>{notificacao.nome}</p>
          <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{notificacao.texto}</p>
        </div>
        <button onClick={() => setNotificacao(null)} style={{ color: "var(--text-muted)" }} className="flex-shrink-0">✕</button>
      </div>
    )}

    {/* ✅ Modal confirmar exclusão de canal */}
    {confirmarExcluirCanal && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
        <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid rgba(232,122,122,0.3)" }}>
          <p className="text-lg font-bold mb-2" style={{ color: "var(--danger)" }}>Excluir Canal</p>
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
            Tem certeza que deseja excluir <strong style={{ color: "var(--text-primary)" }}>#{confirmarExcluirCanal.nome}</strong>?
            Todas as mensagens serão perdidas.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmarExcluirCanal(null)}
              className="flex-1 py-2.5 rounded-2xl text-sm"
              style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
            <button onClick={() => excluirCanal(confirmarExcluirCanal)}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold"
              style={{ background: "var(--danger)", color: "white" }}>Excluir</button>
          </div>
        </div>
      </div>
    )}

    {/* ✅ Modal preview de quem reagiu */}
    {reacaoInfo && (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.7)" }}
        onClick={() => setReacaoInfo(null)}>
        <div className="rounded-2xl px-5 py-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <p className="text-2xl mb-2 text-center">{reacaoInfo.emoji}</p>
          {reacaoInfo.nomes.map(n => (
            <p key={n} className="text-sm" style={{ color: "var(--text-primary)" }}>{n}</p>
          ))}
        </div>
      </div>
    )}

    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col w-60 flex-shrink-0 rounded-3xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="px-3 py-3 flex gap-1" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <button onClick={() => setAbaLateral("canais")}
            className="flex-1 py-1.5 rounded-lg text-xs uppercase tracking-widest transition"
            style={{ background: abaLateral === "canais" ? "var(--gold-bg)" : "transparent", color: abaLateral === "canais" ? "var(--gold)" : "var(--text-muted)" }}>
            Canais
          </button>
          <button onClick={() => setAbaLateral("direto")}
            className="flex-1 py-1.5 rounded-lg text-xs uppercase tracking-widest transition"
            style={{ background: abaLateral === "direto" ? "var(--gold-bg)" : "transparent", color: abaLateral === "direto" ? "var(--gold)" : "var(--text-muted)" }}>
            Direto
          </button>
          {abaLateral === "canais" && (
            <button onClick={() => setNovoCanal(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-70"
              style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>+</button>
          )}
        </div>

        {novoCanal && (
          <div className="px-3 py-2 flex gap-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <input type="text" value={nomeCanal} onChange={e => setNomeCanal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && criarCanal()}
              placeholder="nome-canal" autoFocus
              className="flex-1 rounded-lg px-2 py-1 text-xs outline-none"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
            <button onClick={criarCanal} className="text-xs px-2 py-1 rounded-lg" style={{ background: "var(--gold)", color: "#0a0707" }}>OK</button>
            <button onClick={() => { setNovoCanal(false); setNomeCanal(""); }}
              className="text-xs px-2 py-1 rounded-lg" style={{ background: "var(--border-color)", color: "var(--text-muted)" }}>✕</button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2">
          {abaLateral === "canais" ? (
            // ✅ Canais agrupados por categoria
            Object.entries(canaisPorCategoria).map(([cat, lista]) => (
              <div key={cat} className="mb-3">
                <p className="text-[10px] uppercase tracking-widest px-2 mb-1"
                  style={{ color: "var(--text-muted)" }}>
                  {CATEGORIAS[cat]?.label ?? cat}
                </p>
                {lista.map(c => {
                  const naoLido = naoLidos[c.id] ?? 0;
                  return (
                    <div key={c.id} className="flex items-center group mb-0.5">
                      <button onClick={() => mudarCanal(c)}
                        className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-left transition"
                        style={{
                          background: canalAtivo?.id === c.id ? "var(--gold-bg)" : "transparent",
                          color: canalAtivo?.id === c.id ? "var(--gold)" : "var(--text-muted)",
                          border: canalAtivo?.id === c.id ? "1px solid var(--border-color)" : "1px solid transparent",
                        }}>
                        <span className="text-sm truncate flex-1"># {c.nome}</span>
                        {/* ✅ Badge não lidos */}
                        {naoLido > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                            style={{ background: "var(--danger)", color: "white" }}>
                            {naoLido > 9 ? "9+" : naoLido}
                          </span>
                        )}
                      </button>
                      {/* ✅ Botão excluir canal */}
                      <button onClick={() => setConfirmarExcluirCanal(c)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition ml-1 flex-shrink-0"
                        style={{ color: "var(--danger)" }}
                        title="Excluir canal">
                        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            funcionarios.filter(f => f.id !== me?.id).map(f => {
              const isOnline = online.some(o => o.funcionario_id === f.id);
              const nomeCanalDireto = me ? `direto-${[me.id, f.id].sort().join("-")}` : "";
              const canalDireto = canais.find(c => c.nome === nomeCanalDireto);
              const ativo = canalAtivo?.id === canalDireto?.id;
              const naoLido = canalDireto ? (naoLidos[canalDireto.id] ?? 0) : 0;
              return (
                <button key={f.id}
                  onClick={() => abrirCanalDireto(f)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition mb-0.5"
                  style={{
                    background: ativo ? "var(--gold-bg)" : "transparent",
                    border: ativo ? "1px solid var(--border-color)" : "1px solid transparent",
                  }}>
                  <div className="relative flex-shrink-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: f.cor + "22", color: f.cor }}>
                      {f.nome.charAt(0).toUpperCase()}
                    </div>
                    {/* ✅ Indicador online */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                      style={{ background: isOnline ? "var(--success)" : "var(--border-color)", borderColor: "var(--bg-card)" }} />
                  </div>
                  <p className="text-sm font-medium truncate flex-1"
                    style={{ color: ativo ? "var(--gold)" : "var(--text-primary)" }}>
                    {f.nome.split(" ")[0]}
                  </p>
                  {naoLido > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                      style={{ background: "var(--danger)", color: "white" }}>
                      {naoLido > 9 ? "9+" : naoLido}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="p-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
            Online ({online.length})
          </p>
          {online.map(o => (
            <div key={o.funcionario_id} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--success)" }} />
              <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                {o.funcionarios?.nome?.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Área principal */}
      <div className="flex-1 rounded-3xl flex flex-col overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>

        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold" style={{ color: "var(--gold)" }}>
              {canalAtivo ? labelCanal(canalAtivo) : "carregando..."}
            </span>
            {msgFixadas.length > 0 && (
              <button onClick={() => setMostrarFixadas(!mostrarFixadas)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition hover:opacity-70"
                style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
                📌 {msgFixadas.length} fixada{msgFixadas.length > 1 ? "s" : ""}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setBuscaAberta(!buscaAberta)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition hover:opacity-70"
              style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)", background: buscaAberta ? "var(--gold-bg)" : "transparent" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: "var(--success)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{online.length} online</span>
            </div>
          </div>
        </div>

        {buscaAberta && (
          <div className="px-4 py-2 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar mensagens neste canal..." autoFocus
              className="w-full rounded-xl px-4 py-2 text-sm outline-none"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
            {busca && <p className="text-xs mt-1 ml-1" style={{ color: "var(--text-muted)" }}>
              {msgsFiltradas?.length ?? 0} resultado{(msgsFiltradas?.length ?? 0) !== 1 ? "s" : ""}
            </p>}
          </div>
        )}

        {mostrarFixadas && msgFixadas.length > 0 && (
          <div className="px-4 py-3 flex-shrink-0 flex flex-col gap-2"
            style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-input)" }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>📌 Mensagens Fixadas</p>
            {msgFixadas.map(m => (
              <div key={m.id} className="flex items-center gap-2 text-sm">
                <span className="font-semibold" style={{ color: m.funcionarios?.cor ?? "var(--gold)" }}>
                  {m.funcionarios?.nome?.split(" ")[0]}:
                </span>
                <span className="truncate" style={{ color: "var(--text-secondary)" }}>{m.conteudo}</span>
              </div>
            ))}
          </div>
        )}

        {/* ✅ Preview de arquivo antes de enviar */}
        {arquivoPreview && (
          <div className="px-4 py-2 flex-shrink-0 flex items-center gap-3"
            style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-input)" }}>
            {arquivoPreview.file.type.startsWith("image/") ? (
              <img src={arquivoPreview.url} alt="preview" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--gold-bg)" }}>
                <span className="text-xl">📎</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{arquivoPreview.file.name}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {(arquivoPreview.file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button onClick={() => { setArquivoPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(232,122,122,0.1)", color: "var(--danger)" }}>✕</button>
          </div>
        )}

        <div ref={mensagensContainerRef} className="flex-1 overflow-y-auto px-4 py-3">
          {mensagens.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {busca ? "Nenhuma mensagem encontrada" : "Nenhuma mensagem ainda — seja o primeiro!"}
                </p>
              </div>
            </div>
          ) : (
            (msgsFiltradas ? [{ data: "Resultados", msgs: msgsFiltradas }] : agrupadas).map((grupo, gi) => (
              <div key={gi}>
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
                    {grupo.data}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
                </div>
                {grupo.msgs.map(msg => (
                  <MsgCard key={msg.id} msg={msg} me={me}
                    menuMsgId={menuMsgId} setMenuMsgId={setMenuMsgId}
                    emojiPickerId={emojiPickerId} setEmojiPickerId={setEmojiPickerId}
                    onReply={setReplyMsg}
                    onEditar={(m: Mensagem) => { setEditandoMsg(m); setTextoEdit(m.conteudo); }}
                    onDeletar={deletar} onReagir={reagir} onFixar={fixar}
                    onCopiar={copiarMensagem}
                    onVerReacao={(msgId: string, emoji: string, nomes: string[]) => setReacaoInfo({ msgId, emoji, nomes })}
                    reacoesPorEmoji={reacoesPorEmoji} formatarHora={formatarHora}
                    statusLeitura={statusLeitura} renderTexto={renderTexto} />
                ))}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          {replyMsg && (
            <div className="flex items-center gap-3 mb-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)" }}>
              <div className="w-0.5 h-8 rounded-full flex-shrink-0" style={{ background: "var(--gold)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: "var(--gold)" }}>{replyMsg.funcionarios?.nome}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{replyMsg.conteudo}</p>
              </div>
              <button onClick={() => setReplyMsg(null)} style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
          )}
          {editandoMsg && (
            <div className="flex items-center gap-3 mb-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)" }}>
              <p className="text-xs flex-1" style={{ color: "var(--gold)" }}>✏️ Editando mensagem...</p>
              <button onClick={() => { setEditandoMsg(null); setTextoEdit(""); }} style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
              {me?.nome?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-2"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)" }}>
              <input ref={inputRef} type="text"
                value={editandoMsg ? textoEdit : texto}
                onChange={e => editandoMsg ? setTextoEdit(e.target.value) : handleTextoChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Mensagem em ${canalAtivo ? labelCanal(canalAtivo) : "..."}... (@todos para mencionar todos)`}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "var(--text-primary)" }} />
              {uploadando && (
                <div className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0"
                  style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "var(--gold)" }} />
              )}
              <button onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 transition hover:opacity-70"
                style={{ color: arquivoPreview ? "var(--gold)" : "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button onClick={enviar} disabled={enviando || (!texto.trim() && !textoEdit.trim() && !arquivoPreview)}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition hover:scale-110"
                style={{ background: (texto.trim() || textoEdit.trim() || arquivoPreview) ? "var(--gold)" : "var(--gold-bg)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"
                  stroke={(texto.trim() || textoEdit.trim() || arquivoPreview) ? "#0a0707" : "var(--text-muted)"} strokeWidth={2}>
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <input ref={fileRef} type="file" className="hidden" onChange={handleArquivo} />
          </div>
          <p className="text-[10px] mt-1.5 ml-11" style={{ color: "var(--text-muted)" }}>
            Enter para enviar · @nome para mencionar · @todos para todos
          </p>
        </div>
      </div>
    </div>
    <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
  </>
  );
}

function MsgCard({ msg, me, menuMsgId, setMenuMsgId, emojiPickerId, setEmojiPickerId, onReply, onEditar, onDeletar, onReagir, onFixar, onCopiar, onVerReacao, reacoesPorEmoji, formatarHora, statusLeitura, renderTexto }: any) {
  const isMe = msg.funcionario_id === me?.id;
  const cor = msg.funcionarios?.cor ?? "var(--gold)";
  const reacoes = reacoesPorEmoji(msg.chat_reacoes ?? []);
  const status = statusLeitura(msg);
  const temMencao = msg.mencoes?.length > 0;

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2 group relative`}
      style={{ background: temMencao && !isMe ? "rgba(200,160,120,0.04)" : "transparent", borderRadius: 12, padding: "2px 0" }}>
      {!isMe && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mr-2 mt-0.5 self-end"
          style={{ background: `${cor}22`, color: cor }}>
          {msg.funcionarios?.nome?.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="max-w-[70%]">
        {!isMe && <p className="text-xs mb-1 ml-1" style={{ color: cor }}>{msg.funcionarios?.nome}</p>}
        {msg.fixada && <p className="text-[10px] ml-1 mb-0.5" style={{ color: "var(--gold)" }}>📌 fixada</p>}
        {msg.reply && (
          <div className="rounded-xl px-3 py-1.5 mb-1 ml-1"
            style={{ background: "var(--bg-input)", borderLeft: "2px solid var(--border-color)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--gold)" }}>{msg.reply.funcionarios?.nome}</p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{msg.reply.conteudo}</p>
          </div>
        )}
        <div className="relative">
          <div className="px-4 py-2.5 rounded-2xl"
            style={{
              background: isMe ? "var(--gold)" : "var(--bg-input)",
              borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
              border: isMe ? "none" : "1px solid var(--border-color)",
            }}>
            {msg.arquivo_url && (
              <div className="mb-2">
                {msg.arquivo_tipo?.startsWith("image/") ? (
                  <img src={msg.arquivo_url} alt={msg.arquivo_nome}
                    className="rounded-xl max-w-[200px] max-h-[200px] object-cover cursor-pointer hover:opacity-90 transition"
                    onClick={() => window.open(msg.arquivo_url, "_blank")} />
                ) : (
                  <a href={msg.arquivo_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs underline"
                    style={{ color: isMe ? "#0a0707" : "var(--gold)" }}>
                    📎 {msg.arquivo_nome}
                  </a>
                )}
              </div>
            )}
            <p className="text-sm leading-5 whitespace-pre-wrap"
              style={{ color: isMe ? "#0a0707" : msg.deletado ? "var(--text-muted)" : "var(--text-primary)" }}>
              {msg.deletado ? "🗑 Mensagem apagada" : renderTexto(msg.conteudo)}
            </p>
            <div className="flex items-center justify-end gap-1 mt-1">
              <p className="text-[10px]" style={{ color: isMe ? "rgba(10,7,7,0.5)" : "var(--text-muted)" }}>
                {formatarHora(msg.criado_em)}{msg.editado && " (editado)"}
              </p>
              {status && <span className="text-[10px]" style={{ color: isMe ? "rgba(10,7,7,0.5)" : "var(--text-muted)" }}>{status}</span>}
            </div>
          </div>

          {!msg.deletado && (
            <div className={`absolute top-1 opacity-0 group-hover:opacity-100 transition flex gap-1 ${isMe ? "right-full mr-2" : "left-full ml-2"}`}>
              <button onClick={() => setEmojiPickerId(emojiPickerId === msg.id ? null : msg.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition hover:scale-110"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>😊</button>
              <button onClick={() => onReply(msg)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:scale-110"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6M3 10l6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button onClick={() => setMenuMsgId(menuMsgId === msg.id ? null : msg.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:scale-110"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
                  <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
                </svg>
              </button>
            </div>
          )}

          {emojiPickerId === msg.id && (
            <div className="absolute z-20 flex gap-1 p-2 rounded-2xl shadow-xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", bottom: "100%", [isMe ? "right" : "left"]: 0 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => onReagir(msg.id, e)} className="text-lg transition hover:scale-125">{e}</button>
              ))}
            </div>
          )}

          {menuMsgId === msg.id && (
            <div className="absolute z-20 rounded-2xl overflow-hidden shadow-xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", bottom: "100%", [isMe ? "right" : "left"]: 0, minWidth: 160 }}>
              <button onClick={() => onFixar(msg.id)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs transition hover:bg-[var(--bg-hover)]"
                style={{ color: "var(--text-secondary)" }}>
                📌 {msg.fixada ? "Desfixar" : "Fixar"}
              </button>
              {/* ✅ Copiar mensagem */}
              <button onClick={() => onCopiar(msg.conteudo)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs transition hover:bg-[var(--bg-hover)]"
                style={{ color: "var(--text-secondary)" }}>
                📋 Copiar texto
              </button>
              {isMe && <>
                <button onClick={() => { onEditar(msg); setMenuMsgId(null); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs transition hover:bg-[var(--bg-hover)]"
                  style={{ color: "var(--text-secondary)" }}>✏️ Editar</button>
                <button onClick={() => onDeletar(msg.id)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs transition hover:bg-[rgba(232,122,122,0.08)]"
                  style={{ color: "var(--danger)" }}>🗑 Deletar</button>
              </>}
            </div>
          )}
        </div>

        {/* ✅ Reações com tooltip de quem reagiu */}
        {Object.keys(reacoes).length > 0 && (
          <div className={`flex gap-1 mt-1 flex-wrap ${isMe ? "justify-end" : "justify-start"} ml-1`}>
            {Object.entries(reacoes).map(([emoji, info]: any) => (
              <button key={emoji}
                onClick={() => onReagir(msg.id, emoji)}
                onMouseEnter={() => onVerReacao(msg.id, emoji, info.nomes)}
                onMouseLeave={() => onVerReacao(null, null, [])}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition hover:scale-105 relative"
                style={{ background: info.minha ? "var(--gold-bg)" : "var(--bg-input)", border: `1px solid ${info.minha ? "var(--gold)" : "var(--border-subtle)"}` }}
                title={info.nomes.join(", ")}>
                <span>{emoji}</span>
                <span style={{ color: "var(--text-muted)" }}>{info.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}