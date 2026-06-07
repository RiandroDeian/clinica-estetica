export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const sessao = await getSessao();
    if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

    const body = await request.json();
    const { nome, telefone, procedimento, inicio, fim } = body;

    if (!nome || !telefone || !procedimento || !inicio || !fim) {
      return NextResponse.json({ erro: "Campos obrigatorios faltando" }, { status: 400 });
    }

    const data = new Date(inicio).toISOString().split("T")[0];
    const horario = new Date(inicio).toISOString().split("T")[1].slice(0, 5);

    const { data: novo, error } = await supabaseAdmin
      .from("agendamentos")
      .insert({
        nome,
        telefone,
        procedimento,
        data,
        horario,
        inicio,
        fim,
        status: "pendente",
        nome_temporario: nome,
        telefone_temporario: telefone,
        sem_cadastro: true,
        paciente_id: null,
      })
      .select(`*, pacientes(nome, telefone), procedimentos(nome, cor), funcionarios(nome)`)
      .single();

    if (error) {
      console.error("ERRO AGENDAMENTO RAPIDO:", error);
      return NextResponse.json({ erro: error.message }, { status: 500 });
    }

    return NextResponse.json(novo);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 });
  }
}
