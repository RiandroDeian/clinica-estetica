export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const paciente_id = formData.get("paciente_id") as string;

  if (!file || !paciente_id) return NextResponse.json({ erro: "Arquivo e paciente_id obrigatorios" }, { status: 400 });

  const ext = file.name.split(".").pop();
  const fileName = `${paciente_id}/${Date.now()}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { error } = await supabaseAdmin.storage
    .from("prontuario-fotos")
    .upload(fileName, buffer, { contentType: file.type, upsert: true });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const { data } = supabaseAdmin.storage.from("prontuario-fotos").getPublicUrl(fileName);
  return NextResponse.json({ url: data.publicUrl });
}