"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const procedimentos = [
  "Botox",
  "Harmonização Facial",
  "Limpeza de Pele",
  "Peeling",
  "Massagem Relaxante",
  "Drenagem Linfática",
  "Harmonização de Glúteo",
];

const horarios = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

type Etapa = "form" | "sucesso";

export default function Agendar() {
  const [etapa, setEtapa] = useState<Etapa>("form");

  const [loading, setLoading] = useState(false);

  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [procedimento, setProcedimento] =
    useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");

  const [horariosOcupados, setHorariosOcupados] =
    useState<string[]>([]);

  function formatarTelefone(valor: string) {
    const nums = valor
      .replace(/\D/g, "")
      .slice(0, 11);

    if (nums.length <= 2) return nums;

    if (nums.length <= 7) {
      return `(${nums.slice(
        0,
        2
      )}) ${nums.slice(2)}`;
    }

    return `(${nums.slice(
      0,
      2
    )}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  }

  const hoje = new Date()
    .toISOString()
    .split("T")[0];

  async function buscarHorariosOcupados(
    dataSelecionada: string
  ) {
    const { data } = await supabase
      .from("agendamentos")
      .select("horario")
      .eq("data", dataSelecionada)
      .neq("status", "cancelado");

    if (data) {
      setHorariosOcupados(
        data.map((item) => item.horario)
      );
    }
  }

  async function handleSubmit() {
    setErro("");

    if (
      !nome ||
      !telefone ||
      !procedimento ||
      !data ||
      !horario
    ) {
      setErro(
        "Por favor, preencha todos os campos."
      );

      return;
    }

    setLoading(true);

    const { data: existente } = await supabase
      .from("agendamentos")
      .select("id")
      .eq("data", data)
      .eq("horario", horario)
      .neq("status", "cancelado")
      .limit(1);

    if (existente && existente.length > 0) {
      setErro(
        "Este horário já está reservado."
      );

      setLoading(false);

      return;
    }

    const { error } = await supabase
      .from("agendamentos")
      .insert([
        {
          nome,
          telefone,
          procedimento,
          data,
          horario,
          status: "pendente",
        },
      ]);

    setLoading(false);

    if (error) {
      setErro(
        "Erro ao realizar agendamento."
      );

      return;
    }

    setEtapa("sucesso");
  }

  if (etapa === "sucesso") {
    return (
      <main className="min-h-screen bg-[#0a0707] text-white flex items-center justify-center p-6">

        <div className="text-center max-w-xl">

          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl"
            style={{
              background:
                "rgba(200,160,120,0.12)",
            }}
          >
            ✓
          </div>

          <p
            className="uppercase tracking-[0.4em] text-xs mb-4"
            style={{ color: "#c8a078" }}
          >
            Agendamento Realizado
          </p>

          <h1 className="text-4xl font-bold mb-6">
            Tudo certo!
          </h1>

          <p
            className="text-lg leading-8"
            style={{ color: "#a89080" }}
          >
            Seu agendamento foi registrado
            para{" "}
            <span
              style={{ color: "#c8a078" }}
            >
              {new Date(
                data + "T12:00:00"
              ).toLocaleDateString("pt-BR")}
            </span>{" "}
            às{" "}
            <span
              style={{ color: "#c8a078" }}
            >
              {horario}
            </span>
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0707] text-white px-6 py-16">

      <div className="max-w-2xl mx-auto">

        <h1 className="text-5xl font-bold mb-4">
          Agendar Procedimento
        </h1>

        <p
          className="mb-10"
          style={{ color: "#a89080" }}
        >
          Preencha os dados abaixo.
        </p>

        <div className="flex flex-col gap-5">

          <input
            type="text"
            placeholder="Nome"
            value={nome}
            onChange={(e) =>
              setNome(e.target.value)
            }
            className="w-full px-5 py-4 rounded-2xl outline-none"
            style={{
              background: "#120d0d",
              border:
                "1px solid rgba(200,160,120,0.15)",
            }}
          />

          <input
            type="tel"
            placeholder="WhatsApp"
            value={telefone}
            onChange={(e) =>
              setTelefone(
                formatarTelefone(
                  e.target.value
                )
              )
            }
            className="w-full px-5 py-4 rounded-2xl outline-none"
            style={{
              background: "#120d0d",
              border:
                "1px solid rgba(200,160,120,0.15)",
            }}
          />

          <select
            value={procedimento}
            onChange={(e) =>
              setProcedimento(
                e.target.value
              )
            }
            className="w-full px-5 py-4 rounded-2xl outline-none"
            style={{
              background: "#120d0d",
              border:
                "1px solid rgba(200,160,120,0.15)",
            }}
          >

            <option value="">
              Escolha um procedimento
            </option>

            {procedimentos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}

          </select>

          <input
            type="date"
            value={data}
            min={hoje}
            onChange={(e) => {
              setData(e.target.value);

              buscarHorariosOcupados(
                e.target.value
              );
            }}
            className="w-full px-5 py-4 rounded-2xl outline-none"
            style={{
              background: "#120d0d",
              border:
                "1px solid rgba(200,160,120,0.15)",
              colorScheme: "dark",
            }}
          />

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">

            {horarios.map((h) => {

              const ocupado =
                horariosOcupados.includes(h);

              return (

                <button
                  key={h}
                  type="button"
                  disabled={ocupado}
                  onClick={() =>
                    setHorario(h)
                  }
                  className="py-3 rounded-2xl text-sm transition hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: ocupado
                      ? "#2a2222"
                      : horario === h
                      ? "#c8a078"
                      : "#120d0d",

                    color: ocupado
                      ? "#666"
                      : horario === h
                      ? "#0a0707"
                      : "#a89080",

                    border:
                      horario === h
                        ? "1px solid #c8a078"
                        : "1px solid rgba(200,160,120,0.15)",
                  }}
                >
                  {ocupado
                    ? "Ocupado"
                    : h}
                </button>

              );
            })}

          </div>

          {erro && (
            <div
              className="p-4 rounded-2xl"
              style={{
                background:
                  "rgba(239,68,68,0.1)",
                color: "#ef4444",
              }}
            >
              {erro}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-5 rounded-full font-bold transition hover:scale-105"
            style={{
              background: "#c8a078",
              color: "#0a0707",
            }}
          >
            {loading
              ? "Agendando..."
              : "Confirmar Agendamento"}
          </button>

        </div>

      </div>

    </main>
  );
}