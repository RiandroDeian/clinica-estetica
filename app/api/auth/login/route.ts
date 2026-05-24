import { NextRequest, NextResponse } from "next/server";
import { verificarCredenciais, criarSessao } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, senha } = await request.json();
    if (!email || !senha) {
      return NextResponse.json({ erro: "Email e senha sao obrigatorios" }, { status: 400 });
    }
    const user = await verificarCredenciais(email, senha);
    if (!user) {
      await new Promise((r) => setTimeout(r, 800));
      return NextResponse.json({ erro: "Email ou senha incorretos" }, { status: 401 });
    }
    await criarSessao(user);
    return NextResponse.json({ ok: true, user: { nome: user.nome, role: user.role } });
  } catch (err) {
    console.error("[AUTH] Erro no login:", err);
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 });
  }
}
