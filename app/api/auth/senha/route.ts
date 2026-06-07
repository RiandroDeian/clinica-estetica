export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao, hashSenha, verificarCredenciais } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { senhaAtual, novaSenha } = await request.json();

  if (!senhaAtual || !novaSenha) {
    return NextResponse.json({ erro: "Preencha todos os campos" }, { status: 400 });
  }

  if (novaSenha.length < 6) {
    return NextResponse.json({ erro: "Nova senha deve ter pelo menos 6 caracteres" }, { status: 400 });
  }

  // Verificar senha atual
  const valido = await verificarCredenciais(sessao.email, senhaAtual);
  if (!valido) {
    return NextResponse.json({ erro: "Senha atual incorreta" }, { status: 401 });
  }

  // Atualizar senha
  const novoHash = await hashSenha(novaSenha);
  const { error } = await supabaseAdmin
    .from("funcionarios")
    .update({ senha_hash: novoHash })
    .eq("id", sessao.id);

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
