export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { data, error } = await supabaseAdmin.from("crm_historico")
    .select("*, crm_leads(nome), coluna_origem:crm_colunas!crm_historico_coluna_origem_id_fkey(nome), coluna_destino:crm_colunas!crm_historico_coluna_destino_id_fkey(nome), funcionarios(nome)")
    .order("criado_em", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}