"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Search, FolderOpen } from "lucide-react";

type ItemAlerta = {
  id: string;
  nome: string;
  telefone: string;
  alertas: string[];
};

export function AlertasClient({ itens }: { itens: ItemAlerta[] }) {
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();

    if (!q) return itens;

    return itens.filter(
      (i) =>
        i.nome.toLowerCase().includes(q) ||
        i.alertas.some((a) => a.toLowerCase().includes(q)),
    );
  }, [itens, busca]);

  return (
    <div className="h-full">
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p
            className="text-xs uppercase tracking-widest mb-1"
            style={{ color: "var(--gold)" }}
          >
            Gestão
          </p>

          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Alertas
          </h1>

          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            Pacientes com alertas ativos.
          </p>
        </div>
      </div>

      {/* CONTADOR */}
      <div
        className="mb-5 flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{
          background: "rgba(232, 122, 122, 0.08)",
          border: "1px solid rgba(232, 122, 122, 0.2)",
        }}
      >
        <AlertTriangle
          className="w-5 h-5"
          style={{ color: "#e87a7a" }}
        />

        <span
          className="text-sm"
          style={{ color: "var(--text-primary)" }}
        >
          <strong>{itens.length}</strong>{" "}
          {itens.length === 1
            ? "paciente com alerta ativo"
            : "pacientes com alerta ativo"}
        </span>
      </div>

      {/* BUSCA */}
      <div className="mb-5 relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "var(--text-muted)" }}
        />

        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por paciente ou alerta..."
          className="w-full rounded-2xl pl-11 pr-5 py-4 text-sm outline-none"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* NENHUM RESULTADO */}
      {filtrados.length === 0 ? (
        <div
          className="text-center py-20 rounded-3xl"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div className="text-4xl mb-4">
            {itens.length === 0 ? "✅" : "🔎"}
          </div>

          <p
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--gold)" }}
          >
            {itens.length === 0
              ? "Nenhum alerta ativo"
              : "Nenhum resultado encontrado"}
          </p>

          <p
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            {itens.length === 0
              ? "Todos os pacientes estão sem alertas."
              : "Tente buscar por outro nome ou alerta."}
          </p>
        </div>
      ) : (
        /* LISTA */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtrados.map((i) => (
            <div
              key={i.id}
              className="rounded-3xl p-5"
              style={{
                background: "var(--bg-card)",
                border: "1px solid rgba(232, 122, 122, 0.2)",
              }}
            >
              {/* PACIENTE */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                      background: "rgba(232, 122, 122, 0.1)",
                      color: "#e87a7a",
                    }}
                  >
                    {i.nome.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p
                      className="font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {i.nome}
                    </p>

                    {i.telefone && (
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {i.telefone}
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  href={`/admin/prontuario/${i.id}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition hover:opacity-70 flex-shrink-0"
                  style={{
                    background: "var(--gold-bg)",
                    color: "var(--gold)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Prontuário
                </Link>
              </div>

              {/* ALERTAS */}
              <div className="mt-4 flex flex-col gap-2">
                {i.alertas.map((alerta, index) => (
                  <div
                    key={`${i.id}-${index}`}
                    className="flex items-start gap-2 rounded-2xl px-3 py-2.5"
                    style={{
                      background: "rgba(232, 122, 122, 0.08)",
                      border: "1px solid rgba(232, 122, 122, 0.15)",
                    }}
                  >
                    <AlertTriangle
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: "#e87a7a" }}
                    />

                    <span
                      className="text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {alerta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}