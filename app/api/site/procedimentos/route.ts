export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("procedimentos")
    .select("id, nome, duracao_minutos, preco")
    .eq("ativo", true)
    .not("mostrar_no_site", "is", false)   // esconde só os marcados como não-exibir
    .order("nome");
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}