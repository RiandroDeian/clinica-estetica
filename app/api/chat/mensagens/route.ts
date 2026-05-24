import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessao } from "@/lib/auth";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("chat_mensagens")
    .select("*, funcionarios(nome, cor)")
    .order("criado_em", { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { conteudo } = await request.json();
  if (!conteudo?.trim()) return NextResponse.json({ erro: "Mensagem vazia" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("chat_mensagens")
    .insert({ conteudo: conteudo.trim(), funcionario_id: sessao.id })
    .select("*, funcionarios(nome, cor)")
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}