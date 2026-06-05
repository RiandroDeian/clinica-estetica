/**
 * Helper para registrar logs de auditoria
 * Use em qualquer API route para registrar alterações
 *
 * Exemplo:
 *   await registrarLog(sessao, "editar", "pacientes", paciente.id, `Editou paciente ${paciente.nome}`);
 */

import { supabaseAdmin } from "@/lib/supabase-admin";

type Sessao = { id: string; nome?: string; email?: string };

export async function registrarLog(
  sessao: Sessao,
  acao: "criar" | "editar" | "excluir" | "acessar" | "login" | "logout",
  tabela: string,
  registro_id?: string,
  descricao?: string,
  dados_antes?: object | null,
  dados_depois?: object | null,
) {
  try {
    await supabaseAdmin.from("audit_logs").insert({
      funcionario_id:   sessao.id,
      funcionario_nome: sessao.nome ?? sessao.email ?? "Sistema",
      acao,
      tabela,
      registro_id:  registro_id  ?? null,
      descricao:    descricao    ?? `${acao} em ${tabela}`,
      dados_antes:  dados_antes  ?? null,
      dados_depois: dados_depois ?? null,
    });
  } catch (e) {
    // Log de auditoria nunca deve quebrar a operação principal
    console.error("Erro ao registrar audit log:", e);
  }
}
