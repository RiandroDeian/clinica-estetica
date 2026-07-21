// Regras de follow-up pós-atendimento.
//
// "Atendido" = o horário do agendamento já passou e ele não foi cancelado.
// Cada regra vale dentro de uma JANELA (de `horas` até `ateHoras` depois do
// atendimento). As janelas não se sobrepõem, então cada paciente tem no máximo
// UMA tarefa pendente por vez — ela aparece, e quando a janela passa (ou quando
// marcam como feito) dá lugar à próxima.

export type RegraFollowUp = {
  tipo: string;
  label: string;
  icone: string;
  horas: number;      // a partir de quando a tarefa aparece
  ateHoras: number;   // até quando ela continua aparecendo
};

const H = 1;
const D = 24;

export const REGRAS_FOLLOW_UP: RegraFollowUp[] = [
  { tipo: "24h",          label: "Mensagem 24h",    icone: "📞", horas: 24 * H, ateHoras: 48 * H },
  { tipo: "48h",          label: "Mensagem 48h",    icone: "📞", horas: 48 * H, ateHoras: 72 * H },
  { tipo: "72h_feedback", label: "Pedir feedback",  icone: "⭐", horas: 72 * H, ateHoras: 7 * D },
  { tipo: "7d",           label: "Mensagem 7 dias", icone: "📞", horas: 7 * D,  ateHoras: 14 * D },
];

/** Todos os tipos de alerta de contato (usado como padrão quando não há config). */
export const TODOS_CONTATO = REGRAS_FOLLOW_UP.map(r => r.tipo);

/**
 * Alertas de contato habilitados para um procedimento.
 * - null/undefined  → padrão (todos), para compatibilidade com dados antigos
 * - array (mesmo []) → exatamente o configurado ([] = nenhum, ex.: depilação a laser)
 */
export function alertasContatoDe(alertas_contato: unknown): string[] {
  if (alertas_contato == null) return TODOS_CONTATO;
  if (Array.isArray(alertas_contato)) return alertas_contato.map(String);
  return TODOS_CONTATO;
}

/**
 * Retorna a regra devida agora para um atendimento (ou null se nenhuma).
 * `habilitados` limita quais tipos de alerta valem para o procedimento.
 */
export function regraDevida(
  atendidoEm: Date,
  agora: Date = new Date(),
  habilitados?: string[],
): RegraFollowUp | null {
  const horas = (agora.getTime() - atendidoEm.getTime()) / (1000 * 60 * 60);
  return REGRAS_FOLLOW_UP.find(r =>
    (!habilitados || habilitados.includes(r.tipo)) && horas >= r.horas && horas < r.ateHoras,
  ) ?? null;
}

// ── Retornos por procedimento ────────────────────────────────────────────────
// Configurados no cadastro do procedimento (ex.: botox = [3, 6] meses,
// remodelação = [12]). O alerta aparece quando completa o prazo e fica visível
// por 30 dias (janela de graça) ou até marcarem como feito.

export const DIAS_GRACA_RETORNO = 30;

/** Quantos meses no máximo olhamos para trás ao procurar retornos. */
export const MAX_MESES_RETORNO = 24;

export function addMeses(data: Date, meses: number): Date {
  const d = new Date(data);
  d.setMonth(d.getMonth() + meses);
  return d;
}

/** O retorno de `meses` para este atendimento está devido agora? */
export function retornoDevido(atendidoEm: Date, meses: number, agora: Date = new Date()): boolean {
  const inicio = addMeses(atendidoEm, meses);
  const fim = new Date(inicio.getTime() + DIAS_GRACA_RETORNO * 24 * 60 * 60 * 1000);
  return agora >= inicio && agora < fim;
}

/** Normaliza o que vier do banco ("3, 6" ou [3,6]) numa lista de meses válidos. */
export function normalizarRetornos(valor: unknown): number[] {
  const bruto = Array.isArray(valor)
    ? valor
    : typeof valor === "string"
      ? valor.split(",")
      : [];
  return bruto
    .map(v => Number(String(v).trim()))
    .filter(n => Number.isFinite(n) && n > 0 && n <= MAX_MESES_RETORNO)
    .sort((a, b) => a - b);
}
