import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";
import { registrarLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const busca = searchParams.get("busca") ?? "";
  let query = supabaseAdmin.from("pacientes").select("*").order("nome", { ascending: true });
  if (busca) query = query.or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%,cpf.ilike.%${busca}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  try {
    const sessao = await getSessao();
    if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
    const body = await request.json();
    const paciente = {
      nome: body.nome ?? "",
      telefone: body.telefone ?? "",
      email: body.email || null,
      cpf: body.cpf || null,
      sexo: body.sexo || null,
      data_nascimento: body.data_nascimento || null,
      alergias: body.alergias || null,
      contraindicacoes: body.contraindicacoes || null,
      observacoes: body.observacoes || null,
      assinou_termo: body.assinou_termo ?? false,
    };
    const { data, error } = await supabaseAdmin.from("pacientes").insert(paciente).select().single();
    if (error) return NextResponse.json({ erro: error.message, detalhes: error }, { status: 500 });
    await registrarLog(sessao, "criar", "pacientes", data.id, `Criou paciente ${data.nome}`, null, data);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ erro: err?.message ?? "Erro interno" }, { status: 500 });
  }
}
