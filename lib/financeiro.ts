import { supabaseAdmin } from "@/lib/supabase-admin";

/** Soma o custo dos materiais de um procedimento (quantidade × valor unitário). */
export function custoMateriaisTotal(custo_materiais: unknown): number {
  if (!Array.isArray(custo_materiais)) return 0;
  return custo_materiais.reduce(
    (s: number, m: any) => s + (Number(m.quantidade) || 0) * (Number(m.valor) || 0),
    0,
  );
}

/**
 * Calcula o repasse ao profissional e o custo de material de um pagamento,
 * a partir do procedimento (repasse_percentual e custo_materiais) e do valor final.
 */
export async function repasseECusto(
  procedimento_id: string | null | undefined,
  valorFinal: number,
): Promise<{ repasse_valor: number; custo_total: number }> {
  if (!procedimento_id) return { repasse_valor: 0, custo_total: 0 };
  const { data: proc } = await supabaseAdmin
    .from("procedimentos")
    .select("repasse_percentual, custo_materiais")
    .eq("id", procedimento_id)
    .single();
  const perc = Number(proc?.repasse_percentual ?? 0);
  const custo_total = custoMateriaisTotal(proc?.custo_materiais);
  const repasse_valor = (Number(valorFinal) || 0) * perc / 100;
  return { repasse_valor, custo_total };
}
