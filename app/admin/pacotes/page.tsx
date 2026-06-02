"use client";

import { useEffect, useState } from "react";

type Paciente = {
  id: string;
  nome: string;
};

type Procedimento = {
  id: string;
  nome: string;
};

type Pacote = {
  id: string;
  nome_pacote: string;
  categoria: string;
  total_sessoes: number;
  status: string;
  pacientes?: {
    nome: string;
  };
  procedimentos?: {
    nome: string;
  };
};

export default function PacotesPage() {
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);

  const [pacienteId, setPacienteId] = useState("");
  const [procedimentoId, setProcedimentoId] = useState("");
  const [nomePacote, setNomePacote] = useState("");
  const [categoria, setCategoria] = useState("Pacote");
  const [sessoes, setSessoes] = useState(10);

  async function carregarDados() {
    try {
      const [pacotesRes, pacientesRes, procedimentosRes] =
        await Promise.all([
          fetch("/api/pacotes"),
          fetch("/api/pacientes"),
          fetch("/api/procedimentos"),
        ]);

      const pacotesData = await pacotesRes.json();
      const pacientesData = await pacientesRes.json();

      const procedimentosJson = await procedimentosRes.json();

      setPacotes(
        Array.isArray(pacotesData)
          ? pacotesData
          : pacotesData.data ?? []
      );

      setPacientes(
        Array.isArray(pacientesData)
          ? pacientesData
          : pacientesData.data ?? []
      );

      setProcedimentos(
        Array.isArray(procedimentosJson)
          ? procedimentosJson
          : procedimentosJson.data ?? []
      );

      console.log("PACIENTES", pacientesData);
      console.log("PROCEDIMENTOS", procedimentosJson);
      console.log("PACOTES", pacotesData);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function criarPacote() {
    if (!pacienteId || !procedimentoId) {
      alert("Selecione paciente e procedimento");
      return;
    }

    const response = await fetch("/api/pacotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paciente_id: pacienteId,
        procedimento_id: procedimentoId,
        total_sessoes: sessoes,
        categoria,
        nome_pacote: nomePacote,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.erro || "Erro ao criar pacote");
      return;
    }

    setNomePacote("");
    setPacienteId("");
    setProcedimentoId("");

    carregarDados();
  }

  const totalPacotes = pacotes.filter(
    (p) => p.categoria === "Pacote"
  ).length;

  const totalGratuitos = pacotes.filter(
    (p) => p.categoria === "Gratuito"
  ).length;

  const totalAvulsos = pacotes.filter(
    (p) => p.categoria === "Avulso"
  ).length;

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Pacotes e Procedimentos
        </h1>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="border rounded-2xl p-5">
          <p>Pacotes</p>
          <h2 className="text-3xl font-bold">
            {totalPacotes}
          </h2>
        </div>

        <div className="border rounded-2xl p-5">
          <p>Gratuitos</p>
          <h2 className="text-3xl font-bold">
            {totalGratuitos}
          </h2>
        </div>

        <div className="border rounded-2xl p-5">
          <p>Avulsos</p>
          <h2 className="text-3xl font-bold">
            {totalAvulsos}
          </h2>
        </div>
      </div>

      <div className="border rounded-3xl p-6 space-y-4">
        <h2 className="font-bold text-xl">
          Novo Pacote
        </h2>

        <input
          value={nomePacote}
          onChange={(e) => setNomePacote(e.target.value)}
          placeholder="Nome do pacote"
          className="w-full border rounded-xl p-3"
        />

        <select
          value={pacienteId}
          onChange={(e) => setPacienteId(e.target.value)}
          className="w-full border rounded-xl p-3"
        >
          <option value="">
            Selecione um paciente
          </option>

          {pacientes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>

        <select
          value={procedimentoId}
          onChange={(e) => setProcedimentoId(e.target.value)}
          className="w-full border rounded-xl p-3"
        >
          <option value="">
            Selecione um procedimento
          </option>

          {procedimentos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full border rounded-xl p-3"
        >
          <option value="Pacote">
            Pacote
          </option>

          <option value="Gratuito">
            Gratuito
          </option>

          <option value="Avulso">
            Avulso
          </option>
        </select>

        <input
          type="number"
          value={sessoes}
          onChange={(e) =>
            setSessoes(Number(e.target.value))
          }
          className="w-full border rounded-xl p-3"
        />

        <button
          onClick={criarPacote}
          className="bg-amber-600 text-white px-5 py-3 rounded-xl"
        >
          Salvar Pacote
        </button>
      </div>

      <div className="grid gap-4">
        {pacotes.map((pacote) => (
          <div
            key={pacote.id}
            className="border rounded-3xl p-6"
          >
            <h2 className="font-bold text-xl">
              {pacote.nome_pacote}
            </h2>

            <p>
              Paciente:
              {" "}
              {pacote.pacientes?.nome}
            </p>

            <p>
              Procedimento:
              {" "}
              {pacote.procedimentos?.nome}
            </p>

            <p>
              Categoria:
              {" "}
              {pacote.categoria}
            </p>

            <p>
              Sessões:
              {" "}
              {pacote.total_sessoes}
            </p>

            <p>
              Status:
              {" "}
              {pacote.status}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}