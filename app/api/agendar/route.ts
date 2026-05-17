import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json();

  const {
    nome,
    telefone,
    procedimento,
    data,
    horario,
  } = body;

  const { data: existente } = await supabase
    .from("agendamentos")
    .select("id")
    .eq("data", data)
    .eq("horario", horario);

  if (existente && existente.length > 0) {
    return NextResponse.json(
      { error: "Horário ocupado" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("agendamentos")
    .insert([
      {
        nome,
        telefone,
        procedimento,
        data,
        horario,
        status: "pendente",
      },
    ]);

  if (error) {
    return NextResponse.json(
      { error: "Erro ao agendar" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}