"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

type Funcionario = {
  id: string; nome: string; cargo: string; cor: string;
  meta_atendimentos: number; meta_faturamento: number;
  meta_mensal: number; comissao_percentual: number;
};

type Resultado = {
  funcionario: Funcionario;
  atendimentos: number;
  faturamento: number;
  pct_atendimentos: number;
  pct_faturamento: number;
};

export default function MetasPage() {
  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7);
  const [mes, setMes] = useState(mesAtual);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<{ id: string; campo: string } | null>(null);
  const [novoValor, setNovoValor] = useState("");
  const [salvando, setSalvando] = useState(false);

  const buscar = useCallback(async () => {
    setCarregando(true);
    const [funcsRes, agsRes] = await Promise.all([
      fetch("/api/funcionarios").then(r => r.json()),
      fetch("/api/comissoes?mes=" + mes).then(r => r.json()),
    ]);
    const funcs: Funcionario[] = Array.isArray(funcsRes) ? funcsRes : [];
    const ags: any[] = Array.isArray(agsRes) ? agsRes : [];
    const res: Resultado[] = funcs.map(f => {
      const ag = ags.find(a => a.id === f.id);
      const atendimentos = ag?.atendimentos ?? 0;
      const faturamento = ag?.total_bruto ?? 0;
      return {
        funcionario: f,
        atendimentos,
        faturamento,
        pct_atendimentos: f.meta_atendimentos > 0 ? Math.min(100, Math.round((atendimentos / f.meta_atendimentos) * 100)) : 0,
        pct_faturamento: f.meta_faturamento > 0 ? Math.min(100, Math.round((faturamento / f.meta_faturamento) * 100)) : 0,
      };
    });
    setResultados(res);
    setCarregando(false);
  }, [mes]);

  useEffect(() => { buscar(); }, [buscar]);

  async function salvarMeta(id: string, campo: string, valor: number) {
    setSalvando(true);
    const res = await fetch("/api/funcionarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [campo]: valor }),
    });
    if (res.ok) { toast.success("Meta salva!"); setEditando(null); buscar(); }
    else toast.error("Erro ao salvar");
    setSalvando(false);
  }

  const meses = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    return { value: d.toISOString().slice(0, 7), label: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) };
  });

  const totalAtendimentos = resultados.reduce((acc, r) => acc + r.atendimentos, 0);
  const totalFaturamento = resultados.reduce((acc, r) => acc + r.faturamento, 0);
  const totalMetaAts = resultados.reduce((acc, r) => acc + (r.funcionario.meta_atendimentos || 0), 0);
  const totalMetaFat = resultados.reduce((acc, r) => acc + (r.funcionario.meta_faturamento || 0), 0);

  const inpStyle = { background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" };

  function CampoEditavel({ id, campo, valor, prefix = "", suffix = "" }: { id: string; campo: string; valor: number; prefix?: string; suffix?: string }) {
    const editandoEsse = editando?.id === id && editando?.campo === campo;
    if (editandoEsse) return (
      <div className="flex items-center gap-1">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{prefix}</span>
        <input type="number" min="0" value={novoValor} onChange={e => setNovoValor(e.target.value)}
          className="w-24 rounded-xl px-2 py-1 text-sm outline-none" style={inpStyle} autoFocus />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{suffix}</span>
        <button onClick={() => salvarMeta(id, campo, Number(novoValor))} disabled={salvando}
          className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: "var(--gold)", color: "#0a0707" }}>
          {salvando ? "..." : "OK"}
        </button>
        <button onClick={() => setEditando(null)} className="text-xs" style={{ color: "var(--text-muted)" }}>✕</button>
      </div>
    );
    return (
      <button onClick={() => { setEditando({ id, campo }); setNovoValor(String(valor)); }}
        className="text-sm px-2 py-0.5 rounded-lg transition hover:opacity-70"
        style={{ background: "var(--bg-input)", color: valor > 0 ? "var(--gold)" : "var(--text-muted)" }}>
        {valor > 0 ? prefix + valor.toLocaleString("pt-BR") + suffix : "Definir meta"} ✏
      </button>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Desempenho</p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Metas por Profissional</h1>
        </div>
        <select value={mes} onChange={e => setMes(e.target.value)}
          className="rounded-2xl px-4 py-3 text-sm outline-none" style={inpStyle}>
          {meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Atendimentos", valor: totalAtendimentos, meta: totalMetaAts, cor: "var(--gold)", fmt: (v: number) => String(v) },
          { label: "Meta Atendimentos", valor: totalMetaAts, meta: 0, cor: "var(--text-muted)", fmt: (v: number) => String(v) },
          { label: "Faturamento Total", valor: totalFaturamento, meta: totalMetaFat, cor: "var(--success)", fmt: (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) },
          { label: "Meta Faturamento", valor: totalMetaFat, meta: 0, cor: "var(--text-muted)", fmt: (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) },
        ].map(k => (
          <div key={k.label} className="rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <p className="text-xl font-bold" style={{ color: k.cor }}>{k.fmt(k.valor)}</p>
            <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>{k.label}</p>
          </div>
        ))}
      </div>

      {carregando ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {resultados.map(r => (
            <div key={r.funcionario.id} className="rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <div className="flex items-center gap-4 mb-5 flex-wrap">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ background: r.funcionario.cor + "22", color: r.funcionario.cor }}>
                  {r.funcionario.nome.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{r.funcionario.nome}</h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.funcionario.cargo}</p>
                </div>
                <div className="ml-auto flex gap-2 flex-wrap">
                  {r.pct_atendimentos >= 100 && <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(122,232,160,0.1)", color: "var(--success)" }}>🏆 Meta de atendimentos atingida!</span>}
                  {r.pct_faturamento >= 100 && <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(122,232,160,0.1)", color: "var(--success)" }}>🏆 Meta de faturamento atingida!</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Atendimentos</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: "var(--gold)" }}>{r.atendimentos}</span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>/</span>
                      <CampoEditavel id={r.funcionario.id} campo="meta_atendimentos" valor={r.funcionario.meta_atendimentos} />
                    </div>
                  </div>
                  <div className="h-3 rounded-full" style={{ background: "var(--bg-input)" }}>
                    <div className="h-3 rounded-full transition-all" style={{ width: r.pct_atendimentos + "%", background: r.pct_atendimentos >= 100 ? "var(--success)" : "var(--gold)" }} />
                  </div>
                  <p className="text-xs mt-1 text-right" style={{ color: r.pct_atendimentos >= 100 ? "var(--success)" : "var(--text-muted)" }}>{r.pct_atendimentos}%</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Faturamento</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: "var(--success)" }}>R$ {(Number(r.faturamento) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>/</span>
                      <CampoEditavel id={r.funcionario.id} campo="meta_faturamento" valor={r.funcionario.meta_faturamento} prefix="R$ " />
                    </div>
                  </div>
                  <div className="h-3 rounded-full" style={{ background: "var(--bg-input)" }}>
                    <div className="h-3 rounded-full transition-all" style={{ width: r.pct_faturamento + "%", background: r.pct_faturamento >= 100 ? "var(--success)" : "var(--info)" }} />
                  </div>
                  <p className="text-xs mt-1 text-right" style={{ color: r.pct_faturamento >= 100 ? "var(--success)" : "var(--text-muted)" }}>{r.pct_faturamento}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`select option { background: var(--bg-card); }`}</style>
    </div>
  );
}