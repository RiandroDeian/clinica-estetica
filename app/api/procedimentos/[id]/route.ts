import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await supabaseAdmin.from("procedimentos").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getSessao();
  if (!sessao || sessao.role !== "admin") return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { id } = await params;
  const { error } = await supabaseAdmin.from("procedimentos").delete().eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}