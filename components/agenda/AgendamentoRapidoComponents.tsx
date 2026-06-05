"use client";

import { useState } from "react";

export function BadgeSemCadastro() {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
      ⚠ Sem cadastro
    </span>
  );
}

interface Agendamento {
  id: string;
  nome_temporario?: string | null;
  telefone_temporario?: string | null;
}

interface Props {
  agendamento: Agendamento;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalCadastrarPaciente({ agendamento, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [nome, setNome] = useState(agendamento.nome_temporario ?? "");
  const [telefone, setTelefone] = useState(agendamento.telefone_temporario ?? "");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [sexo, setSexo] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [alergias, setAlergias] = useState("");
  const [contraindicacoes, setContraindicacoes] = useState("");
  const [observacoes, setObservacoes] = useState("");

  async function handleCadastrar() {
    setErro("");
    if (!nome.trim() || !telefone.trim()) {
      setErro("Nome e telefone são obrigatórios.");
      return;
    }
    setLoading(true);

    // 1. Criar paciente via API (usa supabaseAdmin, sem RLS)
    const resPaciente = await fetch("/api/pacientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim() || null,
        cpf: cpf.trim() || null,
        sexo: sexo || null,
        data_nascimento: dataNascimento || null,
        alergias: alergias.trim() || null,
        contraindicacoes: contraindicacoes.trim() || null,
        observacoes: observacoes.trim() || null,
      }),
    });

    const novoPaciente = await resPaciente.json();

    if (!resPaciente.ok || !novoPaciente.id) {
      setErro("Erro ao cadastrar: " + (novoPaciente.erro ?? "tente novamente."));
      setLoading(false);
      return;
    }

    // 2. Vincular paciente ao agendamento via API
    const resAg = await fetch(`/api/agendamentos/${agendamento.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paciente_id: novoPaciente.id,
        sem_cadastro: false,
        nome: nome.trim(),
        telefone: telefone.trim(),
      }),
    });

    setLoading(false);

    if (!resAg.ok) {
      setErro("Paciente criado, mas erro ao vincular ao agendamento.");
      return;
    }

    onSuccess();
    onClose();
  }

  const inputClass = "w-full px-4 py-3 rounded-2xl outline-none text-white text-sm placeholder:text-[#3a2e28]";
  const inputStyle = { background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)" };
  const labelClass = "block text-xs uppercase tracking-widest mb-2";
  const labelStyle = { color: "#6b5a4e" };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)" }}>

        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid rgba(200,160,120,0.1)" }}>
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>#{agendamento.id.slice(-6).toUpperCase()}</p>
            <h2 className="text-xl font-bold" style={{ color: "#e8d5c0", fontFamily: "Georgia, serif" }}>Cadastrar Paciente</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-70"
            style={{ background: "rgba(200,160,120,0.1)", color: "#c8a078" }}>✕</button>
        </div>

        <div className="mx-6 mt-4 px-4 py-3 rounded-2xl text-sm"
          style={{ background: "rgba(200,160,120,0.06)", border: "1px solid rgba(200,160,120,0.15)", color: "#a89080" }}>
          Campos pré-preenchidos com os dados do agendamento. Revise antes de confirmar.
        </div>

        <div className="p-6 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className={labelClass} style={labelStyle}>Nome *</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} style={inputStyle} placeholder="Nome completo" />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Telefone *</label>
            <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} className={inputClass} style={inputStyle} placeholder="(61) 99999-9999" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} style={inputStyle} placeholder="opcional" />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>CPF</label>
              <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} className={inputClass} style={inputStyle} placeholder="opcional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>Sexo</label>
              <select value={sexo} onChange={(e) => setSexo(e.target.value)} className={inputClass}
                style={{ ...inputStyle, color: sexo ? "#e8d5c0" : "#3a2e28" }}>
                <option value="">Selecionar</option>
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Nascimento</label>
              <input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)}
                className={inputClass} style={{ ...inputStyle, colorScheme: "dark" }} />
            </div>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Alergias</label>
            <input type="text" value={alergias} onChange={(e) => setAlergias(e.target.value)} className={inputClass} style={inputStyle} placeholder="opcional" />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Contraindicações</label>
            <input type="text" value={contraindicacoes} onChange={(e) => setContraindicacoes(e.target.value)} className={inputClass} style={inputStyle} placeholder="opcional" />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Observações</label>
            <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2}
              className="w-full px-4 py-3 rounded-2xl outline-none text-white text-sm resize-none placeholder:text-[#3a2e28]"
              style={inputStyle} placeholder="opcional" />
          </div>
          {erro && (
            <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>{erro}</div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4" style={{ borderTop: "1px solid rgba(200,160,120,0.1)" }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-full text-sm uppercase tracking-widest transition hover:opacity-70"
            style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#6b5a4e" }}>Cancelar</button>
          <button onClick={handleCadastrar} disabled={loading}
            className="flex-1 py-3 rounded-full text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
            style={{ background: loading ? "rgba(200,160,120,0.4)" : "#c8a078", color: "#0a0707" }}>
            {loading ? "Salvando..." : "Cadastrar Paciente"}
          </button>
        </div>
      </div>
    </div>
  );
}
