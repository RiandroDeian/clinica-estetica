import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const estoque_id = searchParams.get("estoque_id");

  let query = supabaseAdmin
    .from("estoque_movimentacoes")
    .select("*, estoque(nome, unidade), funcionarios(nome)")
    .order("criado_em", { ascending: false })
    .limit(100);

  if (estoque_id) query = query.eq("estoque_id", estoque_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}