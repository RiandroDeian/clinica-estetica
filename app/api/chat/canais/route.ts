import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from("chat_canais")
    .select("*")
    .order("criado_em", { ascending: true });
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { nome, descricao } = await request.json();
  if (!nome?.trim()) return NextResponse.json({ erro: "Nome obrigatorio" }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("chat_canais")
    .insert({ nome: nome.trim().toLowerCase().replace(/\s+/g, "-"), descricao: descricao ?? null })
    .select()
    .single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}
