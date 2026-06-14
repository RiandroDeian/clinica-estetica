"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme/theme-provider";

type LinkItem = { href: string; label: string; icon: string };

function Icon({ type }: { type: string }) {
  const p = { viewBox: "0 0 24 24", fill: "none" as const, className: "w-5 h-5", stroke: "currentColor" as const, strokeWidth: 1.5 };
  if (type === "dashboard")   return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
  if (type === "recepcao")    return <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>;
  if (type === "agenda")      return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
  if (type === "pacientes")   return <svg {...p}><circle cx="8" cy="7" r="4"/><path d="M2 21v-2a6 6 0 0112 0v2"/></svg>;
  if (type === "pacotes")     return <svg {...p}><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/></svg>;
  if (type === "faturamento") return <svg {...p}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;
  if (type === "whatsapp")    return <svg {...p}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>;
  if (type === "laser")       return <svg {...p}><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"/></svg>;
  if (type === "prontuario")    return <svg {...p}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 7h1m-1 0h1" strokeLinecap="round"/></svg>;
  if (type === "procedimentos") return <svg {...p}><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (type === "estoque")       return <svg {...p}><path d="M20 7l-8-4-8 4m16 0v10l-8 4m8-14l-8 4m-8 10l8-4m0 0V7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (type === "chat")          return <svg {...p}><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (type === "relatorios")    return <svg {...p}><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (type === "configuracoes") return <svg {...p}><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (type === "orcamentos")    return <svg {...p}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (type === "crm")         return <svg {...p}><path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (type === "metas")       return <svg {...p}><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (type === "comissoes")    return <svg {...p}><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 9v1m0-9c-1.11 0-2.08.402-2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (type === "auditoria")     return <svg {...p}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="3"/></svg>;
}

const todosLinks: LinkItem[] = [
  { href: "/admin",               label: "Dashboard",     icon: "dashboard"   },
  { href: "/admin/recepcao",      label: "Recepção",      icon: "recepcao"    },
  { href: "/admin/agenda",        label: "Agenda",        icon: "agenda"      },
  { href: "/admin/pacientes",     label: "Pacientes",     icon: "pacientes"   },
  { href: "/admin/prontuario",    label: "Prontuário",    icon: "prontuario"  },
  { href: "/admin/laser",         label: "Laser",         icon: "laser"       },
  { href: "/admin/pacotes",       label: "Pacotes",       icon: "pacotes"     },
  { href: "/admin/procedimentos", label: "Procedimentos", icon: "procedimentos" },
  { href: "/admin/estoque",       label: "Estoque",       icon: "estoque"       },
  { href: "/admin/chat",          label: "Chat Interno",  icon: "chat"          },
  { href: "/admin/orcamentos",     label: "Orçamentos",    icon: "orcamentos"  },
  { href: "/admin/faturamento",   label: "Faturamento",   icon: "faturamento" },
  { href: "/admin/crm",           label: "CRM",           icon: "crm"           },
  { href: "/admin/metas",         label: "Metas",         icon: "metas"         },
  { href: "/admin/comissoes",     label: "Comissões",     icon: "comissoes"     },
  { href: "/admin/relatorios",    label: "Relatórios",    icon: "relatorios"    },
  { href: "/admin/configuracoes", label: "Configurações", icon: "configuracoes" },
  { href: "/admin/whatsapp",      label: "WhatsApp",      icon: "whatsapp"    },
  { href: "/admin/auditoria",     label: "Auditoria",     icon: "auditoria"     },
];

export default function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const { darkMode, toggleTheme, theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [cargo, setCargo] = useState(role);
  

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d?.cargo) setCargo(d.cargo); })
      .catch(() => {});
  }, []);

  return (
    <aside
      className="hidden md:flex flex-col transition-all duration-300 flex-shrink-0"
      style={{ width: collapsed ? 72 : 250, background: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: "1px solid var(--border-color)" }}>
        <img src="/logo-moncie-print.jpg" alt="Moncie" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{ color: "var(--gold)" }}>Moncié</p>
            <p className="text-xs capitalize truncate" style={{ color: "var(--text-muted)" }}>{cargo}</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto flex-shrink-0" style={{ color: "var(--text-muted)" }}>
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Toggle tema */}
      {/* Toggle tema */}
      <div className="px-3 pt-3 flex gap-1">
        {([
          { key: "dark",    label: "🌙", title: "Escuro"  },
          { key: "neutral", label: "⬛", title: "Neutro"  },
          { key: "light",   label: "☀️", title: "Claro"   },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTheme(t.key)} title={t.title}
            className="flex-1 py-2 rounded-xl text-xs transition"
            style={{
              background: theme === t.key ? "var(--gold-bg)" : "transparent",
              color: theme === t.key ? "var(--gold)" : "var(--text-muted)",
              border: `1px solid ${theme === t.key ? "var(--border-color)" : "transparent"}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
        {todosLinks.map(link => {
          const ativo = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
              style={{
                background: ativo ? "var(--gold-bg)" : "transparent",
                color: ativo ? "var(--gold)" : "var(--text-muted)",
                border: ativo ? "1px solid var(--border-color)" : "1px solid transparent",
              }}
            >
              <Icon type={link.icon} />
              {!collapsed && <span className="text-sm font-medium">{link.label}</span>}
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: "1px solid var(--border-color)" }}>
        <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition" style={{ color: "var(--text-muted)" }}>
          🌐 {!collapsed && "Ver site"}
        </a>
      </div>
    </aside>
  );
}






