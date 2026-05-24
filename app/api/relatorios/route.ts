import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") ?? "faturamento";
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");

  if (tipo === "faturamento") {
    let query = supabaseAdmin
      .from("faturamentos")
      .select("*, pacientes(nome), procedimentos(nome), funcionarios(nome)")
      .order("criado_em", { ascending: false });
    if (inicio) query = query.gte("criado_em", inicio);
    if (fim) query = query.lte("criado_em", fim);
    const { data, error } = await query;
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json({ tipo, data: data ?? [] });
  }

  if (tipo === "atendimentos") {
    let query = supabaseAdmin
      .from("agendamentos")
      .select("*, pacientes(nome), procedimentos(nome), funcionarios(nome)")
      .order("inicio", { ascending: false });
    if (inicio) query = query.gte("inicio", inicio);
    if (fim) query = query.lte("inicio", fim);
    const { data, error } = await query;
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json({ tipo, data: data ?? [] });
  }

  if (tipo === "estoque") {
    const { data, error } = await supabaseAdmin.from("estoque").select("*").order("nome");
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json({ tipo, data: data ?? [] });
  }

  if (tipo === "pacientes") {
    const { data, error } = await supabaseAdmin.from("pacientes").select("*").order("nome");
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json({ tipo, data: data ?? [] });
  }

  return NextResponse.json({ erro: "Tipo invalido" }, { status: 400 });
}