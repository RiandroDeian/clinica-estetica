import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");

  let query = supabaseAdmin
    .from("agendamentos")
    .select("*, pacientes(nome, telefone), procedimentos(nome, cor), funcionarios(nome)")
    .order("inicio");

  if (inicio) query = query.gte("inicio", inicio);
  if (fim) query = query.lte("inicio", fim);

  const { data, error } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("agendamentos")
    .insert({ ...body, funcionario_id: body.funcionario_id ?? sessao.id })
    .select("*, pacientes(nome), procedimentos(nome, cor)")
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}