"use client";

import { useState, useEffect } from "react";

interface Procedimento {
  id: string;
  nome: string;
  cor: string;
  duracao_minutos: number;
}

interface Props {
  inicioSugerido?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalAgendamentoRapido({ inicioSugerido, onClose, onSuccess }: Props) {
  const agora = inicioSugerido ?? new Date().toISOString().slice(0, 16);
  const fimPadrao = new Date(new Date(agora).getTime() + 60 * 60000).toISOString().slice(0, 16);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [procedimentosSelecionados, setProcedimentosSelecionados] = useState<string[]>([]);
  const [inicio, setInicio] = useState(agora);
  const [fim, setFim] = useState(fimPadrao);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);

  useEffect(() => {
    fetch("/api/procedimentos")
      .then(r => r.json())
      .then(d => setProcedimentos(Array.isArray(d) ? d : []));
  }, []);

  function formatarTelefone(valor: string) {
    const nums = valor.replace(/\D/g, "").slice(0, 11);
    if (nums.length <= 2) return nums;
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  }

  function recalcularFim(novoInicio: string, procs: string[]) {
    const d = new Date(novoInicio);
    if (isNaN(d.getTime())) return;
    const totalMin = procs.reduce((acc, n) => {
      const p = procedimentos.find(p => p.nome === n);
      return acc + (p?.duracao_minutos ?? 60);
    }, 0);
    const novoFim = new Date(d.getTime() + Math.max(totalMin, 60) * 60000);
    setFim(novoFim.toISOString().slice(0, 16));
  }

  function toggleProcedimento(nomep: string) {
    setProcedimentosSelecionados(prev => {
      const novos = prev.includes(nomep) ? prev.filter(p => p !== nomep) : [...prev, nomep];
      recalcularFim(inicio, novos);
      return novos;
    });
  }

  function handleInicioChange(valor: string) {
    setInicio(valor);
    recalcularFim(valor, procedimentosSelecionados);
  }

  async function handleSalvar() {
    setErro("");
    if (!nome.trim() || !telefone.trim() || procedimentosSelecionados.length === 0 || !inicio || !fim) {
      setErro("Preencha todos os campos e selecione ao menos um procedimento.");
      return;
    }
    const inicioDate = new Date(inicio);
    const fimDate = new Date(fim);
    if (isNaN(inicioDate.getTime()) || isNaN(fimDate.getTime())) {
      setErro("Data/hora inválida.");
      return;
    }
    if (fimDate <= inicioDate) {
      setErro("O horário de fim deve ser após o início.");
      return;
    }
    setLoading(true);

    const inicioISO = inicioDate.toISOString();
    const fimISO = fimDate.toISOString();
    const offset = inicioDate.getTimezoneOffset() * 60000;
    const localInicio = new Date(inicioDate.getTime() - offset);
    const data = localInicio.toISOString().split("T")[0];
    const horario = localInicio.toISOString().split("T")[1].slice(0, 5);
    const procedimento = procedimentosSelecionados.join(", ");

    const res = await fetch("/api/agendamentos/rapido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nome.trim(), telefone: telefone.trim(), procedimento, inicio: inicioISO, fim: fimISO, data, horario }),
    });

    setLoading(false);
    if (!res.ok) { const err = await res.json(); setErro(err.erro ?? "Erro ao criar agendamento."); return; }
    onSuccess();
    onClose();
  }

  const duracaoTotal = procedimentosSelecionados.reduce((acc, n) => {
    const p = procedimentos.find(p => p.nome === n);
    return acc + (p?.duracao_minutos ?? 60);
  }, 0);

  function formatarDataHora(iso: string) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)" }}>

        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid rgba(200,160,120,0.1)" }}>
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>Agendamento Rápido</p>
            <h2 className="text-xl font-bold" style={{ color: "#e8d5c0", fontFamily: "Georgia, serif" }}>Sem cadastro prévio</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
              ⚠ Sem cadastro
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-70"
              style={{ background: "rgba(200,160,120,0.1)", color: "#c8a078" }}>✕</button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          <input type="text" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl outline-none text-white placeholder:text-[#4a3a32] text-sm"
            style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)" }} />

          <input type="tel" placeholder="Telefone / WhatsApp" value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            className="w-full px-4 py-3 rounded-2xl outline-none text-white placeholder:text-[#4a3a32] text-sm"
            style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)" }} />

          <div>
            <label className="block text-xs uppercase tracking-widest mb-3" style={{ color: "#a89080" }}>
              Procedimentos
              {procedimentosSelecionados.length > 0 && (
                <span className="ml-2 normal-case" style={{ color: "#c8a078" }}>
                  ({procedimentosSelecionados.length} selecionado{procedimentosSelecionados.length > 1 ? "s" : ""} · {duracaoTotal}min)
                </span>
              )}
            </label>
            {procedimentos.length === 0 ? (
              <p className="text-xs" style={{ color: "#4a3a32" }}>Carregando...</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {procedimentos.map((p) => {
                  const sel = procedimentosSelecionados.includes(p.nome);
                  return (
                    <button key={p.id} type="button" onClick={() => toggleProcedimento(p.nome)}
                      className="px-3 py-1.5 rounded-xl text-xs transition hover:scale-105"
                      style={{
                        background: sel ? `${p.cor}22` : "#0e0a0a",
                        color: sel ? p.cor : "#6b5a4e",
                        border: sel ? `1px solid ${p.cor}` : "1px solid rgba(200,160,120,0.12)",
                      }}>
                      {sel ? "✓ " : ""}{p.nome}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Início</label>
              <input type="datetime-local" value={inicio} onChange={(e) => handleInicioChange(e.target.value)}
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0", colorScheme: "dark" }} />
              {inicio && <p className="text-xs mt-1" style={{ color: "#6b5a4e" }}>{formatarDataHora(inicio)}</p>}
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Fim</label>
              <input type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)}
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0", colorScheme: "dark" }} />
              {fim && <p className="text-xs mt-1" style={{ color: "#6b5a4e" }}>{formatarDataHora(fim)}</p>}
            </div>
          </div>

          {erro && <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>{erro}</div>}
        </div>

        <div className="flex gap-3 px-6 py-4" style={{ borderTop: "1px solid rgba(200,160,120,0.1)" }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-full text-sm uppercase tracking-widest transition hover:opacity-70"
            style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#6b5a4e" }}>Cancelar</button>
          <button onClick={handleSalvar} disabled={loading}
            className="flex-1 py-3 rounded-full text-sm uppercase tracking-widest font-semibold transition hover:scale-105 active:scale-95"
            style={{ background: loading ? "rgba(200,160,120,0.4)" : "#c8a078", color: "#0a0707" }}>
            {loading ? "Salvando..." : "Criar Agendamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
