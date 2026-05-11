"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else window.location.href = "/dashboard";
    setLoading(false);
  }

  async function handleSignUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage("Verifique seu email para confirmar o cadastro!");
    setLoading(false);
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <main className="min-h-screen bg-[#0a0707] flex items-center justify-center px-6">
      <div
        className="w-full max-w-md rounded-3xl p-10"
        style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)" }}
      >
        <h1 className="text-3xl font-bold mb-2 text-white">Acesse sua conta</h1>
        <p className="mb-8 text-sm" style={{ color: "#a89080" }}>
          Moncie Clínica de Estética
        </p>

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-4 rounded-xl bg-[#1a1212] text-white outline-none"
            style={{ border: "1px solid rgba(200,160,120,0.2)" }}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 rounded-xl bg-[#1a1212] text-white outline-none"
            style={{ border: "1px solid rgba(200,160,120,0.2)" }}
          />

          <button
            onClick={handleEmailLogin}
            disabled={loading}
            className="w-full py-4 rounded-xl font-semibold uppercase tracking-widest text-sm transition hover:scale-105"
            style={{ background: "#c8a078", color: "#0a0707" }}
          >
            {loading ? "Carregando..." : "Entrar"}
          </button>

          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full py-4 rounded-xl font-semibold uppercase tracking-widest text-sm transition hover:scale-105"
            style={{ border: "1px solid rgba(200,160,120,0.3)", color: "#c8a078" }}
          >
            Criar conta
          </button>

          <div className="flex items-center gap-4 my-2">
            <div className="flex-1 h-px" style={{ background: "rgba(200,160,120,0.15)" }} />
            <span style={{ color: "#a89080" }} className="text-sm">ou</span>
            <div className="flex-1 h-px" style={{ background: "rgba(200,160,120,0.15)" }} />
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-4 rounded-xl font-semibold text-sm transition hover:scale-105 flex items-center justify-center gap-3"
            style={{ background: "#fff", color: "#0a0707" }}
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
            Entrar com Google
          </button>

          {message && (
            <p className="text-center text-sm mt-2" style={{ color: "#c8a078" }}>
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}