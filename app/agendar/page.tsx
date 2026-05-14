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
  "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

type Etapa = "form" | "sucesso";

export default function Agendar() {
  const [etapa, setEtapa] = useState<Etapa>("form");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [procedimento, setProcedimento] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");

  function formatarTelefone(valor: string) {
    const nums = valor.replace(/\D/g, "").slice(0, 11);
    if (nums.length <= 2) return nums;
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  }

  const hoje = new Date().toISOString().split("T")[0];

  async function handleSubmit() {
    setErro("");

    if (!nome || !telefone || !procedimento || !data || !horario) {
      setErro("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);

    // Verifica se horário já está ocupado
    const { data: existente } = await supabase
      .from("agendamentos")
      .select("id")
      .eq("data", data)
      .eq("horario", horario)
      .neq("status", "cancelado")
      .single();

    if (existente) {
      setErro("Este horário já está reservado. Por favor, escolha outro.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("agendamentos").insert([
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
      setErro("Erro ao realizar agendamento. Tente novamente.");
      return;
    }

    setEtapa("sucesso");
  }

  if (etapa === "sucesso") {
    return (
      <main
        className="min-h-svh bg-[#0a0707] text-white flex items-center justify-center px-6"
        style={{ fontFamily: "Georgia, serif" }}
      >
        <div className="text-center max-w-lg">
          {/* Ícone */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl"
            style={{ background: "rgba(200,160,120,0.12)", border: "1px solid rgba(200,160,120,0.3)" }}
          >
            ✓
          </div>

          <p
            className="uppercase tracking-[0.4em] text-xs mb-4"
            style={{ color: "#c8a078" }}
          >
            Agendamento Realizado
          </p>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Tudo certo, {nome.split(" ")[0]}!
          </h1>

          <p className="text-lg leading-8 mb-4" style={{ color: "#a89080" }}>
            Seu agendamento de{" "}
            <span style={{ color: "#c8a078" }}>{procedimento}</span> foi registrado para{" "}
            <span style={{ color: "#c8a078" }}>
              {new Date(data + "T12:00:00").toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
              })}
            </span>{" "}
            às <span style={{ color: "#c8a078" }}>{horario}</span>.
          </p>

          <p className="text-sm mb-10" style={{ color: "#a89080" }}>
            Em breve nossa equipe entrará em contato para confirmar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/556193578458"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-full text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
              style={{ background: "#c8a078", color: "#0a0707" }}
            >
              Confirmar pelo WhatsApp
            </a>

            <a
              href="/"
              className="px-8 py-4 rounded-full text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
              style={{
                border: "1px solid rgba(200,160,120,0.3)",
                color: "#c8a078",
              }}
            >
              Voltar ao Início
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-svh bg-[#0a0707] text-white px-6 py-16"
      style={{ fontFamily: "Georgia, serif" }}
    >
      {/* Fundo decorativo */}
      <div
        className="fixed w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none"
        style={{
          background: "rgba(200,160,120,0.05)",
          top: "10%",
          right: "-10%",
        }}
      />

      <div className="max-w-2xl mx-auto relative">

        {/* Voltar */}
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm mb-12 transition hover:opacity-70"
          style={{ color: "#a89080" }}
        >
          ← Voltar
        </a>

        {/* Header */}
        <div className="mb-12">
          <p
            className="uppercase tracking-[0.4em] text-xs mb-4"
            style={{ color: "#c8a078" }}
          >
            Clínica Moncie
          </p>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Agendar Procedimento
          </h1>

          <p style={{ color: "#a89080" }}>
            Preencha os dados abaixo e nossa equipe confirmará em breve.
          </p>
        </div>

        {/* Formulário */}
        <div className="flex flex-col gap-5">

          {/* Nome */}
          <div>
            <label
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ color: "#c8a078" }}
            >
              Nome completo
            </label>
            <input
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl outline-none text-white placeholder:text-neutral-600 transition focus:border-[#c8a078]"
              style={{
                background: "#120d0d",
                border: "1px solid rgba(200,160,120,0.15)",
              }}
            />
          </div>

          {/* Telefone */}
          <div>
            <label
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ color: "#c8a078" }}
            >
              WhatsApp
            </label>
            <input
              type="tel"
              placeholder="(61) 99999-9999"
              value={telefone}
              onChange={(e) =>
                setTelefone(formatarTelefone(e.target.value))
              }
              className="w-full px-5 py-4 rounded-2xl outline-none text-white placeholder:text-neutral-600 transition focus:border-[#c8a078]"
              style={{
                background: "#120d0d",
                border: "1px solid rgba(200,160,120,0.15)",
              }}
            />
          </div>

          {/* Procedimento */}
          <div>
            <label
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ color: "#c8a078" }}
            >
              Procedimento
            </label>
            <select
              value={procedimento}
              onChange={(e) => setProcedimento(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl outline-none text-white transition focus:border-[#c8a078]"
              style={{
                background: "#120d0d",
                border: "1px solid rgba(200,160,120,0.15)",
                color: procedimento ? "white" : "#52525b",
              }}
            >
              <option value="" disabled>
                Selecione um procedimento
              </option>
              {procedimentos.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div>
            <label
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ color: "#c8a078" }}
            >
              Data
            </label>
            <input
              type="date"
              value={data}
              min={hoje}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl outline-none text-white transition focus:border-[#c8a078]"
              style={{
                background: "#120d0d",
                border: "1px solid rgba(200,160,120,0.15)",
                colorScheme: "dark",
              }}
            />
          </div>

          {/* Horário */}
          <div>
            <label
              className="block text-xs uppercase tracking-widest mb-3"
              style={{ color: "#c8a078" }}
            >
              Horário
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {horarios.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHorario(h)}
                  className="py-3 rounded-2xl text-sm transition hover:scale-105"
                  style={{
                    background:
                      horario === h
                        ? "#c8a078"
                        : "#120d0d",
                    color:
                      horario === h ? "#0a0707" : "#a89080",
                    border:
                      horario === h
                        ? "1px solid #c8a078"
                        : "1px solid rgba(200,160,120,0.15)",
                    fontWeight: horario === h ? "700" : "400",
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div
              className="px-5 py-4 rounded-2xl text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#ef4444",
              }}
            >
              {erro}
            </div>
          )}

          {/* Botão */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-5 rounded-full uppercase tracking-widest text-sm font-semibold transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            style={{ background: "#c8a078", color: "#0a0707" }}
          >
            {loading ? "Agendando..." : "Confirmar Agendamento"}
          </button>

          <p className="text-center text-xs" style={{ color: "#a89080" }}>
            Após o agendamento, nossa equipe confirmará pelo WhatsApp.
          </p>
        </div>
      </div>
    </main>
  );
}