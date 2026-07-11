"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

const pagCfg: Record<string, { label: string; color: string; bg: string }> = {
  pago:     { label: "Pago",     color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  pendente: { label: "Pendente", color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  parcial:  { label: "Parcial",  color: "var(--gold)", bg: "var(--gold-bg)" },
};

// ✅ Calcula quantos dias faltam até o próximo vencimento
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

export default function LaserBoletosPage() {
  const router = useRouter();
  const [pacotes, setPacotes] = useState<PacoteBoleto[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/laser?forma_pagamento=boleto")
      .then(r => r.json())
      .then(d => {
        setPacotes(d.pacotes ?? []);
        setCarregando(false);
      });
  }, []);

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
                    return (
                      <div key={p.id}
                        className="flex items-center gap-4 px-5 py-4 cursor-pointer transition hover:bg-[var(--bg-hover)]"
                        style={{ borderBottom: i < nesseGrupo.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                        onClick={() => router.push(`/admin/laser/${p.id}`)}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
                          {p.pacientes?.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{p.pacientes?.nome}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{p.pacientes?.telefone}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
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
                        <span className="text-xs flex-shrink-0" style={{ color: p.assinou_contrato ? "#7ae8a0" : "#e87a7a" }}>
                          {p.assinou_contrato ? "✓ Contrato" : "✗ Sem contrato"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Pacotes boleto sem dia definido */}
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
    </div>
  );
}