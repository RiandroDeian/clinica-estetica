"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionUser } from "@/lib/auth";
import Notificacoes from "@/components/admin/notificacoes";
import { BuscaGlobal } from "@/components/admin/BuscaGlobal";

export default function AdminTopbar({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function handleLogout() {
    setSaindo(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const iniciais = user.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const cargo = (user as any).cargo ?? (user.role === "admin" ? "Administrador" : "Funcionário");

  return (
    <header className="flex items-center justify-between px-6 py-4"
      style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
      <div>
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Painel Administrativo
        </p>
        <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--gold)" }}>
          Moncie Esthetique
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Busca Global */}
        <BuscaGlobal />

        <span className="hidden sm:block text-xs px-3 py-1 rounded-full"
          style={{ background: "var(--gold-bg)", border: "1px solid var(--border-color)", color: "var(--gold)" }}>
          {cargo}
        </span>

        <Notificacoes />

        <a href="/admin/perfil" className="flex items-center gap-2 transition hover:opacity-70">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
            {iniciais}
          </div>
          <span className="hidden sm:block text-sm" style={{ color: "var(--text-secondary)" }}>
            {user.nome.split(" ")[0]}
          </span>
        </a>

        <button onClick={handleLogout} disabled={saindo}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition hover:opacity-80"
          style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}>
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {saindo ? "Saindo..." : "Sair"}
        </button>
      </div>
    </header>
  );
}

