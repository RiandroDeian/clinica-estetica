"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { getCicloClinica, cicloAnterior, ciclosRecentes, cicloDeRef, type Ciclo } from "@/lib/ciclo";

type Kpi = { valor: number | null; valorAnterior: number | null; variacao: number | null; tem: boolean };
type Kpis = Record<string, Kpi>;

const fmtMoney = (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (v: number) => v.toLocaleString("pt-BR");

// Configuração dos cards do Dashboard: rótulo, chave, formato, direção "boa".
const CARDS: { key: string; label: string; tipo: "money" | "int"; bomSobe: boolean }[] = [
  { key: "pacientes_novos", label: "Pacientes novos",   tipo: "int",   bomSobe: true },
  { key: "agendamentos",    label: "Agendamentos",      tipo: "int",   bomSobe: true },
  { key: "comparecimentos", label: "Comparecimentos",   tipo: "int",   bomSobe: true },
  { key: "nao_compareceu",  label: "Não compareceu",    tipo: "int",   bomSobe: false },
  { key: "orcamentos",      label: "Orçamentos",        tipo: "int",   bomSobe: true },
  { key: "fechamentos",     label: "Fechamentos",       tipo: "int",   bomSobe: true },
  { key: "taxa_conversao",  label: "Taxa de conversão", tipo: "int",   bomSobe: true },
  { key: "valor_proposto",  label: "Valor proposto",    tipo: "money", bomSobe: true },
  { key: "valor_fechado",   label: "Valor fechado",     tipo: "money", bomSobe: true },
  { key: "valor_recebido",  label: "Valor recebido",    tipo: "money", bomSobe: true },
  { key: "valor_executado", label: "Valor executado",   tipo: "money", bomSobe: true },
  { key: "ticket_medio",    label: "Ticket médio",      tipo: "money", bomSobe: true },
  { key: "aproveitamento",  label: "Aproveitam. proposta", tipo: "int", bomSobe: true },
  { key: "valor_perdido",   label: "Valor perdido",     tipo: "money", bomSobe: false },
  { key: "inadimplencia",   label: "Inadimplência",     tipo: "money", bomSobe: false },
];

// Indicadores que podem virar meta (mapeiam para uma chave de KPI com valor real).
const INDICADORES_META = [
  { key: "valor_fechado",   label: "Valor fechado",   tipo: "money" },
  { key: "valor_recebido",  label: "Valor recebido",  tipo: "money" },
  { key: "valor_executado", label: "Valor executado", tipo: "money" },
  { key: "pacientes_novos", label: "Pacientes novos", tipo: "int" },
  { key: "comparecimentos", label: "Comparecimentos", tipo: "int" },
  { key: "fechamentos",     label: "Fechamentos",     tipo: "int" },
];

const ORIGENS = ["Instagram", "Facebook", "Google", "Anúncio pago", "Indicação de paciente", "Indicação de parceiro", "Passou em frente", "Já era paciente", "Outro"];

const ABAS = [
  { key: "dashboard",     label: "Dashboard",     ativa: true },
  { key: "financeiro",    label: "Financeiro",    ativa: true },
  { key: "procedimentos", label: "Procedimentos", ativa: true },
  { key: "origem",        label: "Origem",        ativa: true },
  { key: "metas",         label: "Metas",         ativa: true },
  { key: "historico",     label: "Histórico",     ativa: true },
  { key: "funil",         label: "Funil",         ativa: true },
  { key: "relatorios",    label: "Relatórios",    ativa: true },
  { key: "config",        label: "Configurações", ativa: true },
];

export default function GestaoPage() {
  const [aba, setAba] = useState("dashboard");

  // ==== Ciclo selecionado ====
  const ciclosLista = useMemo(() => ciclosRecentes(12).slice().reverse(), []); // recente -> antigo
  const cicloAtual = useMemo(() => getCicloClinica(), []);
  const [cicloRef, setCicloRef] = useState(cicloAtual.ref);
  const [custom, setCustom] = useState<{ ativo: boolean; inicio: string; fim: string }>({ ativo: false, inicio: "", fim: "" });

  const ciclo: Ciclo = useMemo(() => {
    if (custom.ativo && custom.inicio && custom.fim) {
      return { inicio: new Date(custom.inicio), fim: new Date(custom.fim), ref: "custom", label: `${new Date(custom.inicio).toLocaleDateString("pt-BR")} → ${new Date(custom.fim).toLocaleDateString("pt-BR")}` };
    }
    return cicloDeRef(cicloRef);
  }, [cicloRef, custom]);
  const anterior = useMemo(() => (custom.ativo ? null : cicloAnterior(ciclo)), [ciclo, custom.ativo]);

  const qs = useMemo(() => {
    const p = new URLSearchParams({ inicio: ciclo.inicio.toISOString(), fim: ciclo.fim.toISOString() });
    if (anterior) { p.set("inicioAnt", anterior.inicio.toISOString()); p.set("fimAnt", anterior.fim.toISOString()); }
    return p.toString();
  }, [ciclo, anterior]);

  // ==== Dados ====
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [drill, setDrill] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [procs, setProcs] = useState<any[]>([]);
  const [origem, setOrigem] = useState<any[]>([]);
  const [funil, setFunil] = useState<any>(null);
  const [perdas, setPerdas] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [metas, setMetas] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [modalDrill, setModalDrill] = useState<{ titulo: string; itens: any[] } | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const per = `inicio=${ciclo.inicio.toISOString()}&fim=${ciclo.fim.toISOString()}`;
    const [rK, rP, rO, rF, rL] = await Promise.all([
      fetch(`/api/gestao?${qs}`).then(r => r.json()),
      fetch(`/api/gestao/procedimentos?${per}`).then(r => r.json()),
      fetch(`/api/gestao/origem?${per}`).then(r => r.json()),
      fetch(`/api/gestao/funil?${per}`).then(r => r.json()),
      fetch(`/api/gestao/perdas?${per}`).then(r => r.json()),
    ]);
    setKpis(rK?.kpis ?? null);
    setDrill(rK?.drill ?? null);
    setProcs(Array.isArray(rP) ? rP : []);
    setOrigem(Array.isArray(rO) ? rO : []);
    setFunil(rF && !rF.erro ? rF : null);
    setPerdas(Array.isArray(rL) ? rL : []);
    setCarregando(false);
  }, [qs, ciclo]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { fetch("/api/funcionarios").then(r => r.json()).then(d => setFuncionarios(Array.isArray(d) ? d : [])); }, []);

  // Histórico (carrega ao abrir a aba)
  useEffect(() => {
    if (aba !== "historico") return;
    const ranges = ciclosRecentes(6).map(c => ({ label: c.label.split(" → ")[0], inicio: c.inicio.toISOString(), fim: c.fim.toISOString() }));
    fetch(`/api/gestao/historico?ranges=${encodeURIComponent(JSON.stringify(ranges))}`).then(r => r.json()).then(d => setHistorico(Array.isArray(d) ? d : []));
  }, [aba]);

  // Metas (carrega ao abrir a aba / trocar ciclo)
  const carregarMetas = useCallback(() => {
    if (ciclo.ref === "custom") { setMetas([]); return; }
    fetch(`/api/gestao/metas?ciclo_inicio=${ciclo.ref}`).then(r => r.json()).then(d => setMetas(Array.isArray(d) ? d : []));
  }, [ciclo.ref]);
  useEffect(() => { if (aba === "metas") carregarMetas(); }, [aba, carregarMetas]);

  const abrirDrill = (key: string) => {
    if (key === "pacientes_novos" && drill?.pacientes_novos) setModalDrill({ titulo: "Pacientes novos", itens: drill.pacientes_novos.map((p: any) => ({ nome: p.nome, extra: p.origem || "Sem origem", data: p.data })) });
    if (key === "fechamentos" && drill?.fechamentos) setModalDrill({ titulo: "Fechamentos", itens: drill.fechamentos.map((f: any) => ({ nome: `${f.tipo} · ${f.nome}`, extra: fmtMoney(f.valor), data: f.data })) });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--gold)" }}>Gestão e Indicadores</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Camada de gestão sobre os dados da clínica — ciclo real 15 → 15.</p>
      </div>

      {/* Filtro de ciclo */}
      <div className="rounded-3xl p-4 flex flex-wrap items-center gap-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="flex-1 min-w-[220px]">
          <p className="text-[11px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Ciclo atual</p>
          <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{ciclo.label}</p>
        </div>
        {!custom.ativo && (
          <select value={cicloRef} onChange={e => setCicloRef(e.target.value)}
            className="rounded-2xl px-4 py-2.5 text-sm outline-none"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
            {ciclosLista.map((c, i) => (
              <option key={c.ref} value={c.ref}>{i === 0 ? "Ciclo atual — " : i === 1 ? "Ciclo anterior — " : ""}{c.label}</option>
            ))}
          </select>
        )}
        {custom.ativo && (
          <div className="flex items-center gap-2">
            <input type="date" value={custom.inicio} onChange={e => setCustom(c => ({ ...c, inicio: e.target.value }))} className="rounded-2xl px-3 py-2 text-sm outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)", colorScheme: "dark" }} />
            <span style={{ color: "var(--text-muted)" }}>→</span>
            <input type="date" value={custom.fim} onChange={e => setCustom(c => ({ ...c, fim: e.target.value }))} className="rounded-2xl px-3 py-2 text-sm outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)", colorScheme: "dark" }} />
          </div>
        )}
        <button onClick={() => setCustom(c => ({ ...c, ativo: !c.ativo }))}
          className="rounded-2xl px-4 py-2.5 text-sm transition"
          style={{ background: custom.ativo ? "var(--gold-bg)" : "var(--bg-input)", color: custom.ativo ? "var(--gold)" : "var(--text-muted)", border: "1px solid var(--border-color)" }}>
          {custom.ativo ? "Usar ciclos" : "Personalizado"}
        </button>
      </div>

      {/* Abas */}
      <div className="flex gap-2 flex-wrap">
        {ABAS.map(a => (
          <button key={a.key} onClick={() => a.ativa && setAba(a.key)} disabled={!a.ativa}
            className="px-4 py-2 rounded-2xl text-sm font-medium transition"
            style={{
              background: aba === a.key ? "var(--gold)" : "var(--bg-card)",
              color: aba === a.key ? "#0a0707" : a.ativa ? "var(--text-muted)" : "var(--text-muted)",
              border: "1px solid var(--border-color)",
              opacity: a.ativa ? 1 : 0.45,
              cursor: a.ativa ? "pointer" : "not-allowed",
            }}
            title={a.ativa ? "" : "Em breve — depende da captura de orçamentos (Fase 2)"}>
            {a.label}{!a.ativa && " 🔒"}
          </button>
        ))}
      </div>

      {carregando ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : (
        <>
          {aba === "dashboard" && kpis && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {CARDS.map(c => <CardKpi key={c.key} cfg={c} kpi={kpis[c.key]} onClick={() => abrirDrill(c.key)} />)}
            </div>
          )}

          {aba === "financeiro" && kpis && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { key: "valor_proposto", label: "Valor proposto" },
                { key: "valor_fechado", label: "Valor fechado" },
                { key: "valor_recebido", label: "Valor recebido" },
                { key: "valor_executado", label: "Valor executado" },
                { key: "a_executar", label: "A executar" },
              ].map(f => <CardKpi key={f.key} cfg={{ key: f.key, label: f.label, tipo: "money", bomSobe: true }} kpi={kpis[f.key]} />)}
              <div className="col-span-2 md:col-span-3 lg:col-span-5 text-xs" style={{ color: "var(--text-muted)" }}>
                <strong>Fechado</strong> = contratos laser + pacotes registrados no ciclo · <strong>Recebido</strong> = faturamentos pagos + parcelas de boleto recebidas no ciclo · <strong>Executado</strong> = sessões realizadas no ciclo · <strong>A executar</strong> = fechado acumulado − executado acumulado.
              </div>
            </div>
          )}

          {aba === "procedimentos" && (
            <TabelaSimples
              vazio="Nenhum procedimento no ciclo"
              cols={["Procedimento", "Qtd", "Sessões", "Valor vendido", "Ticket"]}
              linhas={procs.map(p => [p.nome, fmtInt(p.qtd), fmtInt(p.sessoes), fmtMoney(p.valor), p.ticket != null ? fmtMoney(p.ticket) : "—"])}
              alinhamentos={["left", "right", "right", "right", "right"]}
            />
          )}

          {aba === "origem" && (
            <TabelaSimples
              vazio="Sem dados de origem no ciclo"
              cols={["Origem", "Novos", "Agendados", "Compareceram", "Fechamentos", "Conversão", "Valor"]}
              linhas={origem.map(o => [o.origem, fmtInt(o.novos), fmtInt(o.agendados), fmtInt(o.compareceram), fmtInt(o.fechamentos), o.conversao != null ? `${o.conversao.toFixed(0)}%` : "—", fmtMoney(o.valor)])}
              alinhamentos={["left", "right", "right", "right", "right", "right", "right"]}
              rodape={origem.length > 0 ? ["Total", fmtInt(origem.reduce((s, o) => s + o.novos, 0)), fmtInt(origem.reduce((s, o) => s + o.agendados, 0)), fmtInt(origem.reduce((s, o) => s + o.compareceram, 0)), fmtInt(origem.reduce((s, o) => s + o.fechamentos, 0)), "", fmtMoney(origem.reduce((s, o) => s + o.valor, 0))] : undefined}
            />
          )}

          {aba === "metas" && (
            <MetasTab ciclo={ciclo} kpis={kpis} metas={metas} funcionarios={funcionarios} onChange={carregarMetas} />
          )}

          {aba === "historico" && (
            <HistoricoTab dados={historico} />
          )}

          {aba === "funil" && (
            <FunilTab funil={funil} perdas={perdas} />
          )}

          {aba === "relatorios" && kpis && (
            <RelatoriosTab kpis={kpis} ciclo={ciclo} procs={procs} origem={origem} />
          )}

          {aba === "config" && (
            <ConfigTab ciclo={ciclo} />
          )}
        </>
      )}

      {/* Modal drill-down */}
      {modalDrill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={e => { if (e.target === e.currentTarget) setModalDrill(null); }}>
          <div className="w-full max-w-lg rounded-3xl p-6 max-h-[85vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>{modalDrill.titulo} ({modalDrill.itens.length})</h2>
              <button onClick={() => setModalDrill(null)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            {modalDrill.itens.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Nenhum registro.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {modalDrill.itens.map((it, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm" style={{ color: "var(--text-primary)" }}>{it.nome}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{it.extra}</p>
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{it.data ? new Date(it.data).toLocaleDateString("pt-BR") : ""}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Card de KPI =====
function CardKpi({ cfg, kpi, onClick }: { cfg: { key: string; label: string; tipo: "money" | "int"; bomSobe: boolean }; kpi?: Kpi; onClick?: () => void }) {
  const tem = kpi?.tem && kpi.valor != null;
  const valorTxt = tem ? (cfg.tipo === "money" ? fmtMoney(kpi!.valor as number) : fmtInt(kpi!.valor as number)) : "—";
  const v = kpi?.variacao;
  const clicavel = !!onClick && (cfg.key === "pacientes_novos" || cfg.key === "fechamentos") && tem;

  let corVar = "var(--text-muted)";
  let seta = "";
  if (v != null) {
    const melhora = cfg.bomSobe ? v >= 0 : v <= 0;
    corVar = melhora ? "#7ae8a0" : "#e87a7a";
    seta = v > 0 ? "↑" : v < 0 ? "↓" : "→";
  }

  return (
    <button onClick={clicavel ? onClick : undefined}
      className="rounded-2xl p-4 text-left transition"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", cursor: clicavel ? "pointer" : "default" }}>
      <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{cfg.label}</p>
      <p className="text-lg font-bold" style={{ color: tem ? "var(--text-primary)" : "var(--text-muted)" }}>{valorTxt}</p>
      {v != null ? (
        <p className="text-xs mt-1" style={{ color: corVar }}>{seta} {Math.abs(v).toFixed(1)}% <span style={{ color: "var(--text-muted)" }}>vs ant.</span></p>
      ) : (
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{tem ? "sem ciclo anterior" : "sem captura"}</p>
      )}
      {clicavel && <p className="text-[10px] mt-1" style={{ color: "var(--gold)" }}>ver lista →</p>}
    </button>
  );
}

// ===== Tabela genérica =====
function TabelaSimples({ cols, linhas, alinhamentos, vazio, rodape }: { cols: string[]; linhas: (string | number)[][]; alinhamentos: ("left" | "right")[]; vazio: string; rodape?: (string | number)[] }) {
  if (linhas.length === 0) {
    return <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}><p className="text-4xl mb-3">📊</p><p style={{ color: "var(--text-muted)" }}>{vazio}</p></div>;
  }
  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            {cols.map((c, i) => <th key={c} className="px-4 py-3 text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)", textAlign: alinhamentos[i] }}>{c}</th>)}
          </tr></thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {l.map((cel, j) => <td key={j} className="px-4 py-3 text-sm" style={{ color: j === 0 ? "var(--text-primary)" : "var(--text-secondary)", textAlign: alinhamentos[j] }}>{cel}</td>)}
              </tr>
            ))}
            {rodape && (
              <tr style={{ background: "var(--bg-input)" }}>
                {rodape.map((cel, j) => <td key={j} className="px-4 py-3 text-sm font-bold" style={{ color: "var(--gold)", textAlign: alinhamentos[j] }}>{cel}</td>)}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== Aba Metas =====
function MetasTab({ ciclo, kpis, metas, funcionarios, onChange }: { ciclo: Ciclo; kpis: Kpis | null; metas: any[]; funcionarios: any[]; onChange: () => void }) {
  const [form, setForm] = useState({ indicador: "valor_fechado", meta_valor: "", responsavel_id: "", observacao: "" });
  const [salvando, setSalvando] = useState(false);
  const custom = ciclo.ref === "custom";

  const cicloInicio = ciclo.inicio.toISOString().slice(0, 10);
  const cicloFim = ciclo.fim.toISOString().slice(0, 10);

  async function salvar() {
    if (custom) { toast.error("Selecione um ciclo (não personalizado) para cadastrar meta"); return; }
    if (!form.meta_valor) { toast.error("Informe o valor da meta"); return; }
    setSalvando(true);
    const res = await fetch("/api/gestao/metas", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ciclo_inicio: ciclo.ref, ciclo_fim: cicloFim, indicador: form.indicador, meta_valor: Number(form.meta_valor), responsavel_id: form.responsavel_id || null, observacao: form.observacao || null }),
    });
    if (res.ok) { toast.success("Meta cadastrada!"); setForm({ indicador: "valor_fechado", meta_valor: "", responsavel_id: "", observacao: "" }); onChange(); }
    else { const d = await res.json().catch(() => ({})); toast.error(d.erro ? `Erro: ${d.erro}` : "Erro ao salvar"); }
    setSalvando(false);
  }
  async function excluir(id: string) {
    if (!confirm("Excluir esta meta?")) return;
    const res = await fetch(`/api/gestao/metas?id=${id}`, { method: "DELETE" });
    if (res.ok) onChange(); else toast.error("Erro ao excluir");
  }

  const infoInd = (key: string) => INDICADORES_META.find(i => i.key === key);
  const realizado = (key: string) => kpis?.[key]?.tem ? (kpis[key].valor ?? 0) : null;

  return (
    <div className="flex flex-col gap-4">
      {custom && <p className="text-xs" style={{ color: "var(--warning)" }}>Metas usam ciclos da clínica. Saia do modo "Personalizado" para cadastrar/ver metas.</p>}

      {/* Formulário */}
      <div className="rounded-3xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div>
          <label className="text-[11px] block mb-1" style={{ color: "var(--text-muted)" }}>Indicador</label>
          <select value={form.indicador} onChange={e => setForm(f => ({ ...f, indicador: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={inp}>
            {INDICADORES_META.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] block mb-1" style={{ color: "var(--text-muted)" }}>Meta</label>
          <input type="number" value={form.meta_valor} onChange={e => setForm(f => ({ ...f, meta_valor: e.target.value }))} placeholder="0" className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={inp} />
        </div>
        <div>
          <label className="text-[11px] block mb-1" style={{ color: "var(--text-muted)" }}>Responsável</label>
          <select value={form.responsavel_id} onChange={e => setForm(f => ({ ...f, responsavel_id: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={inp}>
            <option value="">—</option>
            {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>
        <div className="md:col-span-1">
          <label className="text-[11px] block mb-1" style={{ color: "var(--text-muted)" }}>Observação</label>
          <input value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={inp} />
        </div>
        <div className="flex items-end">
          <button onClick={salvar} disabled={salvando || custom} className="w-full py-2 rounded-xl text-sm font-semibold" style={{ background: custom ? "rgba(200,160,120,0.3)" : "var(--gold)", color: "#0a0707" }}>{salvando ? "..." : "+ Meta"}</button>
        </div>
      </div>

      {/* Lista de metas do ciclo */}
      {metas.length === 0 ? (
        <div className="text-center py-12 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}><p className="text-3xl mb-2">🎯</p><p style={{ color: "var(--text-muted)" }}>Nenhuma meta neste ciclo</p></div>
      ) : (
        <div className="flex flex-col gap-3">
          {metas.map(m => {
            const info = infoInd(m.indicador);
            const real = realizado(m.indicador);
            const meta = Number(m.meta_valor) || 0;
            const pct = meta > 0 && real != null ? Math.min(100, Math.round((real / meta) * 100)) : null;
            const fmt = (v: number) => info?.tipo === "money" ? fmtMoney(v) : fmtInt(v);
            return (
              <div key={m.id} className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{info?.label ?? m.indicador}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Meta: {fmt(meta)}{m.funcionarios?.nome ? ` · ${m.funcionarios.nome}` : ""}{m.observacao ? ` · ${m.observacao}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: "var(--gold)" }}>{real != null ? fmt(real) : "—"}</p>
                    <button onClick={() => excluir(m.id)} className="text-[11px]" style={{ color: "#e87a7a" }}>excluir</button>
                  </div>
                </div>
                {pct != null && (
                  <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? "#7ae8a0" : "var(--gold)" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== Aba Histórico =====
function HistoricoTab({ dados }: { dados: any[] }) {
  const [modo, setModo] = useState<"grafico" | "tabela">("grafico");
  const max = Math.max(1, ...dados.map(d => Math.max(d.fechado, d.recebido, d.executado)));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["grafico", "tabela"] as const).map(m => (
          <button key={m} onClick={() => setModo(m)} className="px-3 py-1.5 rounded-xl text-xs capitalize" style={{ background: modo === m ? "var(--gold-bg)" : "var(--bg-card)", color: modo === m ? "var(--gold)" : "var(--text-muted)", border: "1px solid var(--border-color)" }}>{m}</button>
        ))}
      </div>
      {dados.length === 0 ? (
        <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}><p style={{ color: "var(--text-muted)" }}>Carregando histórico...</p></div>
      ) : modo === "tabela" ? (
        <TabelaSimples cols={["Ciclo", "Fechado", "Recebido", "Executado"]} alinhamentos={["left", "right", "right", "right"]} vazio="Sem dados"
          linhas={dados.map(d => [d.label, fmtMoney(d.fechado), fmtMoney(d.recebido), fmtMoney(d.executado)])} />
      ) : (
        <div className="rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="flex items-end gap-4 h-56">
            {dados.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-1 flex-1 w-full justify-center">
                  {[{ v: d.fechado, c: "var(--gold)" }, { v: d.recebido, c: "#7ae8a0" }, { v: d.executado, c: "#7ab8e8" }].map((b, j) => (
                    <div key={j} title={fmtMoney(b.v)} style={{ width: 14, height: `${(b.v / max) * 100}%`, background: b.c, borderRadius: 4, minHeight: 2 }} />
                  ))}
                </div>
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{d.label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 justify-center text-xs">
            <span style={{ color: "var(--gold)" }}>■ Fechado</span>
            <span style={{ color: "#7ae8a0" }}>■ Recebido</span>
            <span style={{ color: "#7ab8e8" }}>■ Executado</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Aba Funil =====
function FunilTab({ funil, perdas }: { funil: any; perdas: any[] }) {
  if (!funil) return <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}><p style={{ color: "var(--text-muted)" }}>Sem dados de funil no ciclo</p></div>;
  const etapas = funil.etapas ?? [];
  const maxQtd = Math.max(1, ...etapas.map((e: any) => e.qtd));
  const corEtapa: Record<string, string> = { lead: "#a89bcc", agendado: "#7ab8e8", compareceu: "#7ae8a0", orcamento: "var(--gold)", fechado: "#7ae8a0", perdido: "#e87a7a" };

  return (
    <div className="flex flex-col gap-4">
      {/* Resumo */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-2xl px-4 py-3 flex-1 min-w-[160px]" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <p className="text-[11px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Conversão total</p>
          <p className="text-lg font-bold" style={{ color: "var(--gold)" }}>{funil.conversaoTotal != null ? `${funil.conversaoTotal.toFixed(1)}%` : "—"}</p>
        </div>
        <div className="rounded-2xl px-4 py-3 flex-1 min-w-[160px]" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <p className="text-[11px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Valor movimentado</p>
          <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{fmtMoney(funil.valorMovimentado ?? 0)}</p>
        </div>
      </div>

      {/* Barras do funil */}
      <div className="rounded-3xl p-5 flex flex-col gap-2" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        {etapas.map((e: any) => (
          <div key={e.key} className="flex items-center gap-3">
            <span className="text-xs w-24 flex-shrink-0" style={{ color: "var(--text-secondary)" }}>{e.label}</span>
            <div className="flex-1 h-8 rounded-lg overflow-hidden" style={{ background: "var(--bg-input)" }}>
              <div className="h-full rounded-lg flex items-center px-2" style={{ width: `${Math.max(4, (e.qtd / maxQtd) * 100)}%`, background: corEtapa[e.key] ?? "var(--gold)", minWidth: 32 }}>
                <span className="text-xs font-bold" style={{ color: "#0a0707" }}>{fmtInt(e.qtd)}</span>
              </div>
            </div>
            <span className="text-xs w-28 text-right flex-shrink-0" style={{ color: "var(--text-muted)" }}>
              {e.valor > 0 ? fmtMoney(e.valor) : ""}
              {e.conversao != null ? `  ${e.conversao.toFixed(0)}%` : ""}
            </span>
          </div>
        ))}
      </div>

      {/* Motivos de perda */}
      <div>
        <h3 className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--gold)" }}>Motivos de perda</h3>
        <TabelaSimples cols={["Motivo", "Qtd", "Valor perdido"]} alinhamentos={["left", "right", "right"]} vazio="Nenhuma perda registrada no ciclo"
          linhas={perdas.map(p => [p.motivo, fmtInt(p.qtd), fmtMoney(p.valor)])} />
      </div>
    </div>
  );
}

// ===== Aba Relatórios =====
function RelatoriosTab({ kpis, ciclo, procs, origem }: { kpis: Kpis; ciclo: Ciclo; procs: any[]; origem: any[] }) {
  const linhas = CARDS.map(c => {
    const k = kpis[c.key];
    const val = k?.tem && k.valor != null ? (c.tipo === "money" ? fmtMoney(k.valor) : fmtInt(k.valor)) : "—";
    const ant = k?.valorAnterior != null ? (c.tipo === "money" ? fmtMoney(k.valorAnterior) : fmtInt(k.valorAnterior)) : "—";
    const varr = k?.variacao != null ? `${k.variacao > 0 ? "+" : ""}${k.variacao.toFixed(1)}%` : "—";
    return { indicador: c.label, val, ant, varr };
  });

  function exportarCSV() {
    const linhasCsv = [["Indicador", "Ciclo", "Ciclo anterior", "Variação"], ...linhas.map(l => [l.indicador, l.val, l.ant, l.varr])];
    const csv = linhasCsv.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gestao-${ciclo.ref}.csv`;
    a.click();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Consolidado do ciclo <strong style={{ color: "var(--text-primary)" }}>{ciclo.label}</strong></p>
        <button onClick={exportarCSV} className="px-4 py-2 rounded-2xl text-sm font-semibold" style={{ background: "var(--gold)", color: "#0a0707" }}>⬇ Exportar CSV</button>
      </div>
      <TabelaSimples cols={["Indicador", "Ciclo", "Ciclo anterior", "Variação"]} alinhamentos={["left", "right", "right", "right"]} vazio="Sem dados"
        linhas={linhas.map(l => [l.indicador, l.val, l.ant, l.varr])} />
      <h3 className="text-xs uppercase tracking-widest" style={{ color: "var(--gold)" }}>Procedimentos</h3>
      <TabelaSimples cols={["Procedimento", "Qtd", "Sessões", "Valor"]} alinhamentos={["left", "right", "right", "right"]} vazio="Sem dados"
        linhas={procs.map(p => [p.nome, fmtInt(p.qtd), fmtInt(p.sessoes), fmtMoney(p.valor)])} />
      <h3 className="text-xs uppercase tracking-widest" style={{ color: "var(--gold)" }}>Origem</h3>
      <TabelaSimples cols={["Origem", "Novos", "Fechamentos", "Valor"]} alinhamentos={["left", "right", "right", "right"]} vazio="Sem dados"
        linhas={origem.map(o => [o.origem, fmtInt(o.novos), fmtInt(o.fechamentos), fmtMoney(o.valor)])} />
    </div>
  );
}

// ===== Aba Configurações =====
function ConfigTab({ ciclo }: { ciclo: Ciclo }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <h3 className="text-sm font-bold mb-2" style={{ color: "var(--gold)" }}>Ciclo da clínica</h3>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>O período de análise vai do <strong>dia 15</strong> ao <strong>dia 15</strong> do mês seguinte (o dia 15 pertence ao ciclo que começa nele). Ciclo atual selecionado: <strong style={{ color: "var(--text-primary)" }}>{ciclo.label}</strong>.</p>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>Regra central em <code>lib/ciclo.ts</code> — usada por todos os indicadores, metas e relatórios.</p>
      </div>
      <div className="rounded-3xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <h3 className="text-sm font-bold mb-2" style={{ color: "var(--gold)" }}>Origens de paciente</h3>
        <div className="flex flex-wrap gap-2">
          {ORIGENS.map(o => <span key={o} className="text-xs px-3 py-1 rounded-full" style={{ background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>{o}</span>)}
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>Definidas no cadastro do paciente (aba Pacientes / Recepção).</p>
      </div>
      <div className="rounded-3xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <h3 className="text-sm font-bold mb-2" style={{ color: "var(--gold)" }}>Funil de vendas</h3>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>O funil usa os <strong>orçamentos</strong>: proposta enviada → <strong>aprovado</strong> (fechado, pela data de fechamento) ou <strong>recusado/expirado</strong> (perdido, com motivo). Registre os orçamentos na aba Orçamentos para alimentar conversão, valor proposto e motivos de perda.</p>
      </div>
    </div>
  );
}

const inp = { background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } as const;
