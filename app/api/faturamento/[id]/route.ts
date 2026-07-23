export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const update: Record<string, unknown> = { ...body };
  // Só recalcula o total quando o valor é enviado (ex.: "Confirmar" manda só o status)
  if (body.valor !== undefined) {
    update.valor_final = Number(body.valor) - Number(body.desconto ?? 0);
  }

  const { data, error } = await supabaseAdmin
    .from("faturamentos")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getSessao();
  if (!sessao || sessao.role !== "admin") return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { id } = await params;
  const { error } = await supabaseAdmin.from("faturamentos").delete().eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}