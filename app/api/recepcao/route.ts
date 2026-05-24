import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessao } from "@/lib/auth";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59).toISOString();

  const { data, error } = await supabaseAdmin
    .from("agendamentos")
    .select("*, pacientes(nome, telefone), procedimentos(nome, cor, duracao_minutos), funcionarios(nome, cor)")
    .gte("inicio", inicio)
    .lte("inicio", fim)
    .order("inicio");

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PUT(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { id, status, chegou_em, consultorio } = await request.json();
  const { data, error } = await supabaseAdmin
    .from("agendamentos")
    .update({ status, chegou_em, consultorio })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}