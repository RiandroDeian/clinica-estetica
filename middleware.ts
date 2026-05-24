import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "moncie-secret-mude-em-producao"
);

const rotasPublicas = ["/login", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (rotasPublicas.some(r => pathname.startsWith(r))) {
    if (pathname === "/login") {
      const token = request.cookies.get("moncie_session")?.value;
      if (token) {
        try {
          await jwtVerify(token, SECRET);
          return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        } catch {}
      }
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("moncie_session")?.value;
    if (!token) return NextResponse.redirect(new URL("/login", request.url));

    try {
      await jwtVerify(token, SECRET);
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("moncie_session");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};