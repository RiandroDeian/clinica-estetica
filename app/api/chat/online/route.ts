export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function POST() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  await supabaseAdmin
    .from("chat_online")
    .upsert({ funcionario_id: sessao.id, ultimo_ping: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const limite = new Date(Date.now() - 60000).toISOString();
  const { data } = await supabaseAdmin
    .from("chat_online")
    .select("funcionario_id, ultimo_ping, funcionarios(nome, cor)")
    .gte("ultimo_ping", limite);

  return NextResponse.json(data ?? []);
}