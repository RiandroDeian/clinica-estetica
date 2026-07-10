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

type Sessao = {
  id: string;
  data_sessao: string;
  areas_tratadas?: string;
  observacoes?: string;
  reacoes?: string;
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

const formSessaoInicial = {
  data_sessao: new Date().toISOString().slice(0, 16),
  areas_tratadas: "",
  observacoes: "",
  reacoes: "",
};

export default function LaserDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalSessao, setModalSessao] = useState(false);
  const [formSessao, setFormSessao] = useState(formSessaoInicial);

  async function buscar() {
    setCarregando(true);
    const [resPacote, resSessoes] = await Promise.all([
      fetch(`/api/laser/${id}`),
      fetch(`/api/laser/sessoes?pacote_id=${id}`),
    ]);
    if (resPacote.ok) setPacote(await resPacote.json());
    if (resSessoes.ok) setSessoes(await resSessoes.json());
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
      setPacote(await res.json());
      toast.success("Salvo!");
    } else toast.error("Erro ao salvar");
    setSalvando(false);
  }

  async function registrarSessao() {
    if (!pacote) return;
    setSalvando(true);
    const res = await fetch("/api/laser/sessoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pacote_id: id,
        paciente_id: null,
        data_sessao: new Date(formSessao.data_sessao).toISOString(),
        areas_tratadas: formSessao.areas_tratadas || null,
        observacoes: formSessao.observacoes || null,
        reacoes: formSessao.reacoes || null,
      }),
    });
    if (res.ok) {
      toast.success("Atendimento registrado!");
      setModalSessao(false);
      setFormSessao(formSessaoInicial);
      buscar();
    } else toast.error("Erro ao registrar atendimento");
    setSalvando(false);
  }

  async function excluirSessao(sessaoId: string) {
    if (!confirm("Excluir este atendimento?")) return;
    await fetch(`/api/laser/sessoes?id=${sessaoId}&pacote_id=${id}`, { method: "DELETE" });
    buscar();
    toast.success("Atendimento removido!");
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
      <div className="flex items-center gap-4 mb-6">
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

      {/* Alerta boleto */}
      {eBoleto && (
        <div className="rounded-2xl px-5 py-4 mb-5"
          style={{ background: "rgba(232,122,122,0.06)", border: "1px solid rgba(232,122,122,0.3)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "#e87a7a" }}>🔴 Pacote Boleto</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Data de acerto: <strong style={{ color: "#e87a7a" }}>
              {pacote.data_acerto
                ? new Date(pacote.data_acerto + "T12:00:00").toLocaleDateString("pt-BR")
                : "Não definida"}
            </strong>
          </p>
        </div>
      )}

      {/* Progresso sessões */}
      <div className="rounded-3xl p-6 mb-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Sessões realizadas</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold" style={{ color: "var(--gold)" }}>{pacote.sessoes_feitas}</span>
              <span className="text-lg mb-0.5" style={{ color: "var(--text-muted)" }}>/ {pacote.total_sessoes}</span>
            </div>
          </div>
          <button onClick={() => {
            setFormSessao({ ...formSessaoInicial, areas_tratadas: areas.join(", ") });
            setModalSessao(true);
          }}
            disabled={pacote.sessoes_feitas >= pacote.total_sessoes}
            className="px-5 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105 disabled:opacity-40"
            style={{ background: "var(--gold)", color: "var(--bg-card)" }}>
            + Registrar Atendimento
          </button>
        </div>
        <div className="h-3 rounded-full mb-1" style={{ background: "var(--border-subtle)" }}>
          <div className="h-3 rounded-full transition-all"
            style={{ width: `${pct}%`, background: pct >= 100 ? "#e87a7a" : "var(--gold)" }} />
        </div>
        <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
          <span>{pct}% concluído</span>
          <span>{pacote.total_sessoes - pacote.sessoes_feitas} sessões restantes</span>
        </div>
      </div>

      {/* Informações do pacote */}
      <div className="rounded-3xl p-6 mb-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>

        {/* Áreas */}
        <div className="mb-5">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Áreas tratadas</p>
          <div className="flex flex-wrap gap-1.5">
            {areas.map(a => (
              <span key={a} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: "var(--border-subtle)", color: "var(--text-secondary)" }}>{a}</span>
            ))}
          </div>
        </div>

        {/* Status tratamento */}
        <div className="mb-5">
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
        <div className="mb-5">
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
        <div className="grid grid-cols-2 gap-3 mb-5">
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
      </div>

      {/* Histórico de atendimentos */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Histórico de Atendimentos ({sessoes.length})
          </p>
        </div>

        {sessoes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum atendimento registrado ainda</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {sessoes.map((s, i) => (
              <div key={s.id} className="px-6 py-4 flex gap-4">
                {/* Número da sessão */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
                  {sessoes.length - i}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {new Date(s.data_sessao).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "long", year: "numeric"
                      })}
                    </p>
                    <button onClick={() => excluirSessao(s.id)}
                      className="text-xs px-2 py-1 rounded-lg transition hover:opacity-70"
                      style={{ color: "var(--danger)", background: "rgba(232,122,122,0.08)" }}>
                      Remover
                    </button>
                  </div>
                  {s.funcionarios?.nome && (
                    <p className="text-xs mb-1" style={{ color: s.funcionarios.cor ?? "var(--gold)" }}>
                      {s.funcionarios.nome}
                    </p>
                  )}
                  {s.areas_tratadas && (
                    <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                      Áreas: {s.areas_tratadas}
                    </p>
                  )}
                  {s.observacoes && (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.observacoes}</p>
                  )}
                  {s.reacoes && (
                    <p className="text-xs mt-1 px-2 py-1 rounded-lg"
                      style={{ background: "rgba(232,122,122,0.06)", color: "#e87a7a" }}>
                      ⚠ Reações: {s.reacoes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal registrar atendimento */}
      {modalSessao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setModalSessao(false)}>
          <div className="w-full max-w-md rounded-3xl p-6"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Laser</p>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Registrar Atendimento</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Sessão {pacote.sessoes_feitas + 1} de {pacote.total_sessoes}
                </p>
              </div>
              <button onClick={() => setModalSessao(false)} style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>
                  Data e Hora do Atendimento
                </label>
                <input type="datetime-local" value={formSessao.data_sessao}
                  onChange={e => setFormSessao(f => ({ ...f, data_sessao: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)", colorScheme: "dark" }} />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>
                  Áreas Tratadas
                </label>
                <input type="text" value={formSessao.areas_tratadas}
                  onChange={e => setFormSessao(f => ({ ...f, areas_tratadas: e.target.value }))}
                  placeholder={areas.join(", ")}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>
                  Observações <span style={{ color: "var(--text-muted)" }}>(opcional)</span>
                </label>
                <textarea value={formSessao.observacoes}
                  onChange={e => setFormSessao(f => ({ ...f, observacoes: e.target.value }))}
                  rows={2} placeholder="Evolução do tratamento, parâmetros utilizados..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#e87a7a" }}>
                  Reações da Pele <span style={{ color: "var(--text-muted)" }}>(opcional)</span>
                </label>
                <textarea value={formSessao.reacoes}
                  onChange={e => setFormSessao(f => ({ ...f, reacoes: e.target.value }))}
                  rows={2} placeholder="Eritema, edema, foliculite..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background: "var(--bg-input)", border: "1px solid rgba(232,122,122,0.3)", color: "var(--text-primary)" }} />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalSessao(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                Cancelar
              </button>
              <button onClick={registrarSessao} disabled={salvando}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: "var(--gold)", color: "var(--bg-card)" }}>
                {salvando ? "Salvando..." : "Confirmar Atendimento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}