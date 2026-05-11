"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Agendar() {
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [procedimento, setProcedimento] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [agendamentos, setAgendamentos] = useState<any[]>([]);

  const procedimentos = [
    "Botox",
    "Harmonização Facial",
    "Limpeza de Pele",
    "Peeling",
    "Massagem Relaxante",
    "Drenagem Linfática",
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = "/login";
    });
    fetchAgendamentos();
  }, []);

  async function fetchAgendamentos() {
    const { data } = await supabase
      .from("agendamentos")
      .select("*")
      .order("data", { ascending: true });
    if (data) setAgendamentos(data);
  }

  async function handleSalvar() {
    if (!nome || !data || !procedimento) {
      setMessage("Preencha todos os campos!");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("agendamentos")
      .insert([{ nome, data, procedimento }]);
    if (error) setMessage(error.message);
    else {
      setMessage("Agendamento salvo com sucesso!");
      setNome("");
      setData("");
      setProcedimento("");
      fetchAgendamentos();
    }
    setLoading(false);
  }

  async function handleDeletar(id: string) {
    await supabase.from("agendamentos").delete().eq("id", id);
    fetchAgendamentos();
  }

  return (
    <main className="min-h-screen bg-[#0a0707] px-6 py-20">
      <div className="max-w-2xl mx-auto">

        <h1 className="text-4xl font-bold mb-2 text-white">Agendamentos</h1>
        <p className="mb-10 text-sm" style={{ color: "#a89080" }}>
          Moncie Clínica de Estética
        </p>

        {/* FORMULÁRIO */}
        <div
          className="rounded-3xl p-8 mb-10"
          style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)" }}
        >
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Nome do cliente"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-[#1a1212] text-white outline-none"
              style={{ border: "1px solid rgba(200,160,120,0.2)" }}
            />

            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-[#1a1212] text-white outline-none"
              style={{ border: "1px solid rgba(200,160,120,0.2)" }}
            />

            <select
              value={procedimento}
              onChange={(e) => setProcedimento(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-[#1a1212] text-white outline-none"
              style={{ border: "1px solid rgba(200,160,120,0.2)" }}
            >
              <option value="">Selecione o procedimento</option>
              {procedimentos.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <button
              onClick={handleSalvar}
              disabled={loading}
              className="w-full py-4 rounded-xl font-semibold uppercase tracking-widest text-sm transition hover:scale-105"
              style={{ background: "#c8a078", color: "#0a0707" }}
            >
              {loading ? "Salvando..." : "Agendar"}
            </button>

            {message && (
              <p className="text-center text-sm" style={{ color: "#c8a078" }}>
                {message}
              </p>
            )}
          </div>
        </div>

        {/* LISTA */}
        <div className="flex flex-col gap-4">
          {agendamentos.length === 0 && (
            <p className="text-center" style={{ color: "#a89080" }}>
              Nenhum agendamento ainda.
            </p>
          )}
          {agendamentos.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl p-6 flex justify-between items-center"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}
            >
              <div>
                <p className="text-white font-semibold">{a.nome}</p>
                <p className="text-sm" style={{ color: "#a89080" }}>{a.procedimento}</p>
                <p className="text-sm" style={{ color: "#a89080" }}>{a.data}</p>
              </div>
              <button
                onClick={() => handleDeletar(a.id)}
                className="text-sm px-4 py-2 rounded-full transition hover:scale-105"
                style={{ border: "1px solid rgba(200,160,120,0.3)", color: "#c8a078" }}
              >
                Cancelar
              </button>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}