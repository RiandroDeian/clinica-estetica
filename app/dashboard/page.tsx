"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [ordenacao, setOrdenacao] = useState("recentes");

  useEffect(() => {
    verificarUsuario();
    buscarAgendamentos();
  }, []);

  async function verificarUsuario() {
    const { data } = await supabase.auth.getUser();

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
      .select("*");

    if (error) {
      console.log(error);
    } else {
      setAgendamentos(data || []);
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const agendamentosFiltrados = useMemo(() => {
    let dados = [...agendamentos];

    // BUSCA
    if (busca) {
      dados = dados.filter((item) =>
        item.nome?.toLowerCase().includes(busca.toLowerCase())
      );
    }

    // FILTRO STATUS
    if (filtroStatus !== "todos") {
      dados = dados.filter(
        (item) => item.status === filtroStatus
      );
    }

    // ORDENAÇÃO
    if (ordenacao === "recentes") {
      dados.sort(
        (a, b) =>
          new Date(b.data).getTime() -
          new Date(a.data).getTime()
      );
    }

    if (ordenacao === "antigos") {
      dados.sort(
        (a, b) =>
          new Date(a.data).getTime() -
          new Date(b.data).getTime()
      );
    }

    if (ordenacao === "nome") {
      dados.sort((a, b) =>
        a.nome.localeCompare(b.nome)
      );
    }

    return dados;
  }, [agendamentos, busca, filtroStatus, ordenacao]);

  const hoje = new Date().toISOString().split("T")[0];

  const hojeCount = agendamentos.filter(
    (item) => item.data === hoje
  ).length;

  const confirmados = agendamentos.filter(
    (item) => item.status === "confirmado"
  ).length;

  const pendentes = agendamentos.filter(
    (item) =>
      item.status === "pendente" ||
      !item.status
  ).length;

  const cancelados = agendamentos.filter(
    (item) => item.status === "cancelado"
  ).length;

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#0a0707] text-white p-6">

      <div className="max-w-7xl mx-auto animate-[fade_0.6s_ease]">

        {/* TOPO */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">

          <div>
            <h1
              className="text-4xl md:text-5xl font-bold"
              style={{ color: "#c8a078" }}
            >
              Dashboard Moncie
            </h1>

            <p
              className="mt-2 text-sm"
              style={{ color: "#a89080" }}
            >
              {user.email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-8 py-4 rounded-full text-sm uppercase tracking-widest transition hover:scale-105"
            style={{
              background: "#c8a078",
              color: "#0a0707",
            }}
          >
            Sair
          </button>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">

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

        {/* FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

          {/* BUSCA */}
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

          {/* STATUS */}
          <select
            value={filtroStatus}
            onChange={(e) =>
              setFiltroStatus(e.target.value)
            }
            className="px-5 py-4 rounded-2xl outline-none"
            style={{
              background: "#120d0d",
              border:
                "1px solid rgba(200,160,120,0.15)",
            }}
          >
            <option value="todos">
              Todos Status
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

          {/* ORDENAÇÃO */}
          <select
            value={ordenacao}
            onChange={(e) =>
              setOrdenacao(e.target.value)
            }
            className="px-5 py-4 rounded-2xl outline-none"
            style={{
              background: "#120d0d",
              border:
                "1px solid rgba(200,160,120,0.15)",
            }}
          >
            <option value="recentes">
              Mais Recentes
            </option>

            <option value="antigos">
              Mais Antigos
            </option>

            <option value="nome">
              Ordem Alfabética
            </option>
          </select>
        </div>

        {/* TABELA */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "#120d0d",
            border:
              "1px solid rgba(200,160,120,0.15)",
          }}
        >

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

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
                    Telefone
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
                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <>
                    {[1, 2, 3, 4].map((item) => (
                      <tr key={item}>
                        <td className="p-5">
                          <div className="h-4 rounded bg-neutral-700 animate-pulse"></div>
                        </td>

                        <td className="p-5">
                          <div className="h-4 rounded bg-neutral-700 animate-pulse"></div>
                        </td>

                        <td className="p-5">
                          <div className="h-4 rounded bg-neutral-700 animate-pulse"></div>
                        </td>

                        <td className="p-5">
                          <div className="h-4 rounded bg-neutral-700 animate-pulse"></div>
                        </td>

                        <td className="p-5">
                          <div className="h-4 rounded bg-neutral-700 animate-pulse"></div>
                        </td>

                        <td className="p-5">
                          <div className="h-8 w-24 rounded-full bg-neutral-700 animate-pulse"></div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : (
                  <>
                    {agendamentosFiltrados.map((item) => (
                      <tr
                        key={item.id}
                        className="transition hover:bg-[#1a1414]"
                        style={{
                          borderBottom:
                            "1px solid rgba(200,160,120,0.05)",
                        }}
                      >
                        <td className="p-5">
                          {item.nome}
                        </td>

                        <td className="p-5">
                          {item.telefone}
                        </td>

                        <td className="p-5">
                          {item.procedimento}
                        </td>

                        <td className="p-5">
                          {item.data}
                        </td>

                        <td className="p-5">
                          {item.horario}
                        </td>

                        <td className="p-5">
                          <span
                            className="px-4 py-2 rounded-full text-xs uppercase tracking-widest"
                            style={{
                              background:
                                item.status ===
                                "confirmado"
                                  ? "rgba(34,197,94,0.15)"
                                  : item.status ===
                                    "cancelado"
                                  ? "rgba(239,68,68,0.15)"
                                  : "rgba(234,179,8,0.15)",

                              color:
                                item.status ===
                                "confirmado"
                                  ? "#22c55e"
                                  : item.status ===
                                    "cancelado"
                                  ? "#ef4444"
                                  : "#eab308",
                            }}
                          >
                            {item.status || "pendente"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </>
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
      className="rounded-3xl p-6 transition duration-300 hover:scale-[1.02]"
      style={{
        background: "#120d0d",
        border:
          "1px solid rgba(200,160,120,0.15)",
      }}
    >
      <p style={{ color: "#a89080" }}>
        {titulo}
      </p>

      <h2 className="text-4xl font-bold mt-3">
        {valor}
      </h2>
    </div>
  );
}