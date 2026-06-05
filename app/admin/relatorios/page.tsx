"use client";

import { useEffect, useState, useCallback } from "react";

const tipos = [
  { key: "faturamento",  label: "Faturamento",  emoji: "💰" },
  { key: "atendimentos", label: "Atendimentos", emoji: "📅" },
  { key: "pacientes",    label: "Pacientes",    emoji: "👥" },
  { key: "estoque",      label: "Estoque",      emoji: "📦" },
  { key: "laser",        label: "Laser",        emoji: "✨" },
];

const statusCor: Record<string, { color: string; bg: string }> = {
  pago:          { color: "#7ae8a0", bg: "rgba(122,232,160,0.1)"  },
  pendente:      { color: "#e8c97a", bg: "rgba(232,201,122,0.1)"  },
  cancelado:     { color: "#e87a7a", bg: "rgba(232,122,122,0.1)"  },
  finalizado:    { color: "#a89080", bg: "rgba(168,144,128,0.1)"  },
  confirmado:    { color: "#7ae8a0", bg: "rgba(122,232,160,0.1)"  },
  em_tratamento: { color: "#7ab8e8", bg: "rgba(122,184,232,0.1)"  },
};

export default function RelatoriosPage() {
  const [tipo, setTipo] = useState("faturamento");
  const [dados, setDados] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [inicio, setInicio] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
  });
  const [fim, setFim] = useState(() => new Date().toISOString().slice(0, 10));

  const buscar = useCallback(async () => {
    setCarregando(true);
    const url = `/api/relatorios?tipo=${tipo}&inicio=${new Date(inicio).toISOString()}&fim=${new Date(fim + "T23:59:59").toISOString()}`;
    const res = await fetch(url);
    const data = await res.json();
    setDados(data.data ?? []);
    setCarregando(false);
  }, [tipo, inicio, fim]);

  useEffect(() => { buscar(); }, [buscar]);

  function exportarCSV() {
    if (dados.length === 0) return;
    const cols = Object.keys(dados[0]).filter(k => typeof dados[0][k] !== "object");
    const header = cols.join(",");
    const rows = dados.map(r => cols.map(c => `"${r[c] ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `relatorio-${tipo}-${inicio}-${fim}.csv`; a.click();
  }

  // KPIs calculados
  const kpis = (() => {
    if (tipo === "faturamento") {
      const pagos = dados.filter(r => r.status_pagamento === "pago");
      const total = pagos.reduce((s, r) => s + Number(r.valor_final || 0), 0);
      const pendente = dados.filter(r => r.status_pagamento === "pendente").reduce((s, r) => s + Number(r.valor_final || 0), 0);
      const ticket = pagos.length > 0 ? total / pagos.length : 0;
      return [
        { label: "Faturamento", valor: `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, cor: "var(--gold)" },
        { label: "Pendente",    valor: `R$ ${pendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, cor: "var(--warning)" },
        { label: "Ticket Médio",valor: `R$ ${ticket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, cor: "var(--info)" },
        { label: "Registros",   valor: dados.length, cor: "var(--success)" },
      ];
    }
    if (tipo === "atendimentos") {
      const finalizados = dados.filter(r => r.status === "finalizado").length;
      const cancelados  = dados.filter(r => r.status === "cancelado").length;
      return [
        { label: "Total",       valor: dados.length,  cor: "var(--gold)"    },
        { label: "Finalizados", valor: finalizados,    cor: "var(--success)" },
        { label: "Cancelados",  valor: cancelados,     cor: "var(--danger)"  },
        { label: "Taxa Conclusão", valor: dados.length > 0 ? `${Math.round(finalizados/dados.length*100)}%` : "0%", cor: "var(--info)" },
      ];
    }
    if (tipo === "pacientes") {
      const comTermo = dados.filter(r => r.assinou_termo).length;
      return [
        { label: "Total",      valor: dados.length,  cor: "var(--gold)"    },
        { label: "Com Termo",  valor: comTermo,       cor: "var(--success)" },
        { label: "Sem Termo",  valor: dados.length - comTermo, cor: "var(--danger)" },
      ];
    }
    if (tipo === "estoque") {
      const baixo = dados.filter(r => r.quantidade <= r.quantidade_minima).length;
      return [
        { label: "Itens",       valor: dados.length, cor: "var(--gold)"    },
        { label: "Estoque Baixo", valor: baixo,      cor: "var(--danger)"  },
      ];
    }
    if (tipo === "laser") {
      const ativos = dados.filter(r => r.status === "em_tratamento").length;
      const total  = dados.reduce((s, r) => s + Number(r.valor || 0), 0);
      return [
        { label: "Pacotes",  valor: dados.length, cor: "var(--gold)"    },
        { label: "Ativos",   valor: ativos,        cor: "var(--success)" },
        { label: "Receita",  valor: `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, cor: "var(--info)" },
      ];
    }
    return [];
  })();

  // Gráfico por procedimento (faturamento)
  const graficoProcedimento = (() => {
    if (tipo !== "faturamento") return [];
    const map: Record<string, number> = {};
    dados.filter(r => r.status_pagamento === "pago").forEach(r => {
      const nome = r.procedimentos?.nome ?? "Outros";
      map[nome] = (map[nome] || 0) + Number(r.valor_final || 0);
    });
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0, 5);
  })();

  const temFiltroData = ["faturamento", "atendimentos", "laser"].includes(tipo);
  const totalFaturamento = dados.filter(r => r.status_pagamento === "pago").reduce((s, r) => s + Number(r.valor_final || 0), 0);

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Gestão</p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Relatórios</h1>
        </div>
        <button onClick={exportarCSV} disabled={dados.length === 0}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{ background: dados.length > 0 ? "var(--gold)" : "var(--gold-bg)", color: dados.length > 0 ? "#0a0707" : "var(--text-muted)" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* Tipos */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-5">
        {tipos.map(t => (
          <button key={t.key} onClick={() => setTipo(t.key)}
            className="rounded-2xl p-4 text-center transition hover:scale-[1.02]"
            style={{
              background: tipo === t.key ? "var(--gold-bg)" : "var(--bg-card)",
              border: `1px solid ${tipo === t.key ? "var(--border-color)" : "var(--border-subtle)"}`,
            }}>
            <p className="text-xl mb-1">{t.emoji}</p>
            <p className="text-xs uppercase tracking-widest" style={{ color: tipo === t.key ? "var(--gold)" : "var(--text-muted)" }}>{t.label}</p>
          </button>
        ))}
      </div>

      {/* Filtro de data */}
      {temFiltroData && (
        <div className="flex gap-3 mb-5 flex-wrap items-end">
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>De</label>
            <input type="date" value={inicio} onChange={e => setInicio(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)", colorScheme: "dark" }} />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Até</label>
            <input type="date" value={fim} onChange={e => setFim(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)", colorScheme: "dark" }} />
          </div>
        </div>
      )}

      {/* KPIs */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {kpis.map(k => (
            <div key={k.label} className="rounded-2xl px-5 py-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <p className="text-xl font-bold" style={{ color: k.cor }}>{k.valor}</p>
              <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Gráfico procedimentos */}
      {graficoProcedimento.length > 0 && (
        <div className="rounded-3xl p-6 mb-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <h3 className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--gold)" }}>Top Procedimentos por Receita</h3>
          <div className="flex flex-col gap-3">
            {graficoProcedimento.map(([nome, valor]) => {
              const max = graficoProcedimento[0][1];
              const pct = Math.round((valor / max) * 100);
              return (
                <div key={nome}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{nome}</span>
                    <span className="text-sm font-semibold ml-2 flex-shrink-0" style={{ color: "var(--gold)" }}>
                      R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "var(--bg-input)" }}>
                    <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "var(--gold)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 className="text-xs uppercase tracking-widest" style={{ color: "var(--gold)" }}>
            {tipos.find(t => t.key === tipo)?.label} — {dados.length} registro{dados.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} />
          </div>
        ) : dados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">📊</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum dado no período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {tipo === "faturamento"  && ["Data","Paciente","Procedimento","Profissional","Valor","Desconto","Total","Forma","Status"].map(h => <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{h}</th>)}
                  {tipo === "atendimentos" && ["Data","Paciente","Procedimento","Profissional","Horário","Status"].map(h => <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{h}</th>)}
                  {tipo === "estoque"      && ["Nome","Categoria","Quantidade","Unidade","Mínimo","Status"].map(h => <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{h}</th>)}
                  {tipo === "pacientes"    && ["Nome","Telefone","Email","Nascimento","Termo","Cadastro"].map(h => <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{h}</th>)}
                  {tipo === "laser"        && ["Paciente","Áreas","Sessões","Progresso","Status","Pagamento","Valor"].map(h => <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {dados.map((row, i) => (
                  <tr key={i} className="transition hover:bg-[var(--bg-hover)]"
                    style={{ borderBottom: i < dados.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>

                    {tipo === "faturamento" && <>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{new Date(row.criado_em).toLocaleDateString("pt-BR")}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-primary)" }}>{row.pacientes?.nome ?? "—"}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{row.procedimentos?.nome ?? "—"}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{row.funcionarios?.nome ?? "—"}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-primary)" }}>R$ {Number(row.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--danger)" }}>{row.desconto > 0 ? `-R$ ${Number(row.desconto).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</td>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: "var(--gold)" }}>R$ {Number(row.valor_final).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{row.forma_pagamento}</td>
                      <td className="px-5 py-3"><span className="text-xs px-2 py-1 rounded-full" style={{ background: statusCor[row.status_pagamento]?.bg, color: statusCor[row.status_pagamento]?.color }}>{row.status_pagamento}</span></td>
                    </>}

                    {tipo === "atendimentos" && <>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{row.inicio ? new Date(row.inicio).toLocaleDateString("pt-BR") : "—"}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-primary)" }}>{row.pacientes?.nome ?? row.nome_temporario ?? "—"}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{row.procedimentos?.nome ?? row.procedimento ?? "—"}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{row.funcionarios?.nome ?? "—"}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{row.inicio ? new Date(row.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                      <td className="px-5 py-3"><span className="text-xs px-2 py-1 rounded-full" style={{ background: statusCor[row.status]?.bg, color: statusCor[row.status]?.color }}>{row.status}</span></td>
                    </>}

                    {tipo === "estoque" && <>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-primary)" }}>{row.nome}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{row.categoria ?? "—"}</td>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: row.quantidade <= row.quantidade_minima ? "var(--warning)" : "var(--success)" }}>{row.quantidade}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{row.unidade}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{row.quantidade_minima}</td>
                      <td className="px-5 py-3"><span className="text-xs px-2 py-1 rounded-full" style={{ background: row.quantidade <= row.quantidade_minima ? "var(--warning)" : "var(--success)", color: "#0a0707", opacity: 0.9 }}>{row.quantidade <= row.quantidade_minima ? "⚠ Baixo" : "OK"}</span></td>
                    </>}

                    {tipo === "pacientes" && <>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-primary)" }}>{row.nome}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{row.telefone}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{row.email ?? "—"}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{row.data_nascimento ? new Date(row.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                      <td className="px-5 py-3"><span className="text-xs px-2 py-1 rounded-full" style={{ background: row.assinou_termo ? "rgba(122,232,160,0.1)" : "rgba(232,122,122,0.1)", color: row.assinou_termo ? "var(--success)" : "var(--danger)" }}>{row.assinou_termo ? "✓ Sim" : "Não"}</span></td>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{new Date(row.criado_em).toLocaleDateString("pt-BR")}</td>
                    </>}

                    {tipo === "laser" && <>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-primary)" }}>{row.pacientes?.nome ?? "—"}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>{typeof row.procedimento === "string" ? row.procedimento : "—"}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{row.sessoes_feitas}/{row.total_sessoes}</td>
                      <td className="px-5 py-3" style={{ minWidth: 100 }}>
                        <div className="h-2 rounded-full" style={{ background: "var(--bg-input)" }}>
                          <div className="h-2 rounded-full" style={{ width: `${Math.round((row.sessoes_feitas/row.total_sessoes)*100)}%`, background: "var(--gold)" }} />
                        </div>
                      </td>
                      <td className="px-5 py-3"><span className="text-xs px-2 py-1 rounded-full" style={{ background: statusCor[row.status]?.bg, color: statusCor[row.status]?.color }}>{row.status}</span></td>
                      <td className="px-5 py-3"><span className="text-xs px-2 py-1 rounded-full" style={{ background: statusCor[row.status_pagamento]?.bg, color: statusCor[row.status_pagamento]?.color }}>{row.status_pagamento}</span></td>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: "var(--gold)" }}>{row.valor ? `R$ ${Number(row.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</td>
                    </>}
                  </tr>
                ))}
              </tbody>

              {/* Totalizador faturamento */}
              {tipo === "faturamento" && dados.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: "1px solid var(--border-color)", background: "var(--bg-input)" }}>
                    <td colSpan={6} className="px-5 py-3 text-xs uppercase tracking-widest text-right" style={{ color: "var(--text-muted)" }}>Total Recebido</td>
                    <td className="px-5 py-3 text-sm font-bold" style={{ color: "var(--gold)" }}>
                      R$ {totalFaturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
      <style>{`input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }`}</style>
    </div>
  );
}
