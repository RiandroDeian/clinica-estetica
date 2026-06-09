export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("pacote_sessoes")
    .select("*, funcionarios(nome)")
    .eq("pacote_id", id)
    .order("criado_em", { ascending: false });
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest, { params }: Params) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await supabaseAdmin.from("pacote_sessoes").insert({
    pacote_id: id,
    paciente_id: body.paciente_id ?? null,
    funcionario_id: sessao.id,
    procedimento_realizado: body.procedimento_realizado,
    observacoes: body.observacoes ?? null,
  }).select().single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}