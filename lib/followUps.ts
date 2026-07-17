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

/** Retorna a regra devida agora para um atendimento (ou null se nenhuma). */
export function regraDevida(atendidoEm: Date, agora: Date = new Date()): RegraFollowUp | null {
  const horas = (agora.getTime() - atendidoEm.getTime()) / (1000 * 60 * 60);
  return REGRAS_FOLLOW_UP.find(r => horas >= r.horas && horas < r.ateHoras) ?? null;
}
