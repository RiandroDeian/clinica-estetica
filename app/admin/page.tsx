"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";

export default function Dashboard() {
  const [user, setUser] =
    useState<any>(null);

  const [agendamentos, setAgendamentos] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [busca, setBusca] =
    useState("");

  const [filtroStatus, setFiltroStatus] =
    useState("todos");

  useEffect(() => {
    verificarUsuario();

    buscarAgendamentos();

    const channel = supabase
      .channel("realtime-agendamentos")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agendamentos",
        },
        () => {
          buscarAgendamentos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function verificarUsuario() {
    const { data } =
      await supabase.auth.getUser();

    if (!data.user) {
      window.location.href = "/login";
    } else {
      setUser(data.user);
    }
  }

  async function buscarAgendamentos() {
    setLoading(true);

    const { data, error } = await supabase
      .from("agendamentos")
      .select("*")
      .order("data", {
        ascending: true,
      })
      .order("horario", {
        ascending: true,
      });

    if (!error) {
      setAgendamentos(data || []);
    }

    setLoading(false);
  }

  async function atualizarStatus(
    id: string,
    status: string
  ) {
    await supabase
      .from("agendamentos")
      .update({ status })
      .eq("id", id);

    buscarAgendamentos();
  }

  async function excluirAgendamento(
    id: string
  ) {
    const confirmar = confirm(
      "Deseja realmente excluir?"
    );

    if (!confirmar) return;

    await supabase
      .from("agendamentos")
      .delete()
      .eq("id", id);

    buscarAgendamentos();
  }

  async function logout() {
    await supabase.auth.signOut();

    window.location.href = "/login";
  }

  const agendamentosFiltrados =
    useMemo(() => {
      return agendamentos.filter((item) => {

        const buscaMatch =
          item.nome
            ?.toLowerCase()
            .includes(
              busca.toLowerCase()
            );

        const statusMatch =
          filtroStatus === "todos"
            ? true
            : item.status ===
              filtroStatus;

        return buscaMatch && statusMatch;
      });
    }, [
      agendamentos,
      busca,
      filtroStatus,
    ]);

  const hoje = new Date()
    .toISOString()
    .split("T")[0];

  const hojeCount =
    agendamentos.filter(
      (item) => item.data === hoje
    ).length;

  const confirmados =
    agendamentos.filter(
      (item) =>
        item.status ===
        "confirmado"
    ).length;

  const pendentes =
    agendamentos.filter(
      (item) =>
        item.status ===
          "pendente" ||
        !item.status
    ).length;

  const cancelados =
    agendamentos.filter(
      (item) =>
        item.status ===
        "cancelado"
    ).length;

  const graficoData = [
    {
      name: "Confirmados",
      total: confirmados,
    },

    {
      name: "Pendentes",
      total: pendentes,
    },

    {
      name: "Cancelados",
      total: cancelados,
    },
  ];

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#0a0707] text-white p-6">

      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">

          <div>

            <h1
              className="text-5xl font-bold"
              style={{
                color: "#c8a078",
              }}
            >
              Dashboard Moncie
            </h1>

            <p
              className="mt-2 text-sm"
              style={{
                color: "#a89080",
              }}
            >
              {user.email}
            </p>

          </div>

          <button
            onClick={logout}
            className="px-8 py-4 rounded-full font-bold transition hover:scale-105"
            style={{
              background: "#c8a078",
              color: "#0a0707",
            }}
          >
            Sair
          </button>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">

          <Card
            titulo="Hoje"
            valor={hojeCount}
          />

          <Card
            titulo="Confirmados"
            valor={confirmados}
          />

          <Card
            titulo="Pendentes"
            valor={pendentes}
          />

          <Card
            titulo="Cancelados"
            valor={cancelados}
          />

        </div>

        <div
          className="rounded-3xl p-6 mb-10"
          style={{
            background: "#120d0d",
            border:
              "1px solid rgba(200,160,120,0.15)",
          }}
        >

          <h2 className="text-2xl font-bold mb-6">
            Relatório
          </h2>

          <div className="h-[300px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart data={graficoData}>

                <XAxis dataKey="name" />

                <Tooltip />

                <Bar dataKey="total" />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">

          <input
            type="text"
            placeholder="Buscar cliente..."
            value={busca}
            onChange={(e) =>
              setBusca(e.target.value)
            }
            className="px-5 py-4 rounded-2xl outline-none"
            style={{
              background: "#120d0d",
              border:
                "1px solid rgba(200,160,120,0.15)",
            }}
          />

          <select
            value={filtroStatus}
            onChange={(e) =>
              setFiltroStatus(
                e.target.value
              )
            }
            className="px-5 py-4 rounded-2xl outline-none"
            style={{
              background: "#120d0d",
              border:
                "1px solid rgba(200,160,120,0.15)",
            }}
          >

            <option value="todos">
              Todos
            </option>

            <option value="confirmado">
              Confirmados
            </option>

            <option value="pendente">
              Pendentes
            </option>

            <option value="cancelado">
              Cancelados
            </option>

          </select>

        </div>

        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "#120d0d",
            border:
              "1px solid rgba(200,160,120,0.15)",
          }}
        >

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1000px]">

              <thead>

                <tr
                  style={{
                    borderBottom:
                      "1px solid rgba(200,160,120,0.1)",
                  }}
                >

                  <th className="p-5 text-left">
                    Nome
                  </th>

                  <th className="p-5 text-left">
                    Procedimento
                  </th>

                  <th className="p-5 text-left">
                    Data
                  </th>

                  <th className="p-5 text-left">
                    Horário
                  </th>

                  <th className="p-5 text-left">
                    Status
                  </th>

                  <th className="p-5 text-left">
                    Ações
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan={6}
                      className="p-10 text-center"
                    >
                      Carregando...
                    </td>

                  </tr>

                ) : (

                  agendamentosFiltrados.map(
                    (item) => {

                      const status =
                        item.status ||
                        "pendente";

                      const dataFormatada =
                        new Date(
                          item.data +
                            "T12:00:00"
                        ).toLocaleDateString(
                          "pt-BR"
                        );

                      return (

                        <tr
                          key={item.id}
                          className="hover:bg-[#1a1414]"
                          style={{
                            borderBottom:
                              "1px solid rgba(200,160,120,0.05)",
                          }}
                        >

                          <td className="p-5">
                            {item.nome}
                          </td>

                          <td className="p-5">
                            {
                              item.procedimento
                            }
                          </td>

                          <td className="p-5">
                            {dataFormatada}
                          </td>

                          <td className="p-5">
                            {item.horario}
                          </td>

                          <td className="p-5">

                            <span
                              className="px-4 py-2 rounded-full text-xs font-bold"
                              style={{
                                background:
                                  status ===
                                  "confirmado"
                                    ? "rgba(34,197,94,0.15)"
                                    : status ===
                                      "cancelado"
                                    ? "rgba(239,68,68,0.15)"
                                    : "rgba(234,179,8,0.15)",

                                color:
                                  status ===
                                  "confirmado"
                                    ? "#22c55e"
                                    : status ===
                                      "cancelado"
                                    ? "#ef4444"
                                    : "#eab308",
                              }}
                            >

                              {status ===
                              "confirmado"
                                ? "🟢 Confirmado"
                                : status ===
                                  "cancelado"
                                ? "🔴 Cancelado"
                                : "🟡 Pendente"}

                            </span>

                          </td>

                          <td className="p-5">

                            <div className="flex gap-2 flex-wrap">

                              {status !==
                                "confirmado" && (

                                <button
                                  onClick={() =>
                                    atualizarStatus(
                                      item.id,
                                      "confirmado"
                                    )
                                  }
                                  className="px-4 py-2 rounded-full text-xs font-bold"
                                  style={{
                                    background:
                                      "rgba(34,197,94,0.15)",
                                    color:
                                      "#22c55e",
                                  }}
                                >
                                  Confirmar
                                </button>

                              )}

                              {status !==
                                "cancelado" && (

                                <button
                                  onClick={() =>
                                    atualizarStatus(
                                      item.id,
                                      "cancelado"
                                    )
                                  }
                                  className="px-4 py-2 rounded-full text-xs font-bold"
                                  style={{
                                    background:
                                      "rgba(239,68,68,0.15)",
                                    color:
                                      "#ef4444",
                                  }}
                                >
                                  Cancelar
                                </button>

                              )}

                              <button
                                onClick={() =>
                                  excluirAgendamento(
                                    item.id
                                  )
                                }
                                className="px-4 py-2 rounded-full text-xs font-bold"
                                style={{
                                  background:
                                    "rgba(255,255,255,0.08)",
                                }}
                              >
                                Excluir
                              </button>

                            </div>

                          </td>

                        </tr>

                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </main>
  );
}

function Card({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (

    <div
      className="rounded-3xl p-6"
      style={{
        background: "#120d0d",
        border:
          "1px solid rgba(200,160,120,0.15)",
      }}
    >

      <p
        style={{
          color: "#a89080",
        }}
      >
        {titulo}
      </p>

      <h2 className="text-4xl font-bold mt-3">
        {valor}
      </h2>

    </div>

  );
}