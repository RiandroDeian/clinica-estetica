import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getSecretBytes } from "@/lib/authSecret";

// ✅ Mapa de rota -> chave de permissão
const ROTAS_PERMISSOES: Record<string, string> = {
  "/admin/agenda":        "agenda",
  "/admin/pacientes":     "pacientes",
  "/admin/prontuario":    "pacientes",
  "/admin/pacotes":       "pacotes",
  "/admin/laser":         "laser",
  "/admin/procedimentos": "procedimentos",
  "/admin/estoque":       "estoque",
  "/admin/faturamento":   "financeiro",
  "/admin/relatorios":    "relatorios",
  "/admin/configuracoes": "configuracoes",
  "/admin/whatsapp":      "whatsapp",
  "/admin/orcamentos":    "orcamentos",
  "/admin/recepcao":      "recepcao",
  "/admin/crm":           "crm",
  "/admin/metas":         "metas",
  "/admin/comissoes":     "comissoes",
  "/admin/chat":          "chat",
  "/admin/auditoria":     "auditoria",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Deixa passar: login, public, api de auth, assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/agendar") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/agendar") ||
    pathname.startsWith("/api/agendamentos/rapido") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Pega o token
  const token = request.cookies.get("moncie_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, getSecretBytes());
    const sessao = payload as any;

    // Admin tem acesso total
    if (sessao.role === "admin") return NextResponse.next();

    // Verifica permissão para a rota acessada
    const rotaBase = Object.keys(ROTAS_PERMISSOES).find(r =>
      pathname.startsWith(r)
    );

    if (rotaBase) {
      const chave = ROTAS_PERMISSOES[rotaBase];
      const permissoes = sessao.permissoes ?? {};

      if (!permissoes[chave]) {
        // Sem permissão — redireciona para dashboard
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    }

    return NextResponse.next();
  } catch {
    // Token inválido
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/((?!auth|agendar|agendamentos/rapido).*)",
  ],
};