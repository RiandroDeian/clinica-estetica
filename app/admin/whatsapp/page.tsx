"use client";

import { useEffect, useMemo, useState } from "react";

type Log = {
  id: string;
  tipo: string;
  mensagem: string;
  status: string;
  criado_em: string;
  pacientes?: {
    nome: string;
    telefone: string;
  };
};

type Paciente = {
  id: string;
  nome: string;
  telefone: string;
};

const tipos = [
  {
    key: "confirmacao",
    label: "Confirmação",
    emoji: "✅",
    descricao: "Confirma presença do paciente",
    cor: "#25D366",
  },
  {
    key: "lembrete_dia",
    label: "1 dia antes",
    emoji: "📅",
    descricao: "Lembrete automático do agendamento",
    cor: "#c8a078",
  },
  {
    key: "lembrete_hora",
    label: "1 hora antes",
    emoji: "⏰",
    descricao: "Evita faltas no atendimento",
    cor: "#7aa6e8",
  },
  {
    key: "cancelamento",
    label: "Cancelamento",
    emoji: "❌",
    descricao: "Aviso de cancelamento",
    cor: "#e87a7a",
  },
  {
    key: "pos_atendimento",
    label: "Pós-atendimento",
    emoji: "💎",
    descricao: "Fidelização e retorno",
    cor: "#b78ae8",
  },
];

export default function WhatsappPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [linkGerado, setLinkGerado] = useState<{
    link: string;
    mensagem: string;
  } | null>(null);

  const [busca, setBusca] = useState("");

  const [form, setForm] = useState({
    paciente_id: "",
    tipo: "confirmacao",
    mensagem_custom: "",
  });

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const [logsRes, pacientesRes] = await Promise.all([
      fetch("/api/whatsapp"),
      fetch("/api/pacientes"),
    ]);

    const logsData = await logsRes.json();
    const pacientesData = await pacientesRes.json();

    setLogs(logsData.logs ?? []);
    setPacientes(Array.isArray(pacientesData) ? pacientesData : []);
  }

  async function enviar() {
    setEnviando(true);

    const res = await fetch("/api/whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    setLinkGerado({
      link: data.link,
      mensagem: data.mensagem,
    });

    carregarDados();

    setEnviando(false);
  }

  const pacienteSelecionado = useMemo(() => {
    return pacientes.find((p) => p.id === form.paciente_id);
  }, [pacientes, form.paciente_id]);

  const logsFiltrados = logs.filter((log) => {
    const nome = log.pacientes?.nome?.toLowerCase() ?? "";
    return nome.includes(busca.toLowerCase());
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p
            className="text-xs uppercase tracking-widest mb-1"
            style={{ color: "#c8a078" }}
          >
            Comunicação
          </p>

          <h1
            className="text-4xl font-bold"
            style={{ color: "#e8d5c0" }}
          >
            WhatsApp
          </h1>

          <p
            className="text-sm mt-2"
            style={{ color: "#6b5a4e" }}
          >
            Central de mensagens automáticas e comunicação com pacientes
          </p>
        </div>

        <button
          onClick={() => {
            setModalAberto(true);
            setLinkGerado(null);
          }}
          className="flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{
            background: "#25D366",
            color: "white",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-4 h-4"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>

          Nova Mensagem
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        {tipos.map((tipo) => (
          <div
            key={tipo.key}
            className="rounded-3xl p-5"
            style={{
              background: "#120d0d",
              border: "1px solid rgba(200,160,120,0.12)",
            }}
          >
            <div className="text-3xl mb-3">{tipo.emoji}</div>

            <p
              className="font-semibold mb-1"
              style={{ color: "#e8d5c0" }}
            >
              {tipo.label}
            </p>

            <p
              className="text-xs leading-5"
              style={{ color: "#6b5a4e" }}
            >
              {tipo.descricao}
            </p>
          </div>
        ))}
      </div>

      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: "#120d0d",
          border: "1px solid rgba(200,160,120,0.12)",
        }}
      >
        <div
          className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap"
          style={{
            borderBottom: "1px solid rgba(200,160,120,0.08)",
          }}
        >
          <div>
            <h2
              className="text-xs uppercase tracking-widest"
              style={{ color: "#c8a078" }}
            >
              Histórico de mensagens
            </h2>

            <p
              className="text-xs mt-1"
              style={{ color: "#6b5a4e" }}
            >
              Todas as mensagens geradas pelo sistema
            </p>
          </div>

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar paciente..."
            className="rounded-2xl px-4 py-3 text-sm outline-none w-72"
            style={{
              background: "#0e0a0a",
              border: "1px solid rgba(200,160,120,0.12)",
              color: "#e8d5c0",
            }}
          />
        </div>

        {logsFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📭</p>

            <p
              className="text-base"
              style={{ color: "#a89080" }}
            >
              Nenhuma mensagem encontrada
            </p>

            <p
              className="text-sm mt-2"
              style={{ color: "#6b5a4e" }}
            >
              As mensagens enviadas aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(200,160,120,0.05)" }}>
            {logsFiltrados.map((log) => {
              const tipo = tipos.find((t) => t.key === log.tipo);

              return (
                <div
                  key={log.id}
                  className="px-6 py-5 hover:bg-[#151010] transition"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <p
                          className="font-semibold"
                          style={{ color: "#e8d5c0" }}
                        >
                          {log.pacientes?.nome}
                        </p>

                        <span
                          className="text-xs px-3 py-1 rounded-full"
                          style={{
                            background: "rgba(200,160,120,0.1)",
                            color: "#c8a078",
                          }}
                        >
                          {tipo?.emoji} {tipo?.label}
                        </span>

                        <span
                          className="text-xs px-3 py-1 rounded-full"
                          style={{
                            background:
                              log.status === "enviado"
                                ? "rgba(122,232,160,0.1)"
                                : "rgba(232,122,122,0.1)",
                            color:
                              log.status === "enviado"
                                ? "#7ae8a0"
                                : "#e87a7a",
                          }}
                        >
                          {log.status}
                        </span>
                      </div>

                      <p
                        className="text-sm leading-6"
                        style={{ color: "#a89080" }}
                      >
                        {log.mensagem}
                      </p>
                    </div>

                    <div
                      className="text-xs text-right"
                      style={{ color: "#6b5a4e" }}
                    >
                      <p>
                        {new Date(log.criado_em).toLocaleDateString("pt-BR")}
                      </p>

                      <p>
                        {new Date(log.criado_em).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            className="w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
            style={{
              background: "#120d0d",
              border: "1px solid rgba(200,160,120,0.2)",
            }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "#e8d5c0" }}
                >
                  Nova mensagem
                </h2>

                <p
                  className="text-sm mt-1"
                  style={{ color: "#6b5a4e" }}
                >
                  Gere mensagens profissionais para seus pacientes
                </p>
              </div>

              <button
                onClick={() => setModalAberto(false)}
                style={{ color: "#6b5a4e" }}
              >
                ✕
              </button>
            </div>

            {linkGerado ? (
              <div>
                <div
                  className="rounded-3xl p-6 mb-5"
                  style={{
                    background: "rgba(37,211,102,0.08)",
                    border: "1px solid rgba(37,211,102,0.2)",
                  }}
                >
                  <p
                    className="font-semibold mb-3"
                    style={{ color: "#25D366" }}
                  >
                    Mensagem pronta para envio
                  </p>

                  <p
                    className="text-sm leading-7 whitespace-pre-line"
                    style={{ color: "#d8c5b2" }}
                  >
                    {linkGerado.mensagem}
                  </p>
                </div>

                <a
                  href={linkGerado.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 rounded-2xl text-center text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
                  style={{
                    background: "#25D366",
                    color: "white",
                  }}
                >
                  Abrir WhatsApp
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div>
                  <label
                    className="text-xs uppercase tracking-widest block mb-2"
                    style={{ color: "#a89080" }}
                  >
                    Paciente
                  </label>

                  <select
                    value={form.paciente_id}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        paciente_id: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl px-4 py-4 text-sm outline-none"
                    style={{
                      background: "#0e0a0a",
                      border: "1px solid rgba(200,160,120,0.15)",
                      color: "#e8d5c0",
                    }}
                  >
                    <option value="">Selecionar paciente...</option>

                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} - {p.telefone}
                      </option>
                    ))}
                  </select>
                </div>

                {pacienteSelecionado && (
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: "rgba(200,160,120,0.06)",
                      border: "1px solid rgba(200,160,120,0.12)",
                    }}
                  >
                    <p
                      className="text-sm font-semibold mb-1"
                      style={{ color: "#e8d5c0" }}
                    >
                      {pacienteSelecionado.nome}
                    </p>

                    <p
                      className="text-xs"
                      style={{ color: "#6b5a4e" }}
                    >
                      {pacienteSelecionado.telefone}
                    </p>
                  </div>
                )}

                <div>
                  <label
                    className="text-xs uppercase tracking-widest block mb-3"
                    style={{ color: "#a89080" }}
                  >
                    Tipo da mensagem
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tipos.map((t) => (
                      <button
                        key={t.key}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            tipo: t.key,
                          }))
                        }
                        className="rounded-2xl p-4 text-left transition"
                        style={{
                          background:
                            form.tipo === t.key
                              ? "rgba(37,211,102,0.08)"
                              : "#0e0a0a",
                          border:
                            form.tipo === t.key
                              ? "1px solid rgba(37,211,102,0.3)"
                              : "1px solid rgba(200,160,120,0.08)",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{t.emoji}</span>

                          <p
                            className="font-medium"
                            style={{
                              color:
                                form.tipo === t.key
                                  ? "#25D366"
                                  : "#e8d5c0",
                            }}
                          >
                            {t.label}
                          </p>
                        </div>

                        <p
                          className="text-xs"
                          style={{ color: "#6b5a4e" }}
                        >
                          {t.descricao}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    className="text-xs uppercase tracking-widest block mb-2"
                    style={{ color: "#a89080" }}
                  >
                    Mensagem personalizada
                  </label>

                  <textarea
                    value={form.mensagem_custom}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        mensagem_custom: e.target.value,
                      }))
                    }
                    rows={5}
                    placeholder="Digite uma mensagem personalizada ou deixe vazio para usar o modelo automático..."
                    className="w-full rounded-2xl px-4 py-4 text-sm outline-none resize-none"
                    style={{
                      background: "#0e0a0a",
                      border: "1px solid rgba(200,160,120,0.15)",
                      color: "#e8d5c0",
                    }}
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => setModalAberto(false)}
                    className="flex-1 py-4 rounded-2xl text-sm uppercase tracking-widest"
                    style={{
                      border: "1px solid rgba(200,160,120,0.2)",
                      color: "#6b5a4e",
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={enviar}
                    disabled={!form.paciente_id || enviando}
                    className="flex-1 py-4 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                    style={{
                      background:
                        !form.paciente_id
                          ? "rgba(37,211,102,0.3)"
                          : "#25D366",
                      color: "white",
                    }}
                  >
                    {enviando ? "Gerando..." : "Gerar mensagem"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        select option {
          background: #120d0d;
        }

        textarea::placeholder,
        input::placeholder {
          color: #3a2e28;
        }
      `}</style>
    </div>
  );
}