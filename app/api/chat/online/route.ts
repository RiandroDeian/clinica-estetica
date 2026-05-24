import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessao } from "@/lib/auth";

export async function GET() {
  const sessao = await getSessao();

  if (!sessao) {
    return NextResponse.json([], { status: 200 });
  }

  const limite = new Date(Date.now() - 1000 * 60 * 5).toISOString();

  const { data, error } = await supabaseAdmin
    .from("chat_online")
    .select("*, funcionarios(nome, cor)")
    .gte("ultima_atividade", limite);

  if (error) {
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST() {
  const sessao = await getSessao();

  if (!sessao) {
    return NextResponse.json(
      { erro: "Nao autorizado" },
      { status: 401 }
    );
  }

  const agora = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("chat_online")
    .upsert({
      funcionario_id: sessao.id,
      ultima_atividade: agora,
    });

  if (error) {
    return NextResponse.json(
      { erro: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}