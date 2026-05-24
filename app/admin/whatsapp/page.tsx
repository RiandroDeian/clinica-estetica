"use client";

import { useEffect, useState } from "react";

type Log = {
  id: string;
  tipo: string;
  mensagem: string;
  status: string;
  criado_em: string;
  pacientes?: { nome: string; telefone: string };
};

const tipos = [
  { key: "confirmacao", label: "Confirmacao" },
  { key: "lembrete_dia", label: "Lembrete 1 dia antes" },
  { key: "lembrete_hora", label: "Lembrete 1 hora antes" },
  { key: "cancelamento", label: "Cancelamento" },
  { key: "pos_atendimento", label: "Pos-atendimento" },
];

export default function WhatsappPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [linkGerado, setLinkGerado] = useState<{ link: string; mensagem: string } | null>(null);
  const [form, setForm] = useState({
    paciente_id: "", agendamento_id: "", tipo: "confirmacao", mensagem_custom: ""
  });

  useEffect(() => {
    fetch("/api/whatsapp").then(r => r.json()).then(d => setLogs(d.logs ?? []));
    fetch("/api/pacientes").then(r => r.json()).then(d => setPacientes(Array.isArray(d) ? d : []));
    const p = new Date(); p.setDate(p.getDate() - 7);
    const f = new Date(); f.setDate(f.getDate() + 30);
    fetch(`/api/agendamentos?inicio=${p.toISOString()}&fim=${f.toISOString()}`)
      .then(r => r.json()).then(d => setAgendamentos(Array.isArray(d) ? d : []));
  }, []);

  async function enviar() {
    setEnviando(true);
    const res = await fetch("/api/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLinkGerado({ link: data.link, mensagem: data.mensagem });
    fetch("/api/whatsapp").then(r => r.json()).then(d => setLogs(d.logs ?? []));
    setEnviando(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>Comunicacao</p>
          <h1 className="text-3xl font-bold" style={{ color: "#e8d5c0" }}>WhatsApp</h1>
        </div>
        <button onClick={() => { setModalAberto(true); setLinkGerado(null); }}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{ background: "#25D366", color: "white" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
          Enviar Mensagem
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {tipos.map(t => (
          <div key={t.key} className="rounded-2xl p-4 text-center"
            style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
            <p className="text-xs mt-1" style={{ color: "#6b5a4e" }}>{t.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl overflow-hidden"
        style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(200,160,120,0.1)" }}>
          <h2 className="text-xs uppercase tracking-widest" style={{ color: "#c8a078" }}>Historico</h2>
        </div>
        {logs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhuma mensagem enviada ainda</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(200,160,120,0.06)" }}>
            {logs.map(log => {
              const tipo = tipos.find(t => t.key === log.tipo);
              return (
                <div key={log.id} className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: "#e8d5c0" }}>{log.pacientes?.nome}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(200,160,120,0.1)", color: "#c8a078" }}>
                      {tipo?.label}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: log.status === "enviado" ? "rgba(122,232,160,0.1)" : "rgba(232,122,122,0.1)", color: log.status === "enviado" ? "#7ae8a0" : "#e87a7a" }}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-xs leading-5" style={{ color: "#6b5a4e" }}>{log.mensagem}</p>
                  <p className="text-xs mt-1" style={{ color: "#3a2e28" }}>
                    {new Date(log.criado_em).toLocaleDateString("pt-BR")} as {new Date(log.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl p-8"
            style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: "#c8a078" }}>Enviar Mensagem</h2>
              <button onClick={() => setModalAberto(false)} style={{ color: "#6b5a4e" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            {linkGerado ? (
              <div>
                <div className="rounded-2xl p-4 mb-4"
                  style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)" }}>
                  <p className="text-sm font-semibold mb-2" style={{ color: "#25D366" }}>Mensagem gerada!</p>
                  <p className="text-xs leading-5" style={{ color: "#a89080" }}>{linkGerado.mensagem}</p>
                </div>
                <a href={linkGerado.link} target="_blank" rel="noopener noreferrer"
                  className="block w-full py-4 rounded-2xl text-center text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
                  style={{ background: "#25D366", color: "white" }}>
                  Abrir no WhatsApp
                </a>
                <button onClick={() => setLinkGerado(null)}
                  className="w-full mt-3 py-3 rounded-2xl text-sm uppercase tracking-widest"
                  style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#6b5a4e" }}>
                  Enviar outra
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Paciente</label>
                  <select value={form.paciente_id} onChange={e => setForm(f => ({ ...f, paciente_id: e.target.value }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: form.paciente_id ? "#e8d5c0" : "#3a2e28" }}>
                    <option value="">Selecionar paciente...</option>
                    {pacientes.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.nome} - {p.telefone}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-3" style={{ color: "#a89080" }}>Tipo</label>
                  <div className="flex flex-col gap-2">
                    {tipos.map(t => (
                      <button key={t.key} onClick={() => setForm(f => ({ ...f, tipo: t.key }))}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition"
                        style={{
                          background: form.tipo === t.key ? "rgba(200,160,120,0.12)" : "#0e0a0a",
                          color: form.tipo === t.key ? "#c8a078" : "#6b5a4e",
                          border: `1px solid ${form.tipo === t.key ? "rgba(200,160,120,0.3)" : "rgba(200,160,120,0.08)"}`
                        }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>
                    Mensagem personalizada (opcional)
                  </label>
                  <textarea value={form.mensagem_custom}
                    onChange={e => setForm(f => ({ ...f, mensagem_custom: e.target.value }))}
                    rows={3} placeholder="Deixe vazio para usar o template..."
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                    style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setModalAberto(false)}
                    className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest"
                    style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#6b5a4e" }}>
                    Cancelar
                  </button>
                  <button onClick={enviar} disabled={enviando || !form.paciente_id}
                    className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                    style={{ background: form.paciente_id ? "#25D366" : "rgba(37,211,102,0.3)", color: "white" }}>
                    {enviando ? "Gerando..." : "Gerar Link"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`select option { background: #120d0d; } textarea::placeholder { color: #3a2e28; }`}</style>
    </div>
  );
}