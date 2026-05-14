"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
      } else {
        setUser(data.user);
      }
    });

    buscarAgendamentos();
  }, []);

  async function buscarAgendamentos() {
    const { data, error } = await supabase
      .from("agendamentos")
      .select("*")
      .order("data", { ascending: true });

    if (error) {
      console.log(error);
    } else {
      setAgendamentos(data || []);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#0a0707] text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* TOPO */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
          <div>
            <h1
              className="text-4xl md:text-5xl font-bold"
              style={{ color: "#c8a078" }}
            >
              Dashboard Moncie
            </h1>

            <p className="mt-2 text-sm" style={{ color: "#a89080" }}>
              {user.email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-8 py-4 rounded-full text-sm uppercase tracking-widest transition hover:scale-105"
            style={{ background: "#c8a078", color: "#0a0707" }}
          >
            Sair
          </button>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">

          <div
            className="rounded-3xl p-6"
            style={{
              background: "#120d0d",
              border: "1px solid rgba(200,160,120,0.15)",
            }}
          >
            <p style={{ color: "#a89080" }}>
              Total de Agendamentos
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {agendamentos.length}
            </h2>
          </div>

          <div
            className="rounded-3xl p-6"
            style={{
              background: "#120d0d",
              border: "1px solid rgba(200,160,120,0.15)",
            }}
          >
            <p style={{ color: "#a89080" }}>
              Hoje
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {
                agendamentos.filter(
                  (item) =>
                    item.data ===
                    new Date().toISOString().split("T")[0]
                ).length
              }
            </h2>
          </div>

          <div
            className="rounded-3xl p-6"
            style={{
              background: "#120d0d",
              border: "1px solid rgba(200,160,120,0.15)",
            }}
          >
            <p style={{ color: "#a89080" }}>
              Confirmados
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {
                agendamentos.filter(
                  (item) => item.status === "confirmado"
                ).length
              }
            </h2>
          </div>

          <div
            className="rounded-3xl p-6"
            style={{
              background: "#120d0d",
              border: "1px solid rgba(200,160,120,0.15)",
            }}
          >
            <p style={{ color: "#a89080" }}>
              Pendentes
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {
                agendamentos.filter(
                  (item) => item.status !== "confirmado"
                ).length
              }
            </h2>
          </div>
        </div>

        {/* TABELA */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "#120d0d",
            border: "1px solid rgba(200,160,120,0.15)",
          }}
        >
          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px]">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(200,160,120,0.1)",
                  }}
                >
                  <th className="p-5 text-left">Nome</th>
                  <th className="p-5 text-left">Telefone</th>
                  <th className="p-5 text-left">Procedimento</th>
                  <th className="p-5 text-left">Data</th>
                  <th className="p-5 text-left">Horário</th>
                  <th className="p-5 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {agendamentos.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom:
                        "1px solid rgba(200,160,120,0.05)",
                    }}
                  >
                    <td className="p-5">{item.nome}</td>

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
                            item.status === "confirmado"
                              ? "rgba(34,197,94,0.15)"
                              : "rgba(234,179,8,0.15)",

                          color:
                            item.status === "confirmado"
                              ? "#22c55e"
                              : "#eab308",
                        }}
                      >
                        {item.status || "pendente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        </div>

      </div>
    </main>
  );
}