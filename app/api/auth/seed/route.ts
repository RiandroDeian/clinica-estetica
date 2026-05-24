import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { hashSenha } from "@/lib/auth";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ erro: "Nao disponivel em producao" }, { status: 403 });
  }
  const hash = await hashSenha("admin123");
  const { data, error } = await supabaseAdmin
    .from("funcionarios")
    .insert({ nome: "Administrador", email: "admin@moncie.com", senha_hash: hash, role: "admin" })
    .select()
    .single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
