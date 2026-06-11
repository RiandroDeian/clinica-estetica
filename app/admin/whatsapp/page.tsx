"use client";

import { useEffect, useMemo, useState } from "react";

type Log = {
  id: string;
  tipo: string;
  mensagem: string;
  status: string;
  criado_em: string;
  pacientes?: { nome: string; telefone: string };
};

type Paciente = { id: string; nome: string; telefone: string };

const tipos = [
  { key: "confirmacao",     label: "Confirmação",     emoji: "✅", descricao: "Confirma presença do paciente",         cor: "#25D366" },
  { key: "lembrete_dia",    label: "1 dia antes",      emoji: "📅", descricao: "Lembrete automático do agendamento",    cor: "#c8a078" },
  { key: "lembrete_hora",   label: "1 hora antes",     emoji: "⏰", descricao: "Evita faltas no atendimento",           cor: "#7aa6e8" },
  { key: "cancelamento",    label: "Cancelamento",     emoji: "❌", descricao: "Aviso de cancelamento",                 cor: "#e87a7a" },
  { key: "pos_atendimento", label: "Pós-atendimento",  emoji: "🌸", descricao: "Fidelização e retorno",                 cor: "#b78ae8" },
  { key: "aniversario",     label: "Aniversário",      emoji: "🎂", descricao: "Mensagem de parabéns",                  cor: "#e8c97a" },
  { key: "promocao",        label: "Promoção",         emoji: "🎯", descricao: "Campanha promocional",                  cor: "#7ae8d4" },
  { key: "pesquisa",        label: "Pesquisa",         emoji: "⭐", descricao: "Pesquisa de satisfação",                cor: "#e8a07a" },
];

const templatesPadrao: Record<string, string> = {
  confirmacao:     "Olá {nome}! 🌸 Seu agendamento de *{proc}* está confirmado para *{data}* às *{hora}*. Qualquer dúvida, estamos aqui! — Moncié Esthetique",
  lembrete_dia:    "Olá {nome}! 💆 Lembrando que amanhã você tem *{proc}* às *{hora}*. Até amanhã! — Moncié Esthetique",
  lembrete_hora:   "Olá {nome}! ⏰ Seu atendimento começa em 1 hora, às *{hora}*. Estamos te esperando! — Moncié Esthetique",
  cancelamento:    "Olá {nome}, seu agendamento do dia *{data}* foi cancelado. Entre em contato para reagendar. — Moncié Esthetique",
  pos_atendimento: "Olá {nome}! 🌸 Esperamos que tenha amado o resultado do *{proc}*! Sua opinião é muito importante. Como foi sua experiência? — Moncié Esthetique",
  aniversario:     "Feliz Aniversário, {nome}! 🎂🎉 A equipe Moncié deseja um dia incrível! Como presente, você ganhou um desconto especial na sua próxima visita. 💝",
  promocao:        "Olá {nome}! 🎯 Temos uma novidade especial para você! [adicione os detalhes da promoção aqui] — Moncié Esthetique",
  pesquisa:        "Olá {nome}! ⭐ Como foi sua experiência conosco? Sua opinião nos ajuda a melhorar! Responda com uma nota de 1 a 5. — Moncié Esthetique",
};

