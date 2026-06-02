"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

type LinkItem = {
  href: string;
  label: string;
  icon: string;
};

function Icon({ type }: { type: string }) {
  const p = {
    viewBox: "0 0 24 24",
    fill: "none" as const,
    className: "w-5 h-5",
    stroke: "currentColor" as const,
    strokeWidth: 1.5,
  };

  if (type === "dashboard") {
    return (
      <svg {...p}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }

  if (type === "recepcao") {
    return (
      <svg {...p}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </svg>
    );
  }

  if (type === "agenda") {
    return (
      <svg {...p}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    );
  }

  if (type === "pacientes") {
    return (
      <svg {...p}>
        <circle cx="8" cy="7" r="4" />
        <path d="M2 21v-2a6 6 0 0112 0v2" />
      </svg>
    );
  }

  if (type === "laser") {
    return (
      <svg {...p}>
        <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
      </svg>
    );
  }

  if (type === "pacotes") {
    return (
      <svg {...p}>
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
      </svg>
    );
  }

  if (type === "faturamento") {
    return (
      <svg {...p}>
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    );
  }

  if (type === "whatsapp") {
    return (
      <svg {...p}>
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      </svg>
    );
  }

  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function AdminSidebar({
  role,
}: {
  role: string;
}) {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [cargo, setCargo] = useState(role);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.cargo) {
          setCargo(d.cargo);
        }
      })
      .catch(() => {});
  }, []);

  function toggleTheme() {
    const newTheme = !darkMode;

    setDarkMode(newTheme);

    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  const todosLinks: LinkItem[] = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: "dashboard",
    },
    {
      href: "/admin/recepcao",
      label: "Recepção",
      icon: "recepcao",
    },
    {
      href: "/admin/agenda",
      label: "Agenda",
      icon: "agenda",
    },
    {
      href: "/admin/pacientes",
      label: "Pacientes",
      icon: "pacientes",
    },
    {
      href: "/admin/laser",
      label: "Laser",
      icon: "laser",
    },
    {
      href: "/admin/pacotes",
      label: "Pacotes",
      icon: "pacotes",
    },
    {
      href: "/admin/procedimentos",
      label: "Procedimentos",
      icon: "pacotes",
    },
    {
      href: "/admin/estoque",
      label: "Estoque",
      icon: "pacotes",
    },
    {
      href: "/admin/chat",
      label: "Chat Interno",
      icon: "pacientes",
    },
    {
      href: "/admin/faturamento",
      label: "Faturamento",
      icon: "faturamento",
    },
    {
      href: "/admin/relatorios",
      label: "Relatórios",
      icon: "dashboard",
    },
    {
      href: "/admin/configuracoes",
      label: "Configurações",
      icon: "dashboard",
    },
    {
      href: "/admin/whatsapp",
      label: "WhatsApp",
      icon: "whatsapp",
    },
  ];

  const colors = darkMode
    ? {
        bg: "#111111",
        border: "rgba(255,255,255,0.06)",
        text: "#d4af7f",
        muted: "#8f8f8f",
        hover: "rgba(212,175,127,0.12)",
      }
    : {
        bg: "#ffffff",
        border: "rgba(0,0,0,0.08)",
        text: "#9c6b30",
        muted: "#666666",
        hover: "rgba(156,107,48,0.08)",
      };

  return (
    <aside
      className="hidden md:flex flex-col transition-all duration-300 flex-shrink-0"
      style={{
        width: collapsed ? 72 : 250,
        background: colors.bg,
        borderRight: `1px solid ${colors.border}`,
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-5"
        style={{
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <img
          src="/logo-moncie-print.jpg"
          alt="Moncie"
          className="w-10 h-10 rounded-xl object-cover"
        />

        {!collapsed && (
          <div>
            <p
              className="text-sm font-bold"
              style={{ color: colors.text }}
            >
              Moncié
            </p>

            <p
              className="text-xs capitalize"
              style={{ color: colors.muted }}
            >
              {cargo}
            </p>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
          style={{ color: colors.muted }}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <div className="px-3 pt-3">
        <button
          onClick={toggleTheme}
          className="w-full rounded-xl px-3 py-3 text-sm font-medium transition"
          style={{
            background: colors.hover,
            color: colors.text,
          }}
        >
          {darkMode ? "☀️ Tema Claro" : "🌙 Tema Escuro"}
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-1 p-3">
        {todosLinks.map((link) => {
          const ativo =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);

          return (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
              style={{
                background: ativo ? colors.hover : "transparent",
                color: ativo ? colors.text : colors.muted,
                border: ativo
                  ? `1px solid ${colors.border}`
                  : "1px solid transparent",
              }}
            >
              <Icon type={link.icon} />

              {!collapsed && (
                <span className="text-sm font-medium">
                  {link.label}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      <div
        className="p-3"
        style={{
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <a
          href="/"
          className="flex items-center gap-3 px-3 py-3 rounded-xl transition"
          style={{
            color: colors.muted,
          }}
        >
          🌐 {!collapsed && "Ver site"}
        </a>
      </div>
    </aside>
  );
}