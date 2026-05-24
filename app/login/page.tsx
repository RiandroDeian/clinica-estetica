"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.erro ?? "Erro ao fazer login"); return; }
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setErro("Erro de conexao. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0a0707", fontFamily: "Georgia, serif" }}>
      <div
        className="fixed pointer-events-none"
        style={{ width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,160,120,0.06) 0%, transparent 70%)",
          top: "10%", left: "50%", transform: "translateX(-50%)" }}
      />
      <div className="w-full max-w-md"
        style={{ opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.6s ease, transform 0.6s ease" }}>
        <div className="rounded-3xl p-8 md:p-10"
          style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)" }}>
          <div className="flex flex-col items-center mb-10">
            <img src="/logo-moncie-print.jpg" alt="Moncie"
              className="w-16 h-16 rounded-2xl object-cover mb-4" />
            <h1 className="text-2xl font-bold" style={{ color: "#c8a078" }}>
              Moncie Esthetique
            </h1>
            <p className="text-sm mt-1" style={{ color: "#6b5a4e" }}>
              Area administrativa
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-xs uppercase tracking-widest"
                style={{ color: "#a89080" }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-2xl px-5 py-4 text-sm outline-none transition-all"
                style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)",
                  color: "#e8d5c0", caretColor: "#c8a078" }}
                onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(200,160,120,0.5)")}
                onBlur={(e) => (e.currentTarget.style.border = "1px solid rgba(200,160,120,0.15)")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="senha" className="text-xs uppercase tracking-widest"
                style={{ color: "#a89080" }}>
                Senha
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="........"
                  className="w-full rounded-2xl px-5 py-4 text-sm outline-none transition-all pr-12"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)",
                    color: "#e8d5c0", caretColor: "#c8a078" }}
                  onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(200,160,120,0.5)")}
                  onBlur={(e) => (e.currentTarget.style.border = "1px solid rgba(200,160,120,0.15)")}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition hover:opacity-80"
                  style={{ color: "#6b5a4e" }}
                  aria-label="Mostrar senha">
                  {mostrarSenha ? (
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"
                      stroke="currentColor" strokeWidth={1.5}>
                      <path d="M3 3l18 18M10.5 10.677A2 2 0 0013.323 13.5M6.362 6.227C4.26 7.54 2.5 9.5 2.5 12c0 0 3.182 6.5 9.5 6.5a9.86 9.86 0 004.138-.9M9.5 5.1A9.93 9.93 0 0112 4.5c6.318 0 9.5 7.5 9.5 7.5a13.16 13.16 0 01-2.362 3.273"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"
                      stroke="currentColor" strokeWidth={1.5}>
                      <path d="M2.5 12S5.682 5.5 12 5.5 21.5 12 21.5 12 18.318 18.5 12 18.5 2.5 12 2.5 12z"
                        strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="2.5"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {erro && (
              <div className="rounded-2xl px-5 py-3 text-sm"
                style={{ background: "rgba(200,80,80,0.1)",
                  border: "1px solid rgba(200,80,80,0.25)", color: "#e08080" }}>
                {erro}
              </div>
            )}
            <button
              type="submit"
              disabled={carregando}
              className="w-full py-4 rounded-2xl text-sm uppercase tracking-widest font-semibold transition-all duration-300 mt-2"
              style={{ background: carregando ? "rgba(200,160,120,0.5)" : "#c8a078",
                color: "#0a0707", cursor: carregando ? "not-allowed" : "pointer" }}>
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <div className="mt-8 pt-6 text-center"
            style={{ borderTop: "1px solid rgba(200,160,120,0.08)" }}>
            <a href="/" className="text-xs transition hover:opacity-80"
              style={{ color: "#6b5a4e" }}>
              Voltar ao site
            </a>
          </div>
        </div>
        <p className="text-center text-xs mt-6" style={{ color: "#2a1f1a" }}>
          Acesso restrito a funcionarios autorizados
        </p>
      </div>
      <style>{`input::placeholder { color: #3a2e28; }`}</style>
    </main>
  );
}