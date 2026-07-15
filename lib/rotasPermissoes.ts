// Mapa único (fonte da verdade) de rota do admin -> chave de permissão.
// Usado tanto pelo middleware (proxy.ts, que bloqueia o acesso) quanto pela
// sidebar (que esconde do menu o que o usuário não pode acessar), para que os
// dois nunca fiquem divergentes.
export const ROTAS_PERMISSOES: Record<string, string> = {
  "/admin/agenda":        "agenda",
  "/admin/pacientes":     "pacientes",
  "/admin/prontuario":    "pacientes",
  "/admin/pacotes":       "pacotes",
  "/admin/laser":         "laser",
  "/admin/procedimentos": "procedimentos",
  "/admin/estoque":       "estoque",
  "/admin/faturamento":   "financeiro",
  "/admin/relatorios":    "relatorios",
  "/admin/configuracoes": "configuracoes",
  "/admin/whatsapp":      "whatsapp",
  "/admin/orcamentos":    "orcamentos",
  "/admin/recepcao":      "recepcao",
  "/admin/crm":           "crm",
  "/admin/metas":         "metas",
  "/admin/comissoes":     "comissoes",
  "/admin/chat":          "chat",
  "/admin/auditoria":     "auditoria",
};

// Retorna a chave de permissão exigida pela rota (ou null se a rota é livre).
export function permissaoDaRota(pathname: string): string | null {
  const rota = Object.keys(ROTAS_PERMISSOES).find(r => pathname.startsWith(r));
  return rota ? ROTAS_PERMISSOES[rota] : null;
}

// Decide se um link/rota deve aparecer para o usuário.
// Admin vê tudo; rotas livres aparecem sempre; as demais dependem da permissão.
export function podeVerRota(
  href: string,
  role?: string,
  permissoes?: Record<string, boolean> | null,
): boolean {
  if (role === "admin") return true;
  const chave = permissaoDaRota(href);
  if (!chave) return true;
  return !!permissoes?.[chave];
}
