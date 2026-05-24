export type Cargo = "administrador" | "recepcionista" | "massagista" | "laser" | "esteticista" | "financeiro";

export type Permissao =
  | "dashboard"
  | "recepcao"
  | "agenda"
  | "pacientes"
  | "laser"
  | "faturamento"
  | "estoque"
  | "relatorios"
  | "avaliacoes"
  | "whatsapp"
  | "chat"
  | "procedimentos"
  | "configuracoes";

export const permissoesPorCargo: Record<Cargo, Permissao[]> = {
  administrador: [
    "dashboard","recepcao","agenda","pacientes","laser",
    "faturamento","estoque","relatorios","avaliacoes",
    "whatsapp","chat","procedimentos","configuracoes"
  ],
  recepcionista: [
    "dashboard","recepcao","agenda","pacientes","chat","whatsapp","avaliacoes"
  ],
  massagista: [
    "agenda","pacientes","chat"
  ],
  laser: [
    "agenda","pacientes","laser","chat"
  ],
  esteticista: [
    "agenda","pacientes","chat"
  ],
  financeiro: [
    "dashboard","faturamento","relatorios","chat"
  ],
};

export function temPermissao(cargo: string, permissao: Permissao): boolean {
  const c = cargo as Cargo;
  return permissoesPorCargo[c]?.includes(permissao) ?? false;
}

export const menuLinks: { href: string; label: string; icon: string; permissao: Permissao }[] = [
  { href: "/admin/dashboard",     label: "Dashboard",     icon: "dashboard",     permissao: "dashboard" },
  { href: "/admin/recepcao",      label: "Recepcao",      icon: "recepcao",      permissao: "recepcao" },
  { href: "/admin/agenda",        label: "Agenda",        icon: "agenda",        permissao: "agenda" },
  { href: "/admin/pacientes",     label: "Pacientes",     icon: "pacientes",     permissao: "pacientes" },
  { href: "/admin/laser",         label: "Laser",         icon: "laser",         permissao: "laser" },
  { href: "/admin/faturamento",   label: "Faturamento",   icon: "faturamento",   permissao: "faturamento" },
  { href: "/admin/estoque",       label: "Estoque",       icon: "estoque",       permissao: "estoque" },
  { href: "/admin/relatorios",    label: "Relatorios",    icon: "relatorios",    permissao: "relatorios" },
  { href: "/admin/avaliacoes",    label: "Avaliacoes",    icon: "avaliacoes",    permissao: "avaliacoes" },
  { href: "/admin/whatsapp",      label: "WhatsApp",      icon: "whatsapp",      permissao: "whatsapp" },
  { href: "/admin/chat",          label: "Chat",          icon: "chat",          permissao: "chat" },
  { href: "/admin/procedimentos", label: "Procedimentos", icon: "procedimentos", permissao: "procedimentos" },
  { href: "/admin/configuracoes", label: "Configuracoes", icon: "config",        permissao: "configuracoes" },
];