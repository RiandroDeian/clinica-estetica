export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const formData = await request.formData();
  const arquivo = formData.get("arquivo") as File;
  const paciente_id = formData.get("paciente_id") as string;
  const tipo = formData.get("tipo") as string ?? "outro";
  const descricao = formData.get("descricao") as string ?? "";

  if (!arquivo || !paciente_id) {
    return NextResponse.json({ erro: "Arquivo e paciente_id sao obrigatorios" }, { status: 400 });
  }

  const ext = arquivo.name.split(".").pop();
  const nomeArquivo = `${paciente_id}/${uuidv4()}.${ext}`;
  const buffer = Buffer.from(await arquivo.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from("clinica-fotos")
    .upload(nomeArquivo, buffer, {
      contentType: arquivo.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ erro: uploadError.message }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from("uploads")
    .insert({ paciente_id, url: nomeArquivo, tipo, descricao })
    .select()
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const { data: signedUrl } = await supabaseAdmin.storage
    .from("clinica-fotos")
    .createSignedUrl(nomeArquivo, 60 * 60 * 24);

  return NextResponse.json({ ...data, url_publica: signedUrl?.signedUrl ?? "" });
}

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const paciente_id = searchParams.get("paciente_id");

  if (!paciente_id) return NextResponse.json({ erro: "paciente_id obrigatorio" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("uploads")
    .select("*")
    .eq("paciente_id", paciente_id)
    .order("criado_em", { ascending: false });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const arquivosComUrl = await Promise.all(
    (data ?? []).map(async (item) => {
      const { data: signedData } = await supabaseAdmin.storage
        .from("clinica-fotos")
        .createSignedUrl(item.url, 60 * 60 * 24);
      return { ...item, url_publica: signedData?.signedUrl ?? "" };
    })
  );

  return NextResponse.json(arquivosComUrl);
}

export async function DELETE(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const url = searchParams.get("url");

  if (!id || !url) return NextResponse.json({ erro: "id e url obrigatorios" }, { status: 400 });

  await supabaseAdmin.storage.from("clinica-fotos").remove([url]);
  await supabaseAdmin.from("uploads").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}