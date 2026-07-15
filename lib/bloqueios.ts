import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Verifica se um intervalo [inicio, fim] cai dentro de um bloqueio de agenda.
 * Um bloqueio conflita quando:
 *   - o período do bloqueio sobrepõe o do agendamento, E
 *   - o bloqueio é geral (sem profissional) OU é do mesmo profissional do agendamento.
 * Retorna o bloqueio conflitante (ou null).
 */
export async function bloqueioConflitante(
  inicio: string,
  fim: string,
  funcionario_id?: string | null,
) {
  if (!inicio || !fim) return null;

  const { data } = await supabaseAdmin
    .from("agenda_bloqueios")
    .select("*, funcionarios(nome)")
    .lt("data_inicio", fim)   // bloqueio começa antes do fim do agendamento
    .gt("data_fim", inicio);  // bloqueio termina depois do início do agendamento

  const conflito = (data ?? []).find((b: any) =>
    !b.funcionario_id || (funcionario_id && b.funcionario_id === funcionario_id),
  );

  return conflito ?? null;
}

/** Mensagem amigável para retornar quando o horário está bloqueado. */
export function mensagemBloqueio(bloqueio: any) {
  const motivo = bloqueio?.motivo ? ` (${bloqueio.motivo})` : "";
  const prof = bloqueio?.funcionarios?.nome ? ` — ${bloqueio.funcionarios.nome}` : "";
  return `Horário bloqueado${motivo}${prof}. Escolha outro horário.`;
}