export default function WhatsappPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [linkGerado, setLinkGerado] = useState<{ link: string; mensagem: string } | null>(null);
  const [busca, setBusca] = useState("");
  const [abaAtiva, setAbaAtiva] = useState<"mensagens"|"whatsappweb">("mensagens");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [form, setForm] = useState({ paciente_id: "", tipo: "confirmacao", mensagem_custom: "" });

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const [l, p] = await Promise.all([fetch("/api/whatsapp"), fetch("/api/pacientes")]);
    const ld = await l.json();
    const pd = await p.json();
    setLogs(ld.logs ?? []);
    setPacientes(Array.isArray(pd) ? pd : []);
  }

  async function excluirLog(id: string) {
    if (!confirm("Remover esta mensagem do histórico?")) return;
    setExcluindo(id);
    await fetch("/api/whatsapp", {
     method: "DELETE",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ id }),
    });
    setExcluindo(null);
    carregar();
  } 

  const pacienteSelecionado = useMemo(() => pacientes.find(p => p.id === form.paciente_id), [pacientes, form.paciente_id]);

  const templateAtual = useMemo(() => {
    if (form.mensagem_custom) return form.mensagem_custom;
    return templatesPadrao[form.tipo] ?? "";
  }, [form.tipo, form.mensagem_custom]);

  async function enviar() {
    setEnviando(true);
    const res = await fetch("/api/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLinkGerado({ link: data.link, mensagem: data.mensagem });
    carregar();
    setEnviando(false);
  }

  const logsFiltrados = logs.filter(log => {
    const nome = log.pacientes?.nome?.toLowerCase() ?? "";
    const matchBusca = nome.includes(busca.toLowerCase());
    const matchTipo = filtroTipo === "todos" || log.tipo === filtroTipo;
    return matchBusca && matchTipo;
  });

  // Estatísticas
  const enviados = logs.filter(l => l.status === "enviado").length;
  const hoje = logs.filter(l => new Date(l.criado_em).toDateString() === new Date().toDateString()).length;

  const inp = "w-full rounded-2xl px-4 py-3 text-sm outline-none";
  const inpStyle = { background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Comunicação</p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>WhatsApp</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Central de mensagens e comunicação com pacientes</p>
        </div>
        <button onClick={() => { setModalAberto(true); setLinkGerado(null); setForm({ paciente_id: "", tipo: "confirmacao", mensagem_custom: "" }); }}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{ background: "#25D366", color: "white" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          Nova Mensagem
        </button>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-6 p-1 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <button onClick={() => setAbaAtiva("mensagens")}
          className="flex-1 py-2.5 rounded-xl text-xs uppercase tracking-widest font-medium transition"
          style={{ background: abaAtiva === "mensagens" ? "#25D366" : "transparent", color: abaAtiva === "mensagens" ? "white" : "var(--text-muted)" }}>
          📋 Mensagens
        </button>
        <button onClick={() => setAbaAtiva("whatsappweb")}
          className="flex-1 py-2.5 rounded-xl text-xs uppercase tracking-widest font-medium transition"
          style={{ background: abaAtiva === "whatsappweb" ? "#25D366" : "transparent", color: abaAtiva === "whatsappweb" ? "white" : "var(--text-muted)" }}>
          💬 WhatsApp Web
        </button>
      </div>

      {abaAtiva === "whatsappweb" && (
        <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", height: "calc(100vh - 220px)" }}>
            <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(37,211,102,0.1)" }}>
              <svg viewBox="0 0 24 24" fill="#25D366" className="w-10 h-10"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.933 1.395 5.605L0 24l6.551-1.368A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.009-1.371l-.36-.214-3.732.979.997-3.645-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>WhatsApp Web</h3>
              <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>O WhatsApp Web nao pode ser incorporado diretamente por restricoes de seguranca do WhatsApp.</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Clique no botao abaixo para abrir em uma nova janela.</p>
            </div>
            <a href="https://web.whatsapp.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-semibold transition hover:scale-105"
              style={{ background: "#25D366", color: "white" }}>
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.933 1.395 5.605L0 24l6.551-1.368A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.009-1.371l-.36-.214-3.732.979.997-3.645-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
              Abrir WhatsApp Web
            </a>
            <div className="w-full max-w-md">
              <p className="text-xs uppercase tracking-widest mb-3 text-center" style={{ color: "var(--text-muted)" }}>Atalhos rapidos — Pacientes recentes</p>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {pacientes.slice(0, 10).map(p => (
                  <a key={p.id} href={"https://wa.me/55" + p.telefone.replace(/\D/g, "")} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl transition hover:scale-[1.01]"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "rgba(37,211,102,0.1)", color: "#25D366" }}>
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{p.nome}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{p.telefone}</p>
                    </div>
                    <svg viewBox="0 0 24 24" fill="#25D366" className="w-4 h-4 flex-shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.933 1.395 5.605L0 24l6.551-1.368A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.009-1.371l-.36-.214-3.732.979.997-3.645-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {abaAtiva === "mensagens" && <>
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total enviadas", valor: enviados,           cor: "#25D366" },
          { label: "Hoje",           valor: hoje,               cor: "var(--gold)" },
          { label: "Pacientes",      valor: pacientes.length,   cor: "var(--info)" },
          { label: "Tipos",          valor: tipos.length,       cor: "var(--warning)" },
        ].map(k => (
          <div key={k.label} className="rounded-2xl px-5 py-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <p className="text-xl font-bold" style={{ color: k.cor }}>{k.valor}</p>
            <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tipos de mensagem */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {tipos.map(tipo => (
          <div key={tipo.key} className="rounded-2xl p-4 cursor-pointer transition hover:scale-[1.02]"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
            onClick={() => { setForm(f => ({ ...f, tipo: tipo.key, mensagem_custom: "" })); setModalAberto(true); setLinkGerado(null); }}>
            <div className="text-2xl mb-2">{tipo.emoji}</div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{tipo.label}</p>
            <p className="text-xs mt-1 leading-4" style={{ color: "var(--text-muted)" }}>{tipo.descricao}</p>
          </div>
        ))}
      </div>

      {/* Histórico */}
      <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <h2 className="text-xs uppercase tracking-widest" style={{ color: "var(--gold)" }}>Histórico de mensagens</h2>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{logsFiltrados.length} mensagem{logsFiltrados.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
              className="rounded-xl px-3 py-2 text-xs outline-none"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
              <option value="todos">Todos os tipos</option>
              {tipos.map(t => <option key={t.key} value={t.key}>{t.emoji} {t.label}</option>)}
            </select>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar paciente..."
              className="rounded-xl px-4 py-2 text-sm outline-none w-52"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
          </div>
        </div>

        {logsFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhuma mensagem encontrada</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {logsFiltrados.map(log => {
              const tipo = tipos.find(t => t.key === log.tipo);
              return (
                <div key={log.id} className="px-6 py-4 transition hover:bg-[var(--bg-hover)]">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{log.pacientes?.nome ?? "—"}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
                          {tipo?.emoji} {tipo?.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: log.status === "enviado" ? "rgba(37,211,102,0.1)" : "rgba(232,122,122,0.1)", color: log.status === "enviado" ? "#25D366" : "var(--danger)" }}>
                          {log.status}
                        </span>
                      </div>
                      <p className="text-sm leading-6 truncate" style={{ color: "var(--text-secondary)" }}>{log.mensagem}</p>
                      {log.pacientes?.telefone && (
                        <a href={`https://wa.me/55${log.pacientes.telefone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs mt-1 inline-flex items-center gap-1 transition hover:opacity-70"
                          style={{ color: "#25D366" }}>
                          💬 Abrir conversa
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-right flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                      <p>{new Date(log.criado_em).toLocaleDateString("pt-BR")}</p>
                      <p>{new Date(log.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                      <button onClick={() => excluirLog(log.id)} disabled={excluindo === log.id}
                        className="p-1.5 rounded-lg transition hover:opacity-70 mt-1"
                        style={{ background: "rgba(232,122,122,0.1)" }}>
                        {excluindo === log.id
                          ? <div className="w-3 h-3 rounded-full border animate-spin" style={{ borderColor: "rgba(232,122,122,0.3)", borderTopColor: "var(--danger)" }} />
                          : <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="var(--danger)" strokeWidth={1.5}>
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      </> }

      {/* MODAL */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Nova Mensagem</h2>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Gere mensagens profissionais para seus pacientes</p>
              </div>
              <button onClick={() => setModalAberto(false)} style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>

            {linkGerado ? (
              <div>
                <div className="rounded-2xl p-5 mb-5" style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)" }}>
                  <p className="font-semibold mb-3" style={{ color: "#25D366" }}>✅ Mensagem pronta!</p>
                  <p className="text-sm leading-7 whitespace-pre-line" style={{ color: "var(--text-primary)" }}>{linkGerado.mensagem}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setLinkGerado(null); }}
                    className="flex-1 py-3 rounded-2xl text-sm transition hover:opacity-70"
                    style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                    Nova mensagem
                  </button>
                  <a href={linkGerado.link} target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-2xl text-center text-sm font-semibold transition hover:scale-105"
                    style={{ background: "#25D366", color: "white" }}>
                    💬 Abrir WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Paciente */}
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Paciente</label>
                  <select value={form.paciente_id} onChange={e => setForm(f => ({ ...f, paciente_id: e.target.value }))}
                    className={inp} style={{ ...inpStyle, color: form.paciente_id ? "var(--text-primary)" : "var(--text-muted)" }}>
                    <option value="">Selecionar paciente...</option>
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome} — {p.telefone}</option>)}
                  </select>
                  {pacienteSelecionado && (
                    <div className="mt-2 px-4 py-3 rounded-2xl flex items-center justify-between"
                      style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{pacienteSelecionado.nome}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{pacienteSelecionado.telefone}</p>
                      </div>
                      <a href={`https://wa.me/55${pacienteSelecionado.telefone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-xl transition hover:scale-105"
                        style={{ background: "rgba(37,211,102,0.12)", color: "#25D366" }}>
                        💬 Conversa
                      </a>
                    </div>
                  )}
                </div>

                {/* Tipo */}
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-3" style={{ color: "var(--text-secondary)" }}>Tipo da mensagem</label>
                  <div className="grid grid-cols-2 gap-2">
                    {tipos.map(t => (
                      <button key={t.key} onClick={() => setForm(f => ({ ...f, tipo: t.key, mensagem_custom: "" }))}
                        className="rounded-2xl p-3 text-left transition hover:scale-[1.02]"
                        style={{
                          background: form.tipo === t.key ? "rgba(37,211,102,0.08)" : "var(--bg-input)",
                          border: form.tipo === t.key ? "1px solid rgba(37,211,102,0.3)" : "1px solid var(--border-subtle)",
                        }}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span>{t.emoji}</span>
                          <p className="text-sm font-medium" style={{ color: form.tipo === t.key ? "#25D366" : "var(--text-primary)" }}>{t.label}</p>
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t.descricao}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview do template */}
                <div className="rounded-2xl p-4" style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--gold)" }}>Preview da mensagem</p>
                  <p className="text-sm leading-6 whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                    {templatesPadrao[form.tipo]?.replace("{nome}", pacienteSelecionado?.nome?.split(" ")[0] ?? "Paciente").replace("{proc}", "Procedimento").replace("{data}", "DD/MM").replace("{hora}", "HH:MM")}
                  </p>
                </div>

                {/* Mensagem personalizada */}
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>
                    Personalizar mensagem <span style={{ color: "var(--text-muted)" }}>(opcional)</span>
                  </label>
                  <textarea value={form.mensagem_custom}
                    onChange={e => setForm(f => ({ ...f, mensagem_custom: e.target.value }))}
                    rows={4} placeholder="Deixe vazio para usar o modelo automático..."
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                    style={inpStyle} />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setModalAberto(false)}
                    className="flex-1 py-3 rounded-2xl text-sm transition hover:opacity-70"
                    style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                    Cancelar
                  </button>
                  <button onClick={enviar} disabled={!form.paciente_id || enviando}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold transition hover:scale-105"
                    style={{ background: !form.paciente_id ? "rgba(37,211,102,0.3)" : "#25D366", color: "white" }}>
                    {enviando ? "Gerando..." : "Gerar mensagem"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`select option { background: var(--bg-card); } textarea::placeholder, input::placeholder { color: var(--text-muted); }`}</style>
    </div>
  );
}
