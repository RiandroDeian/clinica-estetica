import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessao } from "@/lib/auth";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("avaliacoes")
    .select("*, pacientes(nome), funcionarios(nome), agendamentos(inicio, procedimentos(nome))")
    .order("criado_em", { ascending: false });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const lista = data ?? [];
  const media = (campo: string) => lista.length > 0
    ? lista.reduce((s: number, a: any) => s + (a[campo] ?? 0), 0) / lista.length : 0;

  return NextResponse.json({
    avaliacoes: lista,
    resumo: {
      total: lista.length,
      media_atendimento: media("nota_atendimento"),
      media_profissional: media("nota_profissional"),
      media_experiencia: media("nota_experiencia"),
      media_ambiente: media("nota_ambiente"),
      media_geral: (media("nota_atendimento") + media("nota_profissional") + media("nota_experiencia") + media("nota_ambiente")) / 4,
    }
  });
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabaseAdmin.from("avaliacoes").insert(body).select().single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}