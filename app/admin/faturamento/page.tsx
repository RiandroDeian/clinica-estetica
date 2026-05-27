"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

type Registro = {
  id: string;
  valor: number;
  desconto: number;
  valor_final: number;
  forma_pagamento: string;
  status_pagamento: string;
  observacoes?: string;
  criado_em: string;
  pacientes?: { nome: string };
  procedimentos?: { nome: string; cor: string };
  funcionarios?: { nome: string; cor: string };
};

type Resumo = {
  totalBruto: number;
  totalPendente: number;
  ticketMedio: number;
  totalAtendimentos: number;
  porForma: Record<string, number>;
  porProcedimento: { nome: string; total: number }[];
};

type Agendamento = {
  id: string;
  inicio: string;
  pacientes?: { nome: string; telefone?: string };
  procedimentos?: { nome: string; cor: string; preco?: number };
  funcionarios?: { nome: string };
};

type Funcionario = {
  id: string;
  nome: string;
  cor: string;
};

const formas = [
  { key: "dinheiro", label: "Dinheiro", icon: "💵" },
  { key: "pix", label: "PIX", icon: "📱" },
  { key: "debito", label: "Débito", icon: "💳" },
  { key: "credito", label: "Crédito", icon: "💳" },
  { key: "transferencia", label: "Transferência", icon: "🏦" },
];

const statusPag = [
  {
    key: "pago",
    label: "Pago",
    color: "#7ae8a0",
    bg: "rgba(122,232,160,0.12)",
  },
  {
    key: "pendente",
    label: "Pendente",
    color: "#e8c97a",
    bg: "rgba(232,201,122,0.12)",
  },
  {
    key: "cancelado",
    label: "Cancelado",
    color: "#e87a7a",
    bg: "rgba(232,122,122,0.12)",
  },
];

