export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

// Motivos de perda no ciclo (orçamentos perdidos), ordenado por maior valor perdido.
export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  if (!inicio || !fim) return NextResponse.json({ erro: "inicio e fim obrigatorios" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("orcamentos")
    .select("motivo_perda, valor_final, status")
    .in("status", ["recusado", "expirado"])
    .gte("criado_em", inicio).lt("criado_em", fim);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const mapa: Record<string, { motivo: string; qtd: number; valor: number }> = {};
  for (const o of data ?? []) {
    const motivo = o.motivo_perda?.trim() || (o.status === "expirado" ? "Expirado (validade)" : "Não informado");
    (mapa[motivo] ??= { motivo, qtd: 0, valor: 0 });
    mapa[motivo].qtd += 1;
    mapa[motivo].valor += Number(o.valor_final ?? 0);
  }
  return NextResponse.json(Object.values(mapa).sort((a, b) => b.valor - a.valor));
}
