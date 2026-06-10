"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Funcionario = {
  id: string; nome: string; cargo: string; cor: string;
  comissao_percentual: number; atendimentos: number;
  total_bruto: number; comissao_valor: number;
};

export default function ComissoesPage() {
  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7);
  const [mes, setMes] = useState(mesAtual);
  const [dados, setDados] = useState<Funcionario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<string | null>(null);
  const [novaComissao, setNovaComissao] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function buscar() {
    setCarregando(true);
    const res = await fetch("/api/comissoes?mes=" + mes);
    const data = await res.json();
    setDados(Array.isArray(data) ? data : []);
    setCarregando(false);
  }

  useEffect(() => { buscar(); }, [mes]);

  async function salvarComissao(id: string) {
    setSalvando(true);
    const res = await fetch("/api/comissoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funcionario_id: id, comissao_percentual: Number(novaComissao) }),
    });
    if (res.ok) { toast.success("Comissao atualizada!"); setEditando(null); buscar(); }
    else toast.error("Erro ao salvar");
    setSalvando(false);
  }

  const totalComissoes = dados.reduce((acc, f) => acc + f.comissao_valor, 0);
  const totalBruto = dados.reduce((acc, f) => acc + f.total_bruto, 0);
  const totalAtendimentos = dados.reduce((acc, f) => acc + f.atendimentos, 0);

  const meses = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    return { value: d.toISOString().slice(0, 7), label: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Financeiro</p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Comissões</h1>
        </div>
        <select value={mes} onChange={e => setMes(e.target.value)}
          className="rounded-2xl px-4 py-3 text-sm outline-none"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
          {meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Atendimentos", valor: totalAtendimentos, cor: "var(--gold)" },
          { label: "Faturamento Bruto", valor: "R$ " + totalBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 }), cor: "var(--success)" },
          { label: "Total Comissoes", valor: "R$ " + totalComissoes.toLocaleString("pt-BR", { minimumFractionDigits: 2 }), cor: "var(--warning)" },
        ].map(k => (
          <div key={k.label} className="rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <p className="text-2xl font-bold" style={{ color: k.cor }}>{k.valor}</p>
            <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>{k.label}</p>
          </div>
        ))}
      </div>

      {carregando ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : (
        <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {["Profissional", "Cargo", "Atendimentos", "Faturamento", "Comissao %", "Valor Comissao", ""].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dados.map((f, i) => (
                  <tr key={f.id} style={{ borderBottom: i < dados.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: f.cor + "22", color: f.cor }}>
                          {f.nome.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{f.nome}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "var(--text-muted)" }}>{f.cargo}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold" style={{ color: "var(--gold)" }}>{f.atendimentos}</span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "var(--success)" }}>
                      R$ {f.total_bruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      {editando === f.id ? (
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" max="100" value={novaComissao}
                            onChange={e => setNovaComissao(e.target.value)}
                            className="w-20 rounded-xl px-3 py-1.5 text-sm outline-none"
                            style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
                          <span className="text-sm" style={{ color: "var(--text-muted)" }}>%</span>
                          <button onClick={() => salvarComissao(f.id)} disabled={salvando}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                            style={{ background: "var(--gold)", color: "#0a0707" }}>
                            {salvando ? "..." : "OK"}
                          </button>
                          <button onClick={() => setEditando(null)} className="text-xs" style={{ color: "var(--text-muted)" }}>✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: "var(--warning)" }}>{f.comissao_percentual}%</span>
                          <button onClick={() => { setEditando(f.id); setNovaComissao(String(f.comissao_percentual)); }}
                            className="text-xs px-2 py-1 rounded-lg transition hover:opacity-70"
                            style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
                            Editar
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold" style={{ color: f.comissao_valor > 0 ? "var(--success)" : "var(--text-muted)" }}>
                        R$ {f.comissao_valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {f.comissao_valor > 0 && (
                        <button onClick={() => {
                          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Comissao</title><style>body{font-family:Georgia,serif;max-width:600px;margin:60px auto;color:#1a1a1a}.logo{text-align:center;margin-bottom:40px}.logo h1{font-size:24px;letter-spacing:8px;color:#c8a078}.logo p{font-size:11px;letter-spacing:4px;color:#888}h2{text-align:center;font-size:14px;letter-spacing:6px;text-transform:uppercase;margin:30px 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;padding:10px 0}table{width:100%;border-collapse:collapse;margin:20px 0}td,th{padding:10px;border-bottom:1px solid #eee;font-size:13px}th{text-align:left;color:#888;font-weight:normal;text-transform:uppercase;font-size:11px;letter-spacing:2px}.total{font-weight:bold;font-size:15px;color:#c8a078}.cidade{text-align:right;font-size:12px;color:#888;margin-top:30px}</style></head><body><div class="logo"><h1>MONCIE</h1><p>ESTHETIQUE</p></div><h2>Comprovante de Comissao</h2><table><tr><th>Profissional</th><td>${f.nome}</td></tr><tr><th>Cargo</th><td>${f.cargo}</td></tr><tr><th>Periodo</th><td>${new Date(mes + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</td></tr><tr><th>Atendimentos</th><td>${f.atendimentos}</td></tr><tr><th>Faturamento Bruto</th><td>R$ ${f.total_bruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr><tr><th>Percentual</th><td>${f.comissao_percentual}%</td></tr><tr><th>Valor Comissao</th><td class="total">R$ ${f.comissao_valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr></table><div class="cidade">Planaltina, Brasilia — ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div></body></html>`;
                          const win = window.open("", "_blank");
                          if (win) { win.document.write(html); win.document.close(); win.print(); }
                        }}
                          className="text-xs px-3 py-1.5 rounded-xl transition hover:scale-105"
                          style={{ background: "rgba(122,232,160,0.1)", color: "var(--success)", border: "1px solid rgba(122,232,160,0.2)" }}>
                          Imprimir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <style>{`select option { background: var(--bg-card); }`}</style>
    </div>
  );
}