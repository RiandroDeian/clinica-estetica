"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Paciente = {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
  sexo?: string;
  data_nascimento?: string;
  assinou_termo: boolean;
  criado_em: string;
};

export default function PacientesPage() {
  const router = useRouter();

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // ✅ ADIÇÃO 1: estado para controlar edição
  const [editando, setEditando] = useState<Paciente | null>(null);

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    cpf: "",
    sexo: "",
    data_nascimento: "",
    alergias: "",
    contraindicacoes: "",
    observacoes: "",
    assinou_termo: false,
  });

  const buscarPacientes = useCallback(async () => {
    setCarregando(true);

    const res = await fetch(
      `/api/pacientes?busca=${encodeURIComponent(busca)}`
    );

    const data = await res.json();

    setPacientes(Array.isArray(data) ? data : []);

    setCarregando(false);
  }, [busca]);

  useEffect(() => {
    const timer = setTimeout(buscarPacientes, 300);

    return () => clearTimeout(timer);
  }, [buscarPacientes]);

  function calcularIdade(data?: string) {
    if (!data) return "-";

    const hoje = new Date();
    const nasc = new Date(data);

    let idade = hoje.getFullYear() - nasc.getFullYear();

    const m = hoje.getMonth() - nasc.getMonth();

    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }

    return `${idade} anos`;
  }

  // ✅ ADIÇÃO 2: funções de abrir novo e abrir edição
  function abrirNovo() {
    setEditando(null);
    setForm({
      nome: "",
      telefone: "",
      email: "",
      cpf: "",
      sexo: "",
      data_nascimento: "",
      alergias: "",
      contraindicacoes: "",
      observacoes: "",
      assinou_termo: false,
    });
    setModalAberto(true);
  }

  function abrirEdicao(p: Paciente, e: React.MouseEvent) {
    e.stopPropagation();
    setEditando(p);
    setForm({
      nome: p.nome,
      telefone: p.telefone,
      email: p.email ?? "",
      cpf: p.cpf ?? "",
      sexo: p.sexo ?? "",
      data_nascimento: p.data_nascimento ?? "",
      alergias: (p as any).alergias ?? "",
      contraindicacoes: (p as any).contraindicacoes ?? "",
      observacoes: (p as any).observacoes ?? "",
      assinou_termo: p.assinou_termo,
    });
    setModalAberto(true);
  }

  async function salvarPaciente() {
    setSalvando(true);

    // ✅ ADIÇÃO 3: POST para novo, PATCH para edição
    const method = editando ? "PATCH" : "POST";
    const url = editando ? `/api/pacientes/${editando.id}` : "/api/pacientes";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setModalAberto(false);
      setEditando(null);

      setForm({
        nome: "",
        telefone: "",
        email: "",
        cpf: "",
        sexo: "",
        data_nascimento: "",
        alergias: "",
        contraindicacoes: "",
        observacoes: "",
        assinou_termo: false,
      });

      buscarPacientes();
    }

    setSalvando(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p
            className="text-xs uppercase tracking-widest mb-1"
            style={{ color: "#c8a078" }}
          >
            Gestão
          </p>

          <h1
            className="text-3xl font-bold"
            style={{ color: "#f5e8dc" }}
          >
            Pacientes
          </h1>
        </div>

        {/* ✅ botão chama abrirNovo() em vez de setModalAberto(true) */}
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{
            background: "#c8a078",
            color: "#0f0b0b",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-4 h-4"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              d="M12 5v14M5 12h14"
              strokeLinecap="round"
            />
          </svg>

          Novo Paciente
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2"
            stroke="currentColor"
            strokeWidth={1.5}
            style={{ color: "#6b5a4e" }}
          >
            <circle cx="11" cy="11" r="8" />
            <path
              d="M21 21l-4.35-4.35"
              strokeLinecap="round"
            />
          </svg>

          <input
            type="text"
            placeholder="Buscar por nome, telefone ou CPF..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-2xl pl-11 pr-5 py-4 text-sm outline-none"
            style={{
              background: "#161111",
              border: "1px solid rgba(200,160,120,0.15)",
              color: "#f5e8dc",
              caretColor: "#c8a078",
            }}
          />
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center h-48">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{
              borderColor: "rgba(200,160,120,0.2)",
              borderTopColor: "#c8a078",
            }}
          />
        </div>
      ) : pacientes.length === 0 ? (
        <div
          className="text-center py-20 rounded-3xl"
          style={{
            background: "#161111",
            border: "1px solid rgba(200,160,120,0.1)",
          }}
        >
          <p className="text-4xl mb-4">👥</p>

          <p
            className="text-lg font-semibold mb-2"
            style={{ color: "#c8a078" }}
          >
            Nenhum paciente encontrado
          </p>

          <p
            className="text-sm"
            style={{ color: "#6b5a4e" }}
          >
            Cadastre o primeiro paciente clicando em Novo Paciente
          </p>
        </div>
      ) : (
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "#161111",
            border: "1px solid rgba(200,160,120,0.12)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    borderBottom:
                      "1px solid rgba(200,160,120,0.1)",
                  }}
                >
                  {[
                    "Nome",
                    "Telefone",
                    "CPF",
                    "Sexo",
                    "Idade",
                    "Nascimento",
                    "Termo",
                    "Cadastro",
                    "",
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
                {pacientes.map((p, i) => (
                  <tr
                    key={p.id}
                    className="transition hover:bg-[rgba(200,160,120,0.04)] cursor-pointer"
                    style={{
                      borderBottom:
                        i < pacientes.length - 1
                          ? "1px solid rgba(200,160,120,0.06)"
                          : "none",
                    }}
                    onClick={() =>
                      router.push(`/admin/pacientes/${p.id}`)
                    }
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            background:
                              "rgba(200,160,120,0.12)",
                            color: "#c8a078",
                          }}
                        >
                          {p.nome.charAt(0).toUpperCase()}
                        </div>

                        <span
                          className="text-sm font-medium"
                          style={{ color: "#f5e8dc" }}
                        >
                          {p.nome}
                        </span>
                      </div>
                    </td>

                    <td
                      className="px-5 py-4 text-sm"
                      style={{ color: "#a89080" }}
                    >
                      {p.telefone}
                    </td>

                    <td
                      className="px-5 py-4 text-sm"
                      style={{ color: "#6b5a4e" }}
                    >
                      {p.cpf ?? "-"}
                    </td>

                    <td
                      className="px-5 py-4 text-sm"
                      style={{ color: "#a89080" }}
                    >
                      {p.sexo || "-"}
                    </td>

                    <td
                      className="px-5 py-4 text-sm font-medium"
                      style={{ color: "#c8a078" }}
                    >
                      {calcularIdade(p.data_nascimento)}
                    </td>

                    <td
                      className="px-5 py-4 text-sm"
                      style={{ color: "#6b5a4e" }}
                    >
                      {p.data_nascimento
                        ? new Date(
                            p.data_nascimento
                          ).toLocaleDateString("pt-BR")
                        : "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          background: p.assinou_termo
                            ? "rgba(122,232,160,0.1)"
                            : "rgba(232,122,122,0.1)",
                          color: p.assinou_termo
                            ? "#7ae8a0"
                            : "#e87a7a",
                        }}
                      >
                        {p.assinou_termo ? "Sim" : "Não"}
                      </span>
                    </td>

                    <td
                      className="px-5 py-4 text-sm"
                      style={{ color: "#6b5a4e" }}
                    >
                      {new Date(
                        p.criado_em
                      ).toLocaleDateString("pt-BR")}
                    </td>

                    {/* ✅ ADIÇÃO: botão editar substituindo a seta */}
                    <td className="px-5 py-4">
                      <button
                        onClick={(e) => abrirEdicao(p, e)}
                        className="p-1.5 rounded-lg transition hover:opacity-70"
                        style={{ background: "rgba(200,160,120,0.1)" }}
                        title="Editar paciente"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="w-4 h-4"
                          stroke="#c8a078"
                          strokeWidth={1.5}
                        >
                          <path
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            className="w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
            style={{
              background: "#161111",
              border: "1px solid rgba(200,160,120,0.2)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              {/* ✅ título dinâmico */}
              <h2
                className="text-xl font-bold"
                style={{ color: "#c8a078" }}
              >
                {editando ? "Editar Paciente" : "Novo Paciente"}
              </h2>

              <button
                onClick={() => setModalAberto(false)}
                style={{ color: "#6b5a4e" }}
                className="transition hover:opacity-70"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-6 h-6"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  label: "Nome completo*",
                  key: "nome",
                  type: "text",
                  col: 2,
                },

                {
                  label: "Telefone*",
                  key: "telefone",
                  type: "tel",
                  col: 1,
                },

                {
                  label: "Email",
                  key: "email",
                  type: "email",
                  col: 1,
                },

                {
                  label: "CPF",
                  key: "cpf",
                  type: "text",
                  col: 1,
                },

                {
                  label: "Sexo",
                  key: "sexo",
                  type: "select",
                  col: 1,
                },

                {
                  label: "Data de nascimento",
                  key: "data_nascimento",
                  type: "date",
                  col: 1,
                },

                {
                  label: "Alergias",
                  key: "alergias",
                  type: "text",
                  col: 2,
                },

                {
                  label: "Contraindicações",
                  key: "contraindicacoes",
                  type: "text",
                  col: 2,
                },

                {
                  label: "Observações",
                  key: "observacoes",
                  type: "text",
                  col: 2,
                },
              ].map((field) => (
                <div
                  key={field.key}
                  className={
                    field.col === 2
                      ? "sm:col-span-2"
                      : ""
                  }
                >
                  <label
                    className="text-xs uppercase tracking-widest block mb-2"
                    style={{ color: "#a89080" }}
                  >
                    {field.label}
                  </label>

                  {field.type === "select" ? (
                    <select
                      value={(form as any)[field.key]}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{
                        background: "#0e0a0a",
                        border:
                          "1px solid rgba(200,160,120,0.15)",
                        color: "#f5e8dc",
                      }}
                    >
                      <option value="">Selecionar</option>
                      <option value="Feminino">
                        Feminino
                      </option>
                      <option value="Masculino">
                        Masculino
                      </option>
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={(form as any)[field.key]}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{
                        background: "#0e0a0a",
                        border:
                          "1px solid rgba(200,160,120,0.15)",
                        color: "#f5e8dc",
                      }}
                    />
                  )}
                </div>
              ))}

              <div className="sm:col-span-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      assinou_termo: !f.assinou_termo,
                    }))
                  }
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition"
                  style={{
                    background: form.assinou_termo
                      ? "#c8a078"
                      : "transparent",
                    border:
                      "1px solid rgba(200,160,120,0.4)",
                  }}
                >
                  {form.assinou_termo && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="w-4 h-4"
                      stroke="#0f0b0b"
                      strokeWidth={2.5}
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>

                <span
                  className="text-sm"
                  style={{ color: "#a89080" }}
                >
                  Assinou o termo de consentimento
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalAberto(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{
                  border:
                    "1px solid rgba(200,160,120,0.2)",
                  color: "#6b5a4e",
                }}
              >
                Cancelar
              </button>

              <button
                onClick={salvarPaciente}
                disabled={
                  salvando ||
                  !form.nome ||
                  !form.telefone
                }
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{
                  background:
                    salvando ||
                    !form.nome ||
                    !form.telefone
                      ? "rgba(200,160,120,0.4)"
                      : "#c8a078",
                  color: "#0f0b0b",
                }}
              >
                {/* ✅ texto dinâmico no botão */}
                {salvando
                  ? "Salvando..."
                  : editando
                  ? "Salvar Alterações"
                  : "Salvar Paciente"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        input::placeholder {
          color: #3a2e28;
        }

        select option {
          background: #161111;
        }
      `}</style>
    </div>
  );
}