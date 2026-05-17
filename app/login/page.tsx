"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function entrar() {
    try {
      setLoading(true);
      setMensagem("");

      console.log("Tentando login...");

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      console.log("DATA:", data);
      console.log("ERROR:", error);

      if (error) {
        setMensagem(error.message);
        setLoading(false);
        return;
      }

      setMensagem("Login realizado!");
      window.location.href = "/admin";



    } catch (err) {
      console.log(err);
      setMensagem("Erro inesperado");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col gap-4">

        <h1 className="text-4xl font-bold">
          Login Admin
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-4 rounded bg-neutral-900"
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="p-4 rounded bg-neutral-900"
        />

        {mensagem && (
          <div className="bg-neutral-900 p-4 rounded">
            {mensagem}
          </div>
        )}

        <button
          onClick={entrar}
          disabled={loading}
          className="bg-[#c8a078] text-black p-4 rounded font-bold"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

      </div>
    </main>
  );
}