const periodos = [
  { key: "hoje", label: "Hoje" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mês" },
  { key: "custom", label: "Período" },
];

function getPeriodo(key: string) {
  const agora = new Date();

  if (key === "hoje") {
    const i = new Date();
    i.setHours(0, 0, 0, 0);

    const f = new Date();
    f.setHours(23, 59, 59, 999);

    return {
      inicio: i.toISOString(),
      fim: f.toISOString(),
    };
  }

  if (key === "semana") {
    const i = new Date();
    i.setDate(agora.getDate() - agora.getDay());
    i.setHours(0, 0, 0, 0);

    const f = new Date();
    f.setHours(23, 59, 59, 999);

    return {
      inicio: i.toISOString(),
      fim: f.toISOString(),
    };
  }

  if (key === "mes") {
    const i = new Date(agora.getFullYear(), agora.getMonth(), 1);

    const f = new Date();
    f.setHours(23, 59, 59, 999);

    return {
      inicio: i.toISOString(),
      fim: f.toISOString(),
    };
  }

  return null;
}

export default function FaturamentoPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);

  const [carregando, setCarregando] = useState(true);

  const [periodo, setPeriodo] = useState("mes");

  const [customInicio, setCustomInicio] = useState("");
  const [customFim, setCustomFim] = useState("");

  const [modalAberto, setModalAberto] = useState(false);

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

  const [salvando, setSalvando] = useState(false);

  const [buscaAgendamento, setBuscaAgendamento] = useState("");

  const [form, setForm] = useState({
    agendamento_id: "",
    paciente_id: "",
    procedimento_id: "",
    funcionario_id: "",
    valor: "",
    desconto: "0",
    forma_pagamento: "pix",
    status_pagamento: "pago",
    observacoes: "",
  });

  const buscar = useCallback(async () => {
    setCarregando(true);

    let url = "/api/faturamento?";

    if (periodo !== "custom") {
      const p = getPeriodo(periodo);

      if (p) {
        url += `inicio=${p.inicio}&fim=${p.fim}`;
      }
    } else {
      if (customInicio && customFim) {
        url += `inicio=${new Date(
          customInicio
        ).toISOString()}&fim=${new Date(
          customFim + "T23:59:59"
        ).toISOString()}`;
      }
    }

    const res = await fetch(url);
    const data = await res.json();

    setRegistros(data.registros ?? []);
    setResumo(data.resumo ?? null);

    setCarregando(false);
  }, [periodo, customInicio, customFim]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  useEffect(() => {
    const p = getPeriodo("mes");

    fetch(`/api/agendamentos?inicio=${p?.inicio}&fim=${p?.fim}`)
      .then((r) => r.json())
      .then((d) => setAgendamentos(Array.isArray(d) ? d : []));

    fetch("/api/funcionarios")
      .then((r) => r.json())
      .then((d) => setFuncionarios(Array.isArray(d) ? d : []));
  }, []);

  function selecionarAgendamento(id: string) {
    const ag = agendamentos.find((a) => a.id === id);

    if (!ag) return;

    setForm((f) => ({
      ...f,
      agendamento_id: id,
      valor: ag.procedimentos?.preco?.toString() ?? "",
    }));
  }

  async function salvar() {
    setSalvando(true);

    try {
      await fetch("/api/faturamento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      setModalAberto(false);

      setForm({
        agendamento_id: "",
        paciente_id: "",
        procedimento_id: "",
        funcionario_id: "",
        valor: "",
        desconto: "0",
        forma_pagamento: "pix",
        status_pagamento: "pago",
        observacoes: "",
      });

      buscar();
    } finally {
      setSalvando(false);
    }
  }

  const valorFinal = useMemo(() => {
    return Number(form.valor || 0) - Number(form.desconto || 0);
  }, [form.valor, form.desconto]);

  const agendamentosFiltrados = agendamentos.filter((ag) => {
    const txt = buscaAgendamento.toLowerCase();

    return (
      ag.pacientes?.nome?.toLowerCase().includes(txt) ||
      ag.procedimentos?.nome?.toLowerCase().includes(txt)
    );
  });

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p
            className="text-xs uppercase tracking-[0.3em] mb-2"
            style={{ color: "#c8a078" }}
          >
            Financeiro
          </p>

          <h1
            className="text-4xl font-black"
            style={{ color: "#f4e7d7" }}
          >
            Faturamento
          </h1>

          <p
            className="text-sm mt-2"
            style={{ color: "#7d6758" }}
          >
            Controle total de pagamentos da clínica
          </p>
        </div>

        <button
          onClick={() => setModalAberto(true)}
          className="px-6 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition hover:scale-105"
          style={{
            background: "#c8a078",
            color: "#0a0707",
          }}
        >
          + Registrar Pagamento
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {periodos.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriodo(p.key)}
            className="px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition"
            style={{
              background:
                periodo === p.key
                  ? "rgba(200,160,120,0.15)"
                  : "#120d0d",

              color:
                periodo === p.key
                  ? "#c8a078"
                  : "#6b5a4e",

              border: `1px solid ${
                periodo === p.key
                  ? "rgba(200,160,120,0.3)"
                  : "rgba(200,160,120,0.08)"
              }`,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[
            {
              title: "Faturamento Total",
              value: `R$ ${resumo.totalBruto.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}`,
              icon: "💰",
            },

            {
              title: "Pendentes",
              value: `R$ ${resumo.totalPendente.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}`,
              icon: "⏳",
            },

            {
              title: "Ticket Médio",
              value: `R$ ${resumo.ticketMedio.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}`,
              icon: "📈",
            },

            {
              title: "Atendimentos",
              value: resumo.totalAtendimentos,
              icon: "✅",
            },
          ].map((card, i) => (
            <div
              key={i}
              className="rounded-3xl p-6"
              style={{
                background: "#120d0d",
                border: "1px solid rgba(200,160,120,0.12)",
              }}
            >
              <div className="text-3xl mb-4">
                {card.icon}
              </div>

              <p
                className="text-3xl font-black"
                style={{ color: "#c8a078" }}
              >
                {card.value}
              </p>

              <p
                className="text-sm mt-2"
                style={{ color: "#e8d5c0" }}
              >
                {card.title}
              </p>
            </div>
          ))}
        </div>
      )}

      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: "#120d0d",
          border: "1px solid rgba(200,160,120,0.12)",
        }}
      >
        <div
          className="px-6 py-5"
          style={{
            borderBottom: "1px solid rgba(200,160,120,0.08)",
          }}
        >
          <h2
            className="text-xs uppercase tracking-[0.3em]"
            style={{ color: "#c8a078" }}
          >
            Histórico Financeiro
          </h2>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center h-40">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{
                borderColor: "rgba(200,160,120,0.15)",
                borderTopColor: "#c8a078",
              }}
            />
          </div>
        ) : registros.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-5xl mb-4">
              💰
            </p>

            <p style={{ color: "#6b5a4e" }}>
              Nenhum registro encontrado
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    borderBottom:
                      "1px solid rgba(200,160,120,0.08)",
                  }}
                >
                  {[
                    "Paciente",
                    "Procedimento",
                    "Profissional",
                    "Valor",
                    "Forma",
                    "Status",
                    "Data",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-4 text-xs uppercase tracking-widest"
                      style={{ color: "#6b5a4e" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {registros.map((r, i) => {
                  const status = statusPag.find(
                    (s) => s.key === r.status_pagamento
                  );

                  const forma = formas.find(
                    (f) => f.key === r.forma_pagamento
                  );

                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom:
                          i < registros.length - 1
                            ? "1px solid rgba(200,160,120,0.04)"
                            : "none",
                      }}
                    >
                      <td
                        className="px-5 py-4 text-sm"
                        style={{ color: "#f4e7d7" }}
                      >
                        {r.pacientes?.nome ?? "-"}
                      </td>

                      <td
                        className="px-5 py-4 text-sm"
                        style={{ color: "#bda48d" }}
                      >
                        {r.procedimentos?.nome ?? "-"}
                      </td>

                      <td
                        className="px-5 py-4 text-sm"
                        style={{ color: "#bda48d" }}
                      >
                        {r.funcionarios?.nome ?? "-"}
                      </td>

                      <td
                        className="px-5 py-4 text-sm font-bold"
                        style={{ color: "#c8a078" }}
                      >
                        R${" "}
                        {Number(r.valor_final).toLocaleString(
                          "pt-BR",
                          {
                            minimumFractionDigits: 2,
                          }
                        )}
                      </td>

                      <td
                        className="px-5 py-4 text-sm"
                        style={{ color: "#8d7564" }}
                      >
                        {forma?.icon} {forma?.label}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            color: status?.color,
                            background: status?.bg,
                          }}
                        >
                          {status?.label}
                        </span>
                      </td>

                      <td
                        className="px-5 py-4 text-sm"
                        style={{ color: "#6b5a4e" }}
                      >
                        {new Date(r.criado_em).toLocaleDateString(
                          "pt-BR"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            className="w-full max-w-2xl rounded-3xl p-8 max-h-[95vh] overflow-y-auto"
            style={{
              background: "#120d0d",
              border: "1px solid rgba(200,160,120,0.2)",
            }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <p
                  className="text-xs uppercase tracking-[0.3em]"
                  style={{ color: "#c8a078" }}
                >
                  Financeiro
                </p>

                <h2
                  className="text-3xl font-black mt-1"
                  style={{ color: "#f4e7d7" }}
                >
                  Registrar Pagamento
                </h2>
              </div>

              <button
                onClick={() => setModalAberto(false)}
                style={{ color: "#7d6758" }}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <label
                  className="text-xs uppercase tracking-widest block mb-3"
                  style={{ color: "#a89080" }}
                >
                  Buscar Agendamento
                </label>

                <input
                  type="text"
                  value={buscaAgendamento}
                  onChange={(e) =>
                    setBuscaAgendamento(e.target.value)
                  }
                  placeholder="Digite nome do paciente ou procedimento..."
                  className="w-full rounded-2xl px-4 py-4 text-sm outline-none mb-3"
                  style={{
                    background: "#0e0a0a",
                    border:
                      "1px solid rgba(200,160,120,0.15)",
                    color: "#f4e7d7",
                  }}
                />

                <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                  {agendamentosFiltrados.map((ag) => (
                    <button
                      key={ag.id}
                      onClick={() => selecionarAgendamento(ag.id)}
                      className="text-left p-4 rounded-2xl transition hover:scale-[1.01]"
                      style={{
                        background:
                          form.agendamento_id === ag.id
                            ? "rgba(200,160,120,0.12)"
                            : "#0e0a0a",

                        border:
                          form.agendamento_id === ag.id
                            ? "1px solid rgba(200,160,120,0.3)"
                            : "1px solid rgba(200,160,120,0.08)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className="font-semibold"
                            style={{ color: "#f4e7d7" }}
                          >
                            {ag.pacientes?.nome}
                          </p>

                          <p
                            className="text-sm mt-1"
                            style={{ color: "#9e8573" }}
                          >
                            {ag.procedimentos?.nome}
                          </p>
                        </div>

                        <div className="text-right">
                          <p
                            className="text-sm font-bold"
                            style={{ color: "#c8a078" }}
                          >
                            R$ {ag.procedimentos?.preco ?? 0}
                          </p>

                          <p
                            className="text-xs mt-1"
                            style={{ color: "#6b5a4e" }}
                          >
                            {new Date(
                              ag.inicio
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="text-xs uppercase tracking-widest block mb-2"
                    style={{ color: "#a89080" }}
                  >
                    Profissional
                  </label>

                  <select
                    value={form.funcionario_id}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        funcionario_id: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl px-4 py-4 text-sm outline-none"
                    style={{
                      background: "#0e0a0a",
                      border:
                        "1px solid rgba(200,160,120,0.15)",
                      color: "#f4e7d7",
                    }}
                  >
                    <option value="">
                      Selecionar profissional
                    </option>

                    {funcionarios.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="text-xs uppercase tracking-widest block mb-2"
                    style={{ color: "#a89080" }}
                  >
                    Valor
                  </label>

                  <input
                    type="number"
                    value={form.valor}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        valor: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl px-4 py-4 text-sm outline-none"
                    style={{
                      background: "#0e0a0a",
                      border:
                        "1px solid rgba(200,160,120,0.15)",
                      color: "#f4e7d7",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="text-xs uppercase tracking-widest block mb-2"
                    style={{ color: "#a89080" }}
                  >
                    Desconto
                  </label>

                  <input
                    type="number"
                    value={form.desconto}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        desconto: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl px-4 py-4 text-sm outline-none"
                    style={{
                      background: "#0e0a0a",
                      border:
                        "1px solid rgba(200,160,120,0.15)",
                      color: "#f4e7d7",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="text-xs uppercase tracking-widest block mb-2"
                    style={{ color: "#a89080" }}
                  >
                    Total Final
                  </label>

                  <div
                    className="rounded-2xl px-4 py-4 text-xl font-black"
                    style={{
                      background:
                        "rgba(200,160,120,0.08)",
                      border:
                        "1px solid rgba(200,160,120,0.15)",
                      color: "#c8a078",
                    }}
                  >
                    R$ {valorFinal.toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label
                  className="text-xs uppercase tracking-widest block mb-3"
                  style={{ color: "#a89080" }}
                >
                  Forma de Pagamento
                </label>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {formas.map((f) => (
                    <button
                      key={f.key}
                      onClick={() =>
                        setForm((fm) => ({
                          ...fm,
                          forma_pagamento: f.key,
                        }))
                      }
                      className="py-3 rounded-2xl text-xs transition"
                      style={{
                        background:
                          form.forma_pagamento === f.key
                            ? "rgba(200,160,120,0.15)"
                            : "#0e0a0a",

                        color:
                          form.forma_pagamento === f.key
                            ? "#c8a078"
                            : "#6b5a4e",

                        border: `1px solid ${
                          form.forma_pagamento === f.key
                            ? "rgba(200,160,120,0.3)"
                            : "rgba(200,160,120,0.08)"
                        }`,
                      }}
                    >
                      {f.icon} {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  className="text-xs uppercase tracking-widest block mb-3"
                  style={{ color: "#a89080" }}
                >
                  Status do Pagamento
                </label>

                <div className="grid grid-cols-3 gap-3">
                  {statusPag.map((s) => (
                    <button
                      key={s.key}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          status_pagamento: s.key,
                        }))
                      }
                      className="py-3 rounded-2xl text-sm font-bold transition"
                      style={{
                        background:
                          form.status_pagamento === s.key
                            ? s.bg
                            : "#0e0a0a",

                        color: s.color,

                        border: `1px solid ${
                          form.status_pagamento === s.key
                            ? s.color
                            : "rgba(200,160,120,0.08)"
                        }`,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  className="text-xs uppercase tracking-widest block mb-2"
                  style={{ color: "#a89080" }}
                >
                  Observações
                </label>

                <textarea
                  value={form.observacoes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      observacoes: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Ex: cliente pagou metade agora..."
                  className="w-full rounded-2xl px-4 py-4 text-sm outline-none resize-none"
                  style={{
                    background: "#0e0a0a",
                    border:
                      "1px solid rgba(200,160,120,0.15)",
                    color: "#f4e7d7",
                  }}
                />
              </div>

              <button
                onClick={salvar}
                disabled={salvando || !form.valor}
                className="w-full py-4 rounded-2xl text-sm uppercase tracking-widest font-black transition hover:scale-[1.01]"
                style={{
                  background: "#c8a078",
                  color: "#0a0707",
                  opacity: salvando ? 0.7 : 1,
                }}
              >
                {salvando
                  ? "Salvando..."
                  : "Registrar Pagamento"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        select option {
          background: #120d0d;
        }

        input::placeholder,
        textarea::placeholder {
          color: #4e4037;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(200,160,120,0.25);
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
}