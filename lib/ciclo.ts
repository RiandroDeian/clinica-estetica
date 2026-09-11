// Motor central do "ciclo da clínica" — dia 15 → dia 15 do mês seguinte.
// NUNCA usar 01 → fim do mês para indicadores. Todas as telas usam estas funções.
//
// Regra de borda padronizada: intervalo [inicio, fim) — início inclusivo (dia 15
// 00:00) e fim exclusivo (dia 15 00:00 do mês seguinte). Assim, um evento no dia 15
// pertence ao ciclo que COMEÇA nesse dia 15 (ex.: fechamento em 15/10 entra no ciclo
// 15/10 → 15/11, conforme especificado).
//
// As datas são construídas em horário LOCAL (o navegador do usuário está no fuso da
// clínica). Quem chama no cliente e envia .toISOString() à API garante o fuso correto.

export type Ciclo = {
  inicio: Date;
  fim: Date;
  ref: string;    // "YYYY-MM-15" — identifica o ciclo pelo seu dia de início
  label: string;  // "15/09/2026 → 15/10/2026"
};

function fmtData(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function montar(inicio: Date, fim: Date): Ciclo {
  const ref = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, "0")}-15`;
  return { inicio, fim, ref, label: `${fmtData(inicio)} → ${fmtData(fim)}` };
}

// Ciclo ao qual uma data pertence.
export function getCicloClinica(data: Date = new Date()): Ciclo {
  const ano = data.getFullYear();
  const mes = data.getMonth();
  const dia = data.getDate();
  // Se estamos no dia 15 ou depois, o ciclo começou neste mês; senão, no mês anterior.
  const inicio = new Date(ano, dia >= 15 ? mes : mes - 1, 15, 0, 0, 0, 0);
  const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 15, 0, 0, 0, 0);
  return montar(inicio, fim);
}

export function cicloAnterior(c: Ciclo): Ciclo {
  const inicio = new Date(c.inicio.getFullYear(), c.inicio.getMonth() - 1, 15, 0, 0, 0, 0);
  const fim = new Date(c.inicio.getTime());
  return montar(inicio, fim);
}

export function cicloSeguinte(c: Ciclo): Ciclo {
  const inicio = new Date(c.fim.getTime());
  const fim = new Date(c.fim.getFullYear(), c.fim.getMonth() + 1, 15, 0, 0, 0, 0);
  return montar(inicio, fim);
}

// Últimos n ciclos em ordem cronológica crescente (o último é o ciclo de `base`).
export function ciclosRecentes(n: number, base: Date = new Date()): Ciclo[] {
  let c = getCicloClinica(base);
  const arr: Ciclo[] = [c];
  for (let i = 1; i < n; i++) {
    c = cicloAnterior(c);
    arr.unshift(c);
  }
  return arr;
}

// Reconstrói um ciclo a partir do ref "YYYY-MM-15".
export function cicloDeRef(ref: string): Ciclo {
  const [y, m] = ref.split("-").map(Number);
  const inicio = new Date(y, (m ?? 1) - 1, 15, 0, 0, 0, 0);
  const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 15, 0, 0, 0, 0);
  return montar(inicio, fim);
}

export function rotuloCiclo(c: Ciclo): string {
  return c.label;
}
