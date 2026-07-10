"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

type Pacote = {
  id: string;
  procedimento: string | string[];
  total_sessoes: number;
  sessoes_feitas: number;
  status: string;
  status_pagamento: string;
  categoria: string;
  forma_pagamento?: string;
  valor?: number;
  data_inicio?: string;
  data_acerto?: string;
  assinou_contrato?: boolean;
  assinou_termo?: boolean;
  observacoes?: string;
  criado_em: string;
  pacientes?: { nome: string; telefone: string; cpf?: string };
  funcionarios?: { nome: string; cor: string };
};

const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
  em_tratamento: { label: "Em tratamento", color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  finalizado:    { label: "Finalizado",    color: "var(--text-secondary)", bg: "rgba(168,144,128,0.1)" },
  pausado:       { label: "Pausado",       color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  cancelado:     { label: "Cancelado",     color: "#e87a7a", bg: "rgba(232,122,122,0.1)" },
};

const pagCfg: Record<string, { label: string; color: string; bg: string }> = {
  pago:     { label: "Pago",     color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  pendente: { label: "Pendente", color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  parcial:  { label: "Parcial",  color: "var(--gold)", bg: "var(--gold-bg)" },
};

const formaCfg: Record<string, { label: string; color: string }> = {
  boleto:        { label: "Boleto",        color: "#e87a7a" },
  pix:           { label: "PIX",           color: "#7ae8a0" },
  credito:       { label: "Cartão Créd.",  color: "#a89bcc" },
  debito:        { label: "Cartão Déb.",   color: "#7ab8e8" },
  dinheiro:      { label: "Dinheiro",      color: "#e8c97a" },
  transferencia: { label: "Transferência", color: "var(--gold)" },
};

export default function LaserDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [editandoSessoes, setEditandoSessoes] = useState(false);
  const [novasSessoes, setNovasSessoes] = useState("");

  async function buscar() {
    setCarregando(true);
    const res = await fetch(`/api/laser/${id}`);
    if (!res.ok) { toast.error("Erro ao carregar pacote"); setCarregando(false); return; }
    const data = await res.json();
    setPacote(data);
    setCarregando(false);
  }

  useEffect(() => { buscar(); }, [id]);

  async function atualizar(campos: Partial<Pacote>) {
    setSalvando(true);
    const res = await fetch(`/api/laser/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campos),
    });
    if (res.ok) {
      const data = await res.json();
      setPacote(data);
      toast.success("Salvo!");
    } else {
      toast.error("Erro ao salvar");
    }
    setSalvando(false);
  }

  async function registrarSessao() {
    if (!pacote) return;
    if (pacote.sessoes_feitas >= pacote.total_sessoes) {
      toast.error("Todas as sessões já foram realizadas");
      return;
    }
    await atualizar({ sessoes_feitas: pacote.sessoes_feitas + 1 });
  }

  async function removerSessao() {
    if (!pacote || pacote.sessoes_feitas <= 0) return;
    await atualizar({ sessoes_feitas: pacote.sessoes_feitas - 1 });
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "var(--gold)" }} />
      </div>
    );
  }

  if (!pacote) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">⚠️</p>
        <p style={{ color: "var(--text-muted)" }}>Pacote não encontrado</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 rounded-xl text-sm"
          style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>Voltar</button>
      </div>
    );
  }

  const areas = Array.isArray(pacote.procedimento)
    ? pacote.procedimento
    : (pacote.procedimento ?? "").split(", ").filter(Boolean);

  const pct = pacote.total_sessoes > 0
    ? Math.round((pacote.sessoes_feitas / pacote.total_sessoes) * 100)
    : 0;

  const sc = statusCfg[pacote.status] ?? statusCfg.em_tratamento;
  const pc = pagCfg[pacote.status_pagamento] ?? pagCfg.pendente;
  const fc = formaCfg[pacote.forma_pagamento ?? ""] ?? null;
  const eBoleto = pacote.forma_pagamento === "boleto";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()}
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition hover:opacity-70"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="var(--text-muted)" strokeWidth={1.5}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Laser</p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {pacote.pacientes?.nome ?? "Paciente"}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{pacote.pacientes?.telefone}</p>
        </div>
      </div>

      {/* ✅ Alerta boleto */}
      {eBoleto && (
        <div className="rounded-2xl px-5 py-4 mb-5"
          style={{ background: "rgba(232,122,122,0.06)", border: "1px solid rgba(232,122,122,0.3)" }}>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: "#e87a7a" }}>🔴 Pacote Boleto</span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Data de acerto: <strong style={{ color: "#e87a7a" }}>
              {pacote.data_acerto
                ? new Date(pacote.data_acerto + "T12:00:00").toLocaleDateString("pt-BR")
                : "Não definida"}
            </strong>
          </p>
        </div>
      )}

      {/* Card principal */}
      <div className="rounded-3xl overflow-hidden mb-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>

        {/* Sessões */}
        <div className="p-6" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Sessões</p>
            <div className="flex gap-2">
              <button onClick={removerSessao} disabled={salvando || pacote.sessoes_feitas <= 0}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-lg font-bold transition hover:scale-110 disabled:opacity-40"
                style={{ background: "rgba(232,122,122,0.1)", color: "#e87a7a" }}>−</button>
              <button onClick={registrarSessao} disabled={salvando || pacote.sessoes_feitas >= pacote.total_sessoes}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-lg font-bold transition hover:scale-110 disabled:opacity-40"
                style={{ background: "rgba(122,232,160,0.1)", color: "#7ae8a0" }}>+</button>
            </div>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-5xl font-bold" style={{ color: "var(--gold)" }}>{pacote.sessoes_feitas}</span>
            <span className="text-xl mb-1" style={{ color: "var(--text-muted)" }}>/ {pacote.total_sessoes}</span>
            <span className="text-sm mb-1 ml-auto" style={{ color: "var(--text-muted)" }}>
              {pacote.total_sessoes - pacote.sessoes_feitas} restantes
            </span>
          </div>
          <div className="h-3 rounded-full" style={{ background: "var(--border-subtle)" }}>
            <div className="h-3 rounded-full transition-all"
              style={{ width: `${pct}%`, background: pct >= 100 ? "#e87a7a" : "var(--gold)" }} />
          </div>
          <p className="text-xs mt-1 text-right" style={{ color: "var(--text-muted)" }}>{pct}%</p>
        </div>

        {/* Informações */}
        <div className="p-6 flex flex-col gap-4">
          {/* Áreas */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Áreas tratadas</p>
            <div className="flex flex-wrap gap-1.5">
              {areas.map(a => (
                <span key={a} className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "var(--border-subtle)", color: "var(--text-secondary)" }}>{a}</span>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Status do tratamento</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(statusCfg).map(([key, cfg]) => (
                <button key={key} onClick={() => atualizar({ status: key })}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition"
                  style={{
                    background: pacote.status === key ? cfg.bg : "transparent",
                    color: cfg.color,
                    border: `1px solid ${pacote.status === key ? cfg.color : `${cfg.color}40`}`,
                  }}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status pagamento */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Status do pagamento</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(pagCfg).map(([key, cfg]) => (
                <button key={key} onClick={() => atualizar({ status_pagamento: key })}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition"
                  style={{
                    background: pacote.status_pagamento === key ? cfg.bg : "transparent",
                    color: cfg.color,
                    border: `1px solid ${pacote.status_pagamento === key ? cfg.color : `${cfg.color}40`}`,
                  }}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detalhes */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Categoria",       valor: pacote.categoria },
              { label: "Forma pagamento", valor: fc?.label ?? pacote.forma_pagamento ?? "—", color: fc?.color },
              { label: "Valor",           valor: pacote.valor ? `R$ ${Number(pacote.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—" },
              { label: "Profissional",    valor: pacote.funcionarios?.nome ?? "—" },
              { label: "Início",          valor: pacote.data_inicio ? new Date(pacote.data_inicio + "T12:00:00").toLocaleDateString("pt-BR") : "—" },
              { label: "Cadastrado em",   valor: new Date(pacote.criado_em).toLocaleDateString("pt-BR") },
            ].map(item => (
              <div key={item.label} className="rounded-2xl px-4 py-3"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                <p className="text-sm font-medium" style={{ color: (item as any).color ?? "var(--text-primary)" }}>{item.valor}</p>
              </div>
            ))}
          </div>

          {/* Termos e contrato */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-2xl px-4 py-3 flex items-center justify-between"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>Termo</span>
              <button onClick={() => atualizar({ assinou_termo: !pacote.assinou_termo })}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ background: pacote.assinou_termo ? "var(--gold)" : "var(--border-color)" }}>
                <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: pacote.assinou_termo ? "calc(100% - 20px)" : "4px" }} />
              </button>
            </div>
            <div className="flex-1 rounded-2xl px-4 py-3 flex items-center justify-between"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>Contrato</span>
              <button onClick={() => atualizar({ assinou_contrato: !pacote.assinou_contrato })}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ background: pacote.assinou_contrato ? "#7ae8a0" : "var(--border-color)" }}>
                <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: pacote.assinou_contrato ? "calc(100% - 20px)" : "4px" }} />
              </button>
            </div>
          </div>

          {/* Observações */}
          {pacote.observacoes && (
            <div className="rounded-2xl px-4 py-3"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Observações</p>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>{pacote.observacoes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}