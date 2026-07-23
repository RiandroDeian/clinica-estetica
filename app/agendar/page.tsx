"use client";

import { useState, useEffect } from "react";

type Procedimento = { id: string; nome: string; duracao_minutos: number; preco?: number };

const HORARIOS = ["09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00","18:00"];

// Horário já passou (só relevante para agendamentos no dia de hoje)
function horarioPassou(data: string, h: string) {
  const agora = new Date();
  if (new Date(data + "T00:00:00").toDateString() !== agora.toDateString()) return false;
  const [hh, mm] = h.split(":").map(Number);
  const slot = new Date(); slot.setHours(hh, mm, 0, 0);
  return slot <= agora;
}

function formatarTelefone(v: string) {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 7) return `(${n.slice(0,2)}) ${n.slice(2)}`;
  return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
}

function formatarData(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

export default function AgendarPage() {
  const [etapa, setEtapa] = useState<"form"|"sucesso">("form");
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({ nome: "", telefone: "", procedimento: "", data: "", horario: "" });

  const hoje = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetch("/api/site/procedimentos")
      .then(r => r.json())
      .then(d => setProcedimentos(Array.isArray(d) ? d : []));
  }, []);

  async function buscarHorarios(data: string) {
    if (!data) return;
    const inicio = new Date(data + "T00:00:00").toISOString();
    const fim = new Date(data + "T23:59:59").toISOString();
    const res = await fetch(`/api/agendamentos?inicio=${inicio}&fim=${fim}`);
    const ags = await res.json();
    if (Array.isArray(ags)) {
      const ocupados = ags
        .filter((a: any) => a.status !== "cancelado")
        .map((a: any) => new Date(a.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      setHorariosOcupados(ocupados);
    }
  }

  function isDomingo(data: string) {
    return new Date(data + "T12:00:00").getDay() === 0;
  }

  async function confirmar() {
    setErro("");
    const { nome, telefone, procedimento, data, horario } = form;
    if (!nome || !telefone || !procedimento || !data || !horario) {
      setErro("Preencha todos os campos.");
      return;
    }
    if (isDomingo(data)) { setErro("Não atendemos aos domingos."); return; }

    setLoading(true);
    try {
      const [horaH, horaM] = horario.split(":");
      const inicio = new Date(data + "T" + horario + ":00");
      const proc = procedimentos.find(p => p.nome === procedimento);
      const fim = new Date(inicio.getTime() + (proc?.duracao_minutos ?? 60) * 60000);

      const res = await fetch("/api/agendamentos/rapido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_temporario: nome,
          telefone_temporario: telefone,
          procedimento_nome: procedimento,
          inicio: inicio.toISOString(),
          fim: fim.toISOString(),
          sem_cadastro: true,
          status: "pendente",
        }),
      });

      if (!res.ok) { setErro("Erro ao agendar. Tente novamente."); setLoading(false); return; }
      setEtapa("sucesso");
    } catch {
      setErro("Erro ao agendar. Tente novamente.");
    }
    setLoading(false);
  }

  if (etapa === "sucesso") {
    const proc = procedimentos.find(p => p.nome === form.procedimento);
    const msg = encodeURIComponent(
      `Olá, Moncié! 🌸 Gostaria de confirmar meu agendamento:\n\n` +
      `👤 Nome: ${form.nome}\n` +
      `💆 Procedimento: ${form.procedimento}\n` +
      `📅 Data: ${formatarData(form.data)}\n` +
      `⏰ Horário: ${form.horario}\n\n` +
      `Aguardo confirmação! 😊`
    );

    return (
      <main className="min-h-screen flex items-center justify-center p-6" style={{ background: "#0a0707", fontFamily: "Georgia, serif" }}>
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(200,160,120,0.12)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#c8a078" strokeWidth={2.5} className="w-9 h-9">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-xs uppercase tracking-[0.4em] mb-2" style={{ color: "#c8a078" }}>Agendamento Realizado</p>
          <h1 className="text-3xl font-bold text-white mb-2">Tudo certo!</h1>
          <p className="text-sm mb-8" style={{ color: "#a89080" }}>Nossa equipe entrará em contato para confirmar.</p>

          <div className="rounded-3xl p-5 mb-6 text-left" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
            {[
              { label: "Nome",          valor: form.nome          },
              { label: "Procedimento",  valor: form.procedimento  },
              { label: "Data",          valor: formatarData(form.data) },
              { label: "Horário",       valor: form.horario       },
              proc?.preco ? { label: "Valor aprox.", valor: `R$ ${proc.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` } : null,
            ].filter(Boolean).map((item: any) => (
              <div key={item.label} className="flex justify-between py-3" style={{ borderBottom: "1px solid rgba(200,160,120,0.07)" }}>
                <span className="text-sm" style={{ color: "#6b5a4e" }}>{item.label}</span>
                <span className="text-sm font-semibold" style={{ color: "#c8a078" }}>{item.valor}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <a href={`https://wa.me/5561995039925?text=${msg}`} target="_blank" rel="noopener noreferrer"
              className="w-full py-4 rounded-full font-semibold flex items-center justify-center gap-2 transition hover:scale-105"
              style={{ background: "#25D366", color: "white" }}>
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Confirmar pelo WhatsApp
            </a>
            <button onClick={() => { setForm({ nome: "", telefone: "", procedimento: "", data: "", horario: "" }); setEtapa("form"); setHorariosOcupados([]); }}
              className="w-full py-4 rounded-full font-semibold transition hover:scale-105"
              style={{ border: "1px solid rgba(200,160,120,0.3)", color: "#c8a078" }}>
              Fazer outro agendamento
            </button>
            <a href="/" className="w-full py-4 rounded-full font-semibold transition hover:scale-105 block"
              style={{ border: "1px solid rgba(200,160,120,0.1)", color: "#6b5a4e" }}>
              Voltar ao início
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12" style={{ background: "#0a0707", fontFamily: "Georgia, serif" }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.4em] mb-3" style={{ color: "#c8a078" }}>Moncié Esthetique</p>
          <h1 className="text-4xl font-bold text-white mb-3">Agendar Procedimento</h1>
          <p className="text-sm" style={{ color: "#a89080" }}>Preencha os dados abaixo e nossa equipe confirmará em breve.</p>
        </div>

        <div className="flex flex-col gap-5">

          {/* Nome */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#6b5a4e" }}>Nome completo</label>
            <input type="text" placeholder="Seu nome" value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="w-full px-5 py-4 rounded-2xl outline-none text-white"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)" }} />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#6b5a4e" }}>WhatsApp (com DDD)</label>
            <input type="tel" placeholder="(61) 99999-9999" value={form.telefone}
              onChange={e => setForm(f => ({ ...f, telefone: formatarTelefone(e.target.value) }))}
              className="w-full px-5 py-4 rounded-2xl outline-none text-white"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)" }} />
          </div>

          {/* Procedimento */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#6b5a4e" }}>Procedimento</label>
            <select value={form.procedimento} onChange={e => setForm(f => ({ ...f, procedimento: e.target.value }))}
              className="w-full px-5 py-4 rounded-2xl outline-none"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)", color: form.procedimento ? "white" : "#4a3a32" }}>
              <option value="" style={{ color: "#4a3a32" }}>Escolha um procedimento</option>
              {procedimentos.map(p => (
                <option key={p.id} value={p.nome} style={{ color: "white", background: "#120d0d" }}>
                  {p.nome}{p.preco ? ` — R$ ${p.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#6b5a4e" }}>Data</label>
            <input type="date" value={form.data} min={hoje}
              onChange={e => { setForm(f => ({ ...f, data: e.target.value, horario: "" })); buscarHorarios(e.target.value); }}
              className="w-full px-5 py-4 rounded-2xl outline-none text-white"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)", colorScheme: "dark" }} />
            {form.data && (
              <p className="text-sm mt-2 capitalize" style={{ color: isDomingo(form.data) ? "#e87a7a" : "#c8a078" }}>
                {isDomingo(form.data) ? "⚠ Não atendemos aos domingos" : `📅 ${formatarData(form.data)}`}
              </p>
            )}
          </div>

          {/* Horários */}
          {form.data && !isDomingo(form.data) && (
            <div>
              <label className="block text-xs uppercase tracking-widest mb-3" style={{ color: "#6b5a4e" }}>Horário</label>
              {HORARIOS.filter(h => !horarioPassou(form.data, h)).length === 0 ? (
                <p className="text-sm" style={{ color: "#e87a7a" }}>Não há mais horários disponíveis hoje. Escolha outro dia.</p>
              ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {HORARIOS.filter(h => !horarioPassou(form.data, h)).map(h => {
                  const ocupado = horariosOcupados.includes(h);
                  return (
                    <button key={h} type="button" disabled={ocupado} onClick={() => setForm(f => ({ ...f, horario: h }))}
                      className="py-3 rounded-2xl text-sm transition hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: ocupado ? "#1a1212" : form.horario === h ? "#c8a078" : "#120d0d",
                        color: ocupado ? "#444" : form.horario === h ? "#0a0707" : "#a89080",
                        border: form.horario === h ? "1px solid #c8a078" : "1px solid rgba(200,160,120,0.15)",
                      }}>
                      {ocupado ? "Ocupado" : h}
                    </button>
                  );
                })}
              </div>
              )}
            </div>
          )}

          {erro && (
            <div className="p-4 rounded-2xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              {erro}
            </div>
          )}

          <button onClick={confirmar} disabled={loading || !form.nome || !form.telefone || !form.procedimento || !form.data || !form.horario}
            className="w-full py-5 rounded-full font-bold transition hover:scale-105 active:scale-95 mt-2"
            style={{ background: "#c8a078", color: "#0a0707", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Agendando..." : "Confirmar Agendamento"}
          </button>

          <p className="text-center text-xs" style={{ color: "#3a2e28" }}>
            Ao agendar você concorda com nossa política de cancelamento. Cancelamentos devem ser feitos com 24h de antecedência.
          </p>
        </div>
      </div>
      <style>{`select option { background: #120d0d; } input::placeholder { color: #4a3a32; }`}</style>
    </main>
  );
}
