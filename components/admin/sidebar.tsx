"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { menuLinks, temPermissao } from "@/lib/permissoes";

function Icon({ type }: { type: string }) {
  const p = { viewBox: "0 0 24 24", fill: "none" as const, className: "w-5 h-5", stroke: "currentColor" as const, strokeWidth: 1.5 };
  if (type === "dashboard")     return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
  if (type === "recepcao")      return <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
  if (type === "agenda")        return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
  if (type === "pacientes")     return <svg {...p}><circle cx="8" cy="7" r="4"/><path d="M2 21v-2a6 6 0 0112 0v2"/><path d="M17 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (type === "laser")         return <svg {...p}><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"/></svg>;
  if (type === "faturamento")   return <svg {...p}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;
  if (type === "estoque")       return <svg {...p}><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>;
  if (type === "orcamentos")    return <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>;
  if (type === "relatorios")    return <svg {...p}><path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v10a2 2 0 01-2 2h-3"/><polyline points="9 17 9 10 15 10 15 17"/></svg>;
  if (type === "whatsapp")      return <svg {...p}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>;
  if (type === "chat")          return <svg {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
  if (type === "procedimentos") return <svg {...p}><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m15.07-7.07-1.41 1.41M6.34 17.66l-1.41 1.41M18.36 18.36l-1.41-1.41M6.34 6.34 4.93 4.93"/></svg>;
}

export default function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [cargo, setCargo] = useState(role);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => { if (d?.cargo) setCargo(d.cargo); });
  }, []);

  const todosLinks = [
    ...menuLinks,
    { href: "/admin/orcamentos", label: "Orcamentos", icon: "orcamentos", permissao: "pacientes" as const },
  ];

  const linksVisiveis = todosLinks.filter(l => temPermissao(cargo, l.permissao));

  return (
    <aside className="hidden md:flex flex-col transition-all duration-300 flex-shrink-0"
      style={{ width: collapsed ? 72 : 240, background: "#0d0909", borderRight: "1px solid rgba(200,160,120,0.1)" }}>
      <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: "1px solid rgba(200,160,120,0.08)" }}>
        <img src="/logo-moncie-print.jpg" alt="Moncie" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
        {!collapsed && (
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: "#c8a078" }}>Moncie</p>
            <p className="text-[10px] capitalize" style={{ color: "#6b5a4e" }}>{cargo}</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto transition hover:opacity-70" style={{ color: "#6b5a4e" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}>
            <path d={collapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <nav className="flex-1 flex flex-col gap-0.5 p-2 pt-3 overflow-y-auto">
        {linksVisiveis.map(link => {
          const ativo = pathname.startsWith(link.href);
          return (
            <a key={link.href} href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
              style={{ background: ativo ? "rgba(200,160,120,0.12)" : "transparent", color: ativo ? "#c8a078" : "#6b5a4e", border: ativo ? "1px solid rgba(200,160,120,0.2)" : "1px solid transparent" }}
              title={collapsed ? link.label : undefined}>
              <span className="flex-shrink-0"><Icon type={link.icon} /></span>
              {!collapsed && <span className="text-sm font-medium">{link.label}</span>}
            </a>
          );
        })}
      </nav>
      <div className="p-2" style={{ borderTop: "1px solid rgba(200,160,120,0.08)" }}>
        <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition hover:opacity-70"
          style={{ color: "#3a2e28" }} title={collapsed ? "Ver site" : undefined}>
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 flex-shrink-0" stroke="currentColor" strokeWidth={1.5}>
            <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!collapsed && <span className="text-xs">Ver site</span>}
        </a>
      </div>
    </aside>
  );
}