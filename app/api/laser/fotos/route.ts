export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const pacote_id = searchParams.get("pacote_id");
  if (!pacote_id) return NextResponse.json({ erro: "pacote_id obrigatório" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("laser_fotos")
    .select("*")
    .eq("pacote_id", pacote_id)
    .order("criado_em", { ascending: false });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const formData = await request.formData();
  const arquivo = formData.get("arquivo") as File;
  const pacote_id = formData.get("pacote_id") as string;
  const tipo = (formData.get("tipo") as string) || "antes";
  const descricao = (formData.get("descricao") as string) || "";

  if (!arquivo || !pacote_id) {
    return NextResponse.json({ erro: "Arquivo e pacote_id são obrigatórios" }, { status: 400 });
  }

  const ext = arquivo.name.split(".").pop();
  const nomeArquivo = `${pacote_id}/${tipo}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await arquivo.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from("laser-fotos")
    .upload(nomeArquivo, buffer, { contentType: arquivo.type, upsert: false });

  if (uploadError) return NextResponse.json({ erro: uploadError.message }, { status: 500 });

  const { data: urlData } = supabaseAdmin.storage
    .from("laser-fotos")
    .getPublicUrl(nomeArquivo);

  const { data, error } = await supabaseAdmin
    .from("laser_fotos")
    .insert({
      pacote_id,
      tipo,
      descricao: descricao || null,
      url: urlData.publicUrl,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ erro: "id obrigatório" }, { status: 400 });

  await supabaseAdmin.from("laser_fotos").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}