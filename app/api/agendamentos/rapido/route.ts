export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nome, telefone, procedimento, inicio, fim,
      // campos vindos da page /agendar
      nome_temporario, telefone_temporario, procedimento_nome,
      sem_cadastro, status, funcionario_id, observacoes,
    } = body;

    // Aceita tanto os campos do modal interno quanto os da page pública
    const nomeReal       = nome_temporario ?? nome;
    const telefoneReal   = telefone_temporario ?? telefone;
    const procedimentoReal = procedimento_nome ?? procedimento;

    if (!nomeReal || !telefoneReal || !procedimentoReal || !inicio || !fim) {
      return NextResponse.json({ erro: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const data    = new Date(inicio).toISOString().split("T")[0];
    const horario = new Date(inicio).toISOString().split("T")[1].slice(0, 5);

    const { data: novo, error } = await supabaseAdmin
      .from("agendamentos")
      .insert({
        nome:               nomeReal,
        telefone:           telefoneReal,
        procedimento:       procedimentoReal,
        data,
        horario,
        inicio,
        fim,
        status:             status ?? "pendente",
        nome_temporario:    nomeReal,
        telefone_temporario: telefoneReal,
        sem_cadastro:       sem_cadastro ?? true,
        paciente_id:        null,
        funcionario_id:     funcionario_id ?? null,
        observacoes:        observacoes ?? null,
      })
      .select("*, pacientes(nome, telefone), procedimentos(nome, cor), funcionarios(nome)")
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