export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";
import { AlertasClient } from "@/components/alerta/AlertasClient";

type PacienteAlerta = {
  id: string;
  nome: string;
  telefone: string;
  alertas: string[];
};

export default async function AlertasPage() {
  const sessao = await getSessao();

  if (!sessao) {
    redirect("/login");
  }

  const { data: pacientes, error } = await supabaseAdmin
    .from("pacientes")
    .select("id, nome, telefone, cpf")
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao buscar pacientes para alertas:", error);

    return (
      <div
        className="rounded-3xl p-6"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
        }}
      >
        <p
          className="text-sm"
          style={{ color: "#e87a7a" }}
        >
          Erro ao carregar os alertas.
        </p>
      </div>
    );
  }

  const pacienteIds = (pacientes ?? [])
    .map((p) => p.id)
    .filter(Boolean);

  /*
   * Busca os agendamentos futuros dos pacientes.
   * Um paciente sem agendamento futuro recebe um alerta.
   */
  let agendamentosFuturos: {
    paciente_id: string;
    inicio: string;
    status: string;
  }[] = [];

  if (pacienteIds.length > 0) {
    const agora = new Date().toISOString();

    const { data } = await supabaseAdmin
      .from("agendamentos")
      .select("paciente_id, inicio, status")
      .in("paciente_id", pacienteIds)
      .gte("inicio", agora)
      .order("inicio", { ascending: true });

    agendamentosFuturos = data ?? [];
  }

  /*
   * Cria um mapa com o próximo agendamento de cada paciente.
   */
  const proximoAgendamento: Record<string, string> = {};

  for (const agendamento of agendamentosFuturos) {
    if (agendamento.status === "cancelado") {
      continue;
    }

    if (!proximoAgendamento[agendamento.paciente_id]) {
      proximoAgendamento[agendamento.paciente_id] =
        agendamento.inicio;
    }
  }

  /*
   * Monta a lista final de alertas.
   */
  const itens: PacienteAlerta[] = [];

  for (const paciente of pacientes ?? []) {
    const alertas: string[] = [];

    /*
     * ALERTA: paciente sem agendamento futuro
     */
    if (!proximoAgendamento[paciente.id]) {
      alertas.push("Paciente sem agendamento futuro");
    }

    /*
     * Aqui você poderá adicionar outros alertas futuramente.
     *
     * Exemplos:
     *
     * alertas.push("Contrato não assinado");
     * alertas.push("Termo não assinado");
     * alertas.push("Pagamento pendente");
     * alertas.push("Anamnese incompleta");
     */

    if (alertas.length > 0) {
      itens.push({
        id: paciente.id,
        nome: paciente.nome ?? "Paciente",
        telefone: paciente.telefone ?? "",
        alertas,
      });
    }
  }

  return <AlertasClient itens={itens} />;
}