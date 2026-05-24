import { NextResponse } from "next/server";
import { getSessao } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json(null, { status: 401 });

  const { data } = await supabaseAdmin
    .from("funcionarios")
    .select("id, nome, email, role, cargo, cor")
    .eq("id", sessao.id)
    .single();

  return NextResponse.json({ ...sessao, cargo: data?.cargo ?? sessao.role, cor: data?.cor });
}