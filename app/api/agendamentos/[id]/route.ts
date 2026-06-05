import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";
import { registrarLog } from "@/lib/audit";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const { data: antes } = await supabaseAdmin.from("agendamentos").select("*, pacientes(nome)").eq("id", id).single();
  const { data, error } = await supabaseAdmin.from("agendamentos").update(body).eq("id", id)
    .select("*, pacientes(nome), procedimentos(nome, cor)").single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  await registrarLog(sessao, "editar", "agendamentos", id,
    `Editou agendamento de ${(antes as any)?.pacientes?.nome ?? id} — status: ${body.status ?? "atualizado"}`,
    antes, data);
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { id } = await params;
  const { data: antes } = await supabaseAdmin.from("agendamentos").select("*, pacientes(nome)").eq("id", id).single();
  const { error } = await supabaseAdmin.from("agendamentos").delete().eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  await registrarLog(sessao, "excluir", "agendamentos", id,
    `Excluiu agendamento de ${(antes as any)?.pacientes?.nome ?? id}`, antes, null);
  return NextResponse.json({ ok: true });
}