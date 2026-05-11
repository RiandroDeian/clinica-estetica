"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = "/login";
      else setUser(data.user);
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#0a0707] flex items-center justify-center px-6">
      <div
        className="w-full max-w-md rounded-3xl p-10 text-center"
        style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)" }}
      >
        <h1 className="text-3xl font-bold mb-2 text-white">Bem-vindo! 👋</h1>
        <p className="mb-6 text-sm" style={{ color: "#a89080" }}>
          {user.email}
        </p>

        <button
          onClick={handleLogout}
          className="px-8 py-4 rounded-full text-sm uppercase tracking-widest transition hover:scale-105"
          style={{ background: "#c8a078", color: "#0a0707" }}
        >
          Sair
        </button>
      </div>
    </main>
  );
}