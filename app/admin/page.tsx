"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Admin() {
  const [agendamentos, setAgendamentos] = useState<any[]>([]);

  async function carregar() {
    const { data } = await supabase
      .from("agendamentos")
      .select("*")
      .order("data", { ascending: true });

    if (data) {
      setAgendamentos(data);
    }
  }

  async function atualizarStatus(id: string, status: string) {
    await supabase
      .from("agendamentos")
      .update({ status })
      .eq("id", id);

    carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-10">
        Dashboard Admin
      </h1>

      <div className="flex flex-col gap-6">
        {agendamentos.map((item) => (
          <div
            key={item.id}
            className="border border-neutral-800 p-6 rounded-2xl"
          >
            <h2 className="text-2xl">{item.nome}</h2>

            <p>{item.telefone}</p>
            <p>{item.procedimento}</p>
            <p>{item.data}</p>
            <p>{item.horario}</p>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() =>
                  atualizarStatus(item.id, "confirmado")
                }
                className="bg-green-500 px-4 py-2 rounded"
              >
                Confirmar
              </button>

              <button
                onClick={() =>
                  atualizarStatus(item.id, "cancelado")
                }
                className="bg-red-500 px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}