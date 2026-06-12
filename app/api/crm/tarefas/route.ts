export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const lead_id = searchParams.get("lead_id");
  let query = supabaseAdmin.from("crm_tarefas").select("*").order("data_vencimento", { ascending: true });
  if (lead_id) query = query.eq("lead_id", lead_id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const body = await request.json();
  const { data, error } = await supabaseAdmin.from("crm_tarefas").insert({
    lead_id: body.lead_id, titulo: body.titulo,
    data_vencimento: body.data_vencimento || null,
    concluida: false,
  }).select().single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const body = await request.json();
  const { id, ...updates } = body;
  const { data, error } = await supabaseAdmin.from("crm_tarefas").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const { error } = await supabaseAdmin.from("crm_tarefas").delete().eq("id", id!);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}