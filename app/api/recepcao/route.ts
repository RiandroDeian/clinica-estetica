export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  // Fuso Brasilia UTC-3
  const hoje = new Date();
  const inicioHoje = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 3, 0, 0));
  const fimHoje    = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1, 2, 59, 59));

  const { data, error } = await supabaseAdmin
    .from("agendamentos")
    .select("*, pacientes(id, nome, telefone, alergias, contraindicacoes, observacoes, data_nascimento), procedimentos(nome, cor, duracao_minutos), funcionarios(nome, cor)")
    .gte("inicio", inicioHoje.toISOString())
    .lte("inicio", fimHoje.toISOString())
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
