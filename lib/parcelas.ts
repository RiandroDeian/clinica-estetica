// Helpers compartilhados do parcelamento de boleto da aba Laser.
// Usados tanto pela API (montagem do resumo) quanto pela UI (badges/coluna).

export type ParcelaStatus = "pago" | "pendente" | "vencido";

export type Parcela = {
  id: string;
  pacote_id: string;
  numero: number;
  total_parcelas: number;
  valor: number;
  vencimento: string;         // "YYYY-MM-DD"
  data_pagamento: string | null;
};

// Status derivado (não é armazenado no banco):
// pago  -> tem data_pagamento
// vencido -> não paga e o vencimento já passou
// pendente -> não paga e ainda não venceu (inclui parcelas futuras)
export function statusParcela(p: Pick<Parcela, "vencimento" | "data_pagamento">, hojeISO?: string): ParcelaStatus {
  if (p.data_pagamento) return "pago";
  const hoje = hojeISO ?? new Date().toISOString().slice(0, 10);
  return p.vencimento < hoje ? "vencido" : "pendente";
}

export const parcelaCfg: Record<ParcelaStatus, { emoji: string; label: string; color: string; bg: string }> = {
  pago:     { emoji: "🟢", label: "Pago",     color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  pendente: { emoji: "🟡", label: "Pendente", color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  vencido:  { emoji: "🔴", label: "Vencido",  color: "#e87a7a", bg: "rgba(232,122,122,0.1)" },
};

export type ParcelasResumo = {
  tem: boolean;
  total: number;
  pagas: number;
  restantes: number;
  valor_parcela: number;
  em_aberto: number;          // soma do valor das parcelas não pagas
  atual: number;              // número da 1ª parcela não paga (ou total, se todas pagas)
  status: ParcelaStatus;      // status da parcela "atual"
};

// Monta o resumo de um pacote a partir das suas parcelas (ordem qualquer).
export function montarResumo(parcelas: Parcela[], hojeISO?: string): ParcelasResumo {
  const hoje = hojeISO ?? new Date().toISOString().slice(0, 10);
  const ordenadas = [...parcelas].sort((a, b) => a.numero - b.numero);
  const total = ordenadas.length;
  const pagas = ordenadas.filter(p => !!p.data_pagamento).length;
  const naoPagas = ordenadas.filter(p => !p.data_pagamento);
  const emAberto = naoPagas.reduce((s, p) => s + Number(p.valor ?? 0), 0);
  const primeiraNaoPaga = naoPagas[0];
  const atual = primeiraNaoPaga ? primeiraNaoPaga.numero : total;
  const valorParcela = ordenadas[0]?.valor ?? 0;

  // Status geral: se alguma parcela está vencida -> vencido; senão o status da parcela atual.
  const algumaVencida = naoPagas.some(p => statusParcela(p, hoje) === "vencido");
  const status: ParcelaStatus = total === 0
    ? "pendente"
    : algumaVencida
    ? "vencido"
    : primeiraNaoPaga
    ? statusParcela(primeiraNaoPaga, hoje)
    : "pago";

  return {
    tem: total > 0,
    total,
    pagas,
    restantes: total - pagas,
    valor_parcela: Number(valorParcela),
    em_aberto: emAberto,
    atual,
    status,
  };
}
