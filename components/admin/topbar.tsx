"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionUser } from "@/lib/auth";
import Notificacoes from "@/components/admin/notificacoes";

export default function AdminTopbar({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function handleLogout() {
    setSaindo(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const iniciais = user.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className="flex items-center justify-between px-6 py-4"
      style={{ background: "#0d0909", borderBottom: "1px solid rgba(200,160,120,0.1)" }}>
      <div>
        <p className="text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>
          Painel Administrativo
        </p>
        <p className="text-sm font-semibold mt-0.5" style={{ color: "#c8a078" }}>
          Moncie Esthetique
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-xs px-3 py-1 rounded-full"
          style={{ background: "rgba(200,160,120,0.1)", border: "1px solid rgba(200,160,120,0.2)", color: "#c8a078" }}>
          {user.role === "admin" ? "Administrador" : "Funcionario"}
        </span>

        <Notificacoes />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "rgba(200,160,120,0.15)", color: "#c8a078" }}>
            {iniciais}
          </div>
          <span className="hidden sm:block text-sm" style={{ color: "#a89080" }}>
            {user.nome.split(" ")[0]}
          </span>
        </div>

        <button onClick={handleLogout} disabled={saindo}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition hover:opacity-80"
          style={{ border: "1px solid rgba(200,160,120,0.15)", color: "#6b5a4e" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}>
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {saindo ? "Saindo..." : "Sair"}
        </button>
      </div>
    </header>
  );
}