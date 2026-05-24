import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "moncie-secret-mude-em-producao"
);

export type SessionUser = {
  id: string;
  nome: string;
  email: string;
  role: "admin" | "funcionario";
};

export async function criarSessao(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .setIssuedAt()
    .sign(SECRET);
  const cookieStore = await cookies();
  cookieStore.set("moncie_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
}

export async function getSessao(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("moncie_session")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function destruirSessao() {
  const cookieStore = await cookies();
  cookieStore.delete("moncie_session");
}

export async function verificarCredenciais(email: string, senha: string) {
  const { data, error } = await supabaseAdmin
    .from("funcionarios")
    .select("id, nome, email, role, senha_hash, ativo")
    .eq("email", email.toLowerCase().trim())
    .eq("ativo", true)
    .single();
  if (error || !data) return null;
  const senhaValida = await bcrypt.compare(senha, data.senha_hash);
  if (!senhaValida) return null;
  return { id: data.id, nome: data.nome, email: data.email, role: data.role } as SessionUser;
}

export async function hashSenha(senha: string) {
  return bcrypt.hash(senha, 12);
}