export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  if (body.acao === "editar") {
    const { error } = await supabaseAdmin.from("chat_mensagens")
      .update({ conteudo: body.conteudo, editado: true })
      .eq("id", id).eq("funcionario_id", sessao.id);
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.acao === "deletar") {
    const { error } = await supabaseAdmin.from("chat_mensagens")
      .update({ deletado: true, conteudo: "Mensagem apagada" })
      .eq("id", id).eq("funcionario_id", sessao.id);
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.acao === "reagir") {
    const { data: existente } = await supabaseAdmin.from("chat_reacoes")
      .select("id").eq("mensagem_id", id).eq("funcionario_id", sessao.id).eq("emoji", body.emoji).single();
    if (existente) {
      await supabaseAdmin.from("chat_reacoes").delete().eq("id", existente.id);
    } else {
      await supabaseAdmin.from("chat_reacoes").insert({ mensagem_id: id, funcionario_id: sessao.id, emoji: body.emoji });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.acao === "fixar") {
    const { data: msg } = await supabaseAdmin.from("chat_mensagens").select("fixada").eq("id", id).single();
    await supabaseAdmin.from("chat_mensagens").update({ fixada: !msg?.fixada }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (body.acao === "lido") {
    await supabaseAdmin.from("chat_mensagens")
      .update({ lido_por: supabaseAdmin.rpc("array_append_unique", { arr: "lido_por", val: sessao.id }) })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ erro: "Acao invalida" }, { status: 400 });
}