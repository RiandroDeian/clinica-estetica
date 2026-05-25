import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const canal_id = searchParams.get("canal_id");

  let query = supabaseAdmin
    .from("chat_mensagens")
    .select("*, funcionarios(nome, cor), reply:reply_id(id, conteudo, funcionarios(nome)), chat_reacoes(emoji, funcionario_id)")
    .eq("deletado", false)
    .order("criado_em", { ascending: true })
    .limit(100);

  if (canal_id) {
    query = query.eq("canal_id", canal_id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const body = await request.json();
  if (!body.conteudo?.trim() && !body.arquivo_url) {
    return NextResponse.json({ erro: "Mensagem vazia" }, { status: 400 });
  }

  const canal_id = body.canal_id ?? null;

  const { data, error } = await supabaseAdmin
    .from("chat_mensagens")
    .insert({
      conteudo: body.conteudo?.trim(),
      funcionario_id: sessao.id,
      canal_id,
      reply_id: body.reply_id ?? null,
      mencoes: body.mencoes ?? [],
      arquivo_url: body.arquivo_url ?? null,
      arquivo_nome: body.arquivo_nome ?? null,
      arquivo_tipo: body.arquivo_tipo ?? null,
    })
    .select("*, funcionarios(nome, cor), reply:reply_id(id, conteudo, funcionarios(nome))")
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}