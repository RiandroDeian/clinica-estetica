import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const sessao = await getSessao();

    if (!sessao) {
      return NextResponse.json(
        { erro: "Nao autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const inicio = searchParams.get("inicio");
    const fim = searchParams.get("fim");

    let query = supabaseAdmin
      .from("agendamentos")
      .select(`
        *,
        pacientes(nome, telefone),
        procedimentos(nome, cor),
        funcionarios(nome)
      `)
      .order("inicio", { ascending: true });

    if (inicio) {
      query = query.gte("inicio", inicio);
    }

    if (fim) {
      query = query.lte("inicio", fim);
    }

    const { data, error } = await query;

    if (error) {
      console.error("ERRO AO BUSCAR AGENDAMENTOS:", error);

      return NextResponse.json(
        { erro: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { erro: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessao = await getSessao();

    if (!sessao) {
      return NextResponse.json(
        { erro: "Nao autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();

    console.log("BODY RECEBIDO:", body);

    const novoAgendamento = {
      paciente_id: body.paciente_id,
      procedimento_id: body.procedimento_id,
      funcionario_id: body.funcionario_id,
      inicio: body.inicio,
      fim: body.fim,
      status: body.status || "confirmado",
      observacoes: body.observacoes || "",
    };

    const { data, error } = await supabaseAdmin
      .from("agendamentos")
      .insert(novoAgendamento)
      .select(`
        *,
        pacientes(nome, telefone),
        procedimentos(nome, cor),
        funcionarios(nome)
      `)
      .single();

    if (error) {
      console.error("ERRO AO SALVAR:", error);

      return NextResponse.json(
        { erro: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { erro: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}