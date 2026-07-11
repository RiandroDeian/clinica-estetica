"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type PacoteBoleto = {
  id: string;
  procedimento: string | string[];
  status_pagamento: string;
  dia_vencimento_boleto: number;
  data_acerto?: string;
  valor?: number;
  assinou_contrato?: boolean;
  pacientes?: { nome: string; telefone: string };
  funcionarios?: { nome: string; cor: string };
};

type HistoricoItem = {
  id: string;
  mes_referencia: string;
  data_pagamento: string;
  dias_atraso: number;
  observacao?: string;
  funcionarios?: { nome: string };
};

const pagCfg: Record<string, { label: string; color: string; bg: string }> = {
  pago:     { label: "Pago",     color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  pendente: { label: "Pendente", color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  parcial:  { label: "Parcial",  color: "var(--gold)", bg: "var(--gold-bg)" },
};

function diasAteVencimento(dia: number): number {
  const hoje = new Date();
  const hojeDay = hoje.getDate();
  let proximoMes = hoje.getMonth();
  let proximoAno = hoje.getFullYear();

  if (hojeDay > dia) {
    proximoMes += 1;
    if (proximoMes > 11) { proximoMes = 0; proximoAno += 1; }
  }

  const vencimento = new Date(proximoAno, proximoMes, dia);
  const diffMs = vencimento.getTime() - new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function corAlerta(dias: number) {
  if (dias <= 0) return { color: "#e87a7a", label: "Vence hoje!", bg: "rgba(232,122,122,0.15)" };
  if (dias <= 3) return { color: "#e87a7a", label: `${dias} dia${dias > 1 ? "s" : ""}`, bg: "rgba(232,122,122,0.1)" };
  if (dias <= 7) return { color: "#e8c97a", label: `${dias} dias`, bg: "rgba(232,201,122,0.1)" };
  return { color: "var(--text-muted)", label: `${dias} dias`, bg: "transparent" };
}

// ✅ Calcula selo de confiabilidade baseado no histórico
function selo(historico: HistoricoItem[]) {
  if (historico.length === 0) return { emoji: "⚪", label: "Sem histórico", color: "var(--text-muted)" };
  const mediaAtraso = historico.reduce((acc, h) => acc + h.dias_atraso, 0) / historico.length;
  if (mediaAtraso <= 2) return { emoji: "🟢", label: "Bom pagador", color: "#7ae8a0" };
  if (mediaAtraso <= 7) return { emoji: "🟡", label: "Atrasa às vezes", color: "#e8c97a" };
  return { emoji: "🔴", label: "Atrasa frequentemente", color: "#e87a7a" };
}

export default function LaserBoletosPage() {
  const router = useRouter();
  const [pacotes, setPacotes] = useState<PacoteBoleto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [historicos, setHistoricos] = useState<Record<string, HistoricoItem[]>>({});
  const [expandido, setExpandido] = useState<string | null>(null);
  const [modalPagamento, setModalPagamento] = useState<PacoteBoleto | null>(null);
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().slice(0, 10));
  const [observacaoPag, setObservacaoPag] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    const res = await fetch("/api/laser?forma_pagamento=boleto");
    const d = await res.json();
    const lista: PacoteBoleto[] = d.pacotes ?? [];
    setPacotes(lista);

    // ✅ Carrega histórico de cada pacote
    const hist: Record<string, HistoricoItem[]> = {};
    await Promise.all(lista.map(async p => {
      const r = await fetch(`/api/laser/boleto-historico?pacote_id=${p.id}`);
      if (r.ok) hist[p.id] = await r.json();
    }));
    setHistoricos(hist);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  async function registrarPagamento() {
    if (!modalPagamento) return;
    setSalvando(true);
    const res = await fetch("/api/laser/boleto-historico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pacote_id: modalPagamento.id,
        data_pagamento: dataPagamento,
        dia_vencimento: modalPagamento.dia_vencimento_boleto,
        observacao: observacaoPag || null,
      }),
    });
    if (res.ok) {
      toast.success("Pagamento registrado!");
      setModalPagamento(null);
      setObservacaoPag("");
      carregar();
    } else {
      toast.error("Erro ao registrar pagamento");
    }
    setSalvando(false);
  }

  const dias = [10, 15, 20];
  const semDiaDefinido = pacotes.filter(p => !p.dia_vencimento_boleto);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push("/admin/laser")}
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition hover:opacity-70"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="var(--text-muted)" strokeWidth={1.5}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#e87a7a" }}>🔴 Laser</p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Pacientes Boleto</h1>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {dias.map(dia => {
          const nesseGrupo = pacotes.filter(p => p.dia_vencimento_boleto === dia);
          const diasFalta = diasAteVencimento(dia);
          const alerta = corAlerta(diasFalta);
          return (
            <div key={dia} className="rounded-2xl p-4"
              style={{ background: "var(--bg-card)", border: `1px solid ${diasFalta <= 3 ? "#e87a7a" : "var(--border-color)"}` }}>
              <p className="text-2xl font-bold mb-1" style={{ color: "var(--gold)" }}>Dia {dia}</p>
              <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{nesseGrupo.length} paciente{nesseGrupo.length !== 1 ? "s" : ""}</p>
              <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: alerta.bg, color: alerta.color }}>
                {alerta.label}
              </span>
            </div>
          );
        })}
      </div>

      {carregando ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : pacotes.length === 0 ? (
        <div className="text-center py-20 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <p className="text-4xl mb-4">🔴</p>
          <p className="text-lg font-semibold mb-2" style={{ color: "var(--gold)" }}>Nenhum pacote boleto</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {dias.map(dia => {
            const nesseGrupo = pacotes.filter(p => p.dia_vencimento_boleto === dia);
            if (nesseGrupo.length === 0) return null;
            const diasFalta = diasAteVencimento(dia);
            const alerta = corAlerta(diasFalta);

            return (
              <div key={dia}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--gold)" }}>
                    Vencimento dia {dia}
                  </h2>
                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: alerta.bg, color: alerta.color }}>
                    {diasFalta <= 3 ? "⚠ " : ""}{alerta.label}
                  </span>
                </div>
                <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                  {nesseGrupo.map((p, i) => {
                    const areas = Array.isArray(p.procedimento) ? p.procedimento : (p.procedimento ?? "").split(", ").filter(Boolean);
                    const pc = pagCfg[p.status_pagamento] ?? pagCfg.pendente;
                    const hist = historicos[p.id] ?? [];
                    const seloInfo = selo(hist);
                    const aberto = expandido === p.id;

                    return (
                      <div key={p.id} style={{ borderBottom: i < nesseGrupo.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                        <div className="flex items-center gap-4 px-5 py-4 cursor-pointer transition hover:bg-[var(--bg-hover)]"
                          onClick={() => setExpandido(aberto ? null : p.id)}>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
                            {p.pacientes?.nome?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{p.pacientes?.nome}</p>
                              {/* ✅ Selo de confiabilidade */}
                              <span title={seloInfo.label} className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                style={{ background: `${seloInfo.color}18`, color: seloInfo.color }}>
                                {seloInfo.emoji} {seloInfo.label}
                              </span>
                            </div>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{p.pacientes?.telefone}</p>
                          </div>
                          <div className="flex flex-wrap gap-1 max-w-[140px]">
                            {areas.map(a => (
                              <span key={a} className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: "var(--border-subtle)", color: "var(--text-muted)" }}>{a}</span>
                            ))}
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0" style={{ color: pc.color, background: pc.bg }}>
                            {pc.label}
                          </span>
                          {p.valor && (
                            <span className="text-sm font-semibold flex-shrink-0" style={{ color: "var(--gold)" }}>
                              R$ {Number(p.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          {/* ✅ Botão registrar pagamento */}
                          <button onClick={e => { e.stopPropagation(); setModalPagamento(p); setDataPagamento(new Date().toISOString().slice(0, 10)); }}
                            className="text-xs px-3 py-1.5 rounded-xl font-medium transition hover:scale-105 flex-shrink-0"
                            style={{ background: "rgba(122,232,160,0.1)", color: "#7ae8a0", border: "1px solid rgba(122,232,160,0.3)" }}>
                            💰 Registrar
                          </button>
                          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 flex-shrink-0 transition"
                            style={{ color: "var(--text-muted)", transform: aberto ? "rotate(180deg)" : "none" }}
                            stroke="currentColor" strokeWidth={1.5}>
                            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>

                        {/* ✅ Histórico expandido */}
                        {aberto && (
                          <div className="px-5 pb-4 pl-16">
                            {hist.length === 0 ? (
                              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Nenhum pagamento registrado ainda</p>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {hist.map(h => {
                                  const cor = h.dias_atraso === 0 ? "#7ae8a0" : h.dias_atraso <= 5 ? "#e8c97a" : "#e87a7a";
                                  return (
                                    <div key={h.id} className="flex items-center gap-3 text-xs rounded-xl px-3 py-2"
                                      style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cor }} />
                                      <span style={{ color: "var(--text-secondary)" }}>
                                        {new Date(h.mes_referencia + "T12:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                                      </span>
                                      <span style={{ color: "var(--text-muted)" }}>·</span>
                                      <span style={{ color: cor }}>
                                        Pago em {new Date(h.data_pagamento + "T12:00:00").toLocaleDateString("pt-BR")}
                                        {h.dias_atraso > 0 ? ` (${h.dias_atraso}d atraso)` : " (em dia)"}
                                      </span>
                                      {h.observacao && (
                                        <span className="italic" style={{ color: "var(--text-muted)" }}>— {h.observacao}</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {semDiaDefinido.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "#e8c97a" }}>
                ⚠ Sem dia de vencimento definido ({semDiaDefinido.length})
              </h2>
              <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid rgba(232,201,122,0.3)" }}>
                {semDiaDefinido.map((p, i) => (
                  <div key={p.id}
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer transition hover:bg-[var(--bg-hover)]"
                    style={{ borderBottom: i < semDiaDefinido.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                    onClick={() => router.push(`/admin/laser/${p.id}`)}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "rgba(232,201,122,0.15)", color: "#e8c97a" }}>
                      {p.pacientes?.nome?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{p.pacientes?.nome}</p>
                      <p className="text-xs" style={{ color: "#e8c97a" }}>Clique para definir o dia de vencimento</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ Modal registrar pagamento */}
      {modalPagamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setModalPagamento(null)}>
          <div className="w-full max-w-sm rounded-3xl p-6"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(122,232,160,0.3)" }}>
            <p className="text-lg font-bold mb-1" style={{ color: "#7ae8a0" }}>Registrar Pagamento</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>{modalPagamento.pacientes?.nome}</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>Data do pagamento</label>
                <input type="date" value={dataPagamento} onChange={e => setDataPagamento(e.target.value)}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)", colorScheme: "dark" }} />
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Vencimento: dia {modalPagamento.dia_vencimento_boleto}
                </p>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>
                  Observação <span style={{ color: "var(--text-muted)" }}>(opcional)</span>
                </label>
                <textarea value={observacaoPag} onChange={e => setObservacaoPag(e.target.value)}
                  rows={2} placeholder="Ex: pagou atrasado, disse que esqueceu..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalPagamento(null)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                Cancelar
              </button>
              <button onClick={registrarPagamento} disabled={salvando}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: "#7ae8a0", color: "#0a0707" }}>
                {salvando ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`textarea::placeholder { color: var(--text-muted); }`}</style>
    </div>
  );
}