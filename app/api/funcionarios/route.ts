import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessao, hashSenha } from "@/lib/auth";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("funcionarios")
    .select("id, nome, email, role, cargo, cor, ativo, criado_em")
    .order("nome");

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao || sessao.role !== "admin") return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { nome, email, senha, role, cargo, cor } = await request.json();
  const senha_hash = await hashSenha(senha);

  const { data, error } = await supabaseAdmin
    .from("funcionarios")
    .insert({ nome, email, senha_hash, role, cargo: cargo ?? role, cor: cor ?? "#c8a078" })
    .select("id, nome, email, role, cargo, cor")
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}