import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET() {
  const sessao = await getSessao();

  if (!sessao) {
    return NextResponse.json(
      { erro: "Não autorizado" },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("pacotes")
    .select(`
      *,
      pacientes(nome),
      procedimentos(nome)
    `)
    .order("comprado_em", {
      ascending: false,
    });

  if (error) {
    return NextResponse.json(
      { erro: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();

  if (!sessao) {
    return NextResponse.json(
      { erro: "Não autorizado" },
      { status: 401 }
    );
  }

  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from("pacotes")
    .insert({
      paciente_id: body.paciente_id,
      procedimento_id: body.procedimento_id,
      total_sessoes: Number(body.total_sessoes),
      sessoes_usadas: 0,
      ativo: true,
      categoria: body.categoria,
      status: "Ativo",
      nome_pacote: body.nome_pacote,
      observacoes: body.observacoes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { erro: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}