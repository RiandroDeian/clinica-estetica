"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Atendimento = { procedimento: string; data: string; valor: number };
type Evolucao = { mes: string; faturamento: number; comissao: number };
type Funcionario = {
  id: string; nome: string; cargo: string; cor: string;
  comissao_percentual: number; meta_mensal: number;
  atendimentos: number; total_bruto: number;
  comissao_valor: number; bonificacao: number;
  total_a_pagar: number; status_pagamento: string;
  pagamento_id: string | null; meta_atingida: number | null;
  atendimentos_detalhe: Atendimento[];
  evolucao: Evolucao[];
};

export default function ComissoesPage() {
  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7);
  const [mes, setMes] = useState(mesAtual);
  const [dados, setDados] = useState<Funcionario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [detalhe, setDetalhe] = useState<Funcionario | null>(null);
  const [editandoPct, setEditandoPct] = useState<string | null>(null);
  const [editandoMeta, setEditandoMeta] = useState<string | null>(null);
  const [editandoBonus, setEditandoBonus] = useState<string | null>(null);
  const [novoValor, setNovoValor] = useState("");
  const [modalPagar, setModalPagar] = useState<Funcionario | null>(null);
  const [obsPagamento, setObsPagamento] = useState("");
  const [bonus, setBonus] = useState("");

  async function buscar() {
    setCarregando(true);
    const res = await fetch("/api/comissoes?mes=" + mes);
    const data = await res.json();
    setDados(Array.isArray(data) ? data : []);
    setCarregando(false);
  }

  useEffect(() => { buscar(); }, [mes]);

  async function salvar(acao: string, funcionario_id: string, valor: number) {
    setSalvando(true);
    const body: any = { acao, funcionario_id };
    if (acao === "comissao_percentual") body.comissao_percentual = valor;
    if (acao === "meta_mensal") body.meta_mensal = valor;
    if (acao === "bonificacao") { body.bonificacao = valor; body.mes = mes; }
    const res = await fetch("/api/comissoes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { toast.success("Salvo!"); setEditandoPct(null); setEditandoMeta(null); setEditandoBonus(null); buscar(); }
    else toast.error("Erro ao salvar");
    setSalvando(false);
  }

  async function pagar(f: Funcionario) {
    setSalvando(true);
    const res = await fetch("/api/comissoes", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "pagar", funcionario_id: f.id, mes, valor_comissao: f.comissao_valor, bonificacao: f.bonificacao, observacoes: obsPagamento }),
    });
    if (res.ok) { toast.success("Pagamento registrado!"); setModalPagar(null); setObsPagamento(""); buscar(); }
    else toast.error("Erro ao registrar pagamento");
    setSalvando(false);
  }

  function imprimirComprovante(f: Funcionario) {
    const mesFmt = new Date(mes + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Comissao</title><style>body{font-family:Georgia,serif;max-width:650px;margin:60px auto;color:#1a1a1a}.logo{text-align:center;margin-bottom:40px}.logo h1{font-size:24px;letter-spacing:8px;color:#c8a078;margin:0}.logo p{font-size:11px;letter-spacing:4px;color:#888;margin:4px 0 0}h2{text-align:center;font-size:13px;letter-spacing:6px;text-transform:uppercase;margin:30px 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;padding:10px 0}table{width:100%;border-collapse:collapse;margin:20px 0}td,th{padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px}th{text-align:left;color:#888;font-weight:normal;text-transform:uppercase;font-size:10px;letter-spacing:2px}.total{font-weight:bold;font-size:16px;color:#c8a078}hr{border:none;border-top:1px solid #eee;margin:20px 0}.cidade{text-align:right;font-size:12px;color:#888;margin-top:40px}.assinatura{margin-top:60px;text-align:center}.assinatura div{border-top:1px solid #333;width:220px;margin:0 auto 8px;padding-top:8px;font-size:12px}</style></head><body>
    <div class="logo"><h1>MONCIE</h1><p>ESTHETIQUE</p></div>
    <h2>Comprovante de Comissao</h2>
    <table>
      <tr><th>Profissional</th><td><strong>${f.nome}</strong></td></tr>
      <tr><th>Cargo</th><td>${f.cargo}</td></tr>
      <tr><th>Periodo</th><td>${mesFmt}</td></tr>
      <tr><th>Atendimentos</th><td>${f.atendimentos}</td></tr>
    </table>
    <hr>
    <table>
      <tr><th>Faturamento Bruto</th><td>R$ ${f.total_bruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>
      <tr><th>Percentual de Comissao</th><td>${f.comissao_percentual}%</td></tr>
      <tr><th>Valor da Comissao</th><td>R$ ${f.comissao_valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>
      ${f.bonificacao > 0 ? `<tr><th>Bonificacao Extra</th><td>R$ ${f.bonificacao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>` : ""}
      <tr><th>Total a Receber</th><td class="total">R$ ${f.total_a_pagar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>
      ${f.status_pagamento === "pago" ? `<tr><th>Status</th><td style="color:green;font-weight:bold">PAGO</td></tr>` : ""}
    </table>
    ${f.atendimentos_detalhe.length > 0 ? `<hr><h2 style="font-size:11px">Detalhamento</h2><table><tr><th>Procedimento</th><th>Data</th><th>Valor</th></tr>${f.atendimentos_detalhe.map(a => `<tr><td>${a.procedimento}</td><td>${new Date(a.data).toLocaleDateString("pt-BR")}</td><td>R$ ${a.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>`).join("")}</table>` : ""}
    <div class="cidade">Planaltina, Brasilia — ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
    <div class="assinatura"><div>Moncié Esthetique</div></div>
    </body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  }

  const totalComissoes = dados.reduce((acc, f) => acc + f.total_a_pagar, 0);
  const totalBruto = dados.reduce((acc, f) => acc + f.total_bruto, 0);
  const totalAtendimentos = dados.reduce((acc, f) => acc + f.atendimentos, 0);
  const totalPago = dados.filter(f => f.status_pagamento === "pago").reduce((acc, f) => acc + f.total_a_pagar, 0);
  const totalPendente = totalComissoes - totalPago;

  const meses = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    return { value: d.toISOString().slice(0, 7), label: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) };
  });

  const inpStyle = { background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Financeiro</p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Comissões</h1>
        </div>
        <select value={mes} onChange={e => setMes(e.target.value)}
          className="rounded-2xl px-4 py-3 text-sm outline-none"
          style={inpStyle}>
          {meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Atendimentos", valor: totalAtendimentos, cor: "var(--gold)" },
          { label: "Faturamento Bruto", valor: "R$ " + totalBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 }), cor: "var(--success)" },
          { label: "Total Comissoes", valor: "R$ " + totalComissoes.toLocaleString("pt-BR", { minimumFractionDigits: 2 }), cor: "var(--warning)" },
          { label: "Pendente Pagar", valor: "R$ " + totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 }), cor: "var(--danger)" },
        ].map(k => (
          <div key={k.label} className="rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <p className="text-2xl font-bold" style={{ color: k.cor }}>{k.valor}</p>
            <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>{k.label}</p>
          </div>
        ))}
      </div>

      {carregando ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} /></div>
      ) : (
        <div className="flex flex-col gap-4">
          {dados.map(f => (
            <div key={f.id} className="rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <div className="flex items-start gap-4 flex-wrap">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                  style={{ background: f.cor + "22", color: f.cor }}>
                  {f.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{f.nome}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>{f.cargo}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: f.status_pagamento === "pago" ? "rgba(122,232,160,0.1)" : "rgba(232,201,122,0.1)", color: f.status_pagamento === "pago" ? "var(--success)" : "var(--warning)" }}>
                      {f.status_pagamento === "pago" ? "✓ Pago" : "Pendente"}
                    </span>
                  </div>

                  {f.meta_atingida !== null && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "var(--text-muted)" }}>Meta mensal: R$ {Number(f.meta_mensal).toLocaleString("pt-BR")}</span>
                        <span style={{ color: f.meta_atingida >= 100 ? "var(--success)" : "var(--gold)" }}>{f.meta_atingida}%</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "var(--bg-input)" }}>
                        <div className="h-2 rounded-full transition-all" style={{ width: f.meta_atingida + "%", background: f.meta_atingida >= 100 ? "var(--success)" : "var(--gold)" }} />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: "Atendimentos", valor: f.atendimentos, cor: "var(--gold)" },
                      { label: "Faturamento", valor: "R$ " + f.total_bruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 }), cor: "var(--success)" },
                      { label: "Comissao", valor: "R$ " + f.comissao_valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }), cor: "var(--warning)" },
                      { label: "Total a Pagar", valor: "R$ " + f.total_a_pagar.toLocaleString("pt-BR", { minimumFractionDigits: 2 }), cor: "var(--danger)" },
                    ].map(k => (
                      <div key={k.label} className="p-3 rounded-2xl" style={{ background: "var(--bg-input)" }}>
                        <p className="text-sm font-bold" style={{ color: k.cor }}>{k.valor}</p>
                        <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: "var(--text-muted)" }}>{k.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 flex-wrap mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Comissao %:</span>
                      {editandoPct === f.id ? (
                        <div className="flex items-center gap-1">
                          <input type="number" min="0" max="100" value={novoValor} onChange={e => setNovoValor(e.target.value)} className="w-16 rounded-xl px-2 py-1 text-sm outline-none" style={inpStyle} />
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>%</span>
                          <button onClick={() => salvar("comissao_percentual", f.id, Number(novoValor))} disabled={salvando} className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: "var(--gold)", color: "#0a0707" }}>{salvando ? "..." : "OK"}</button>
                          <button onClick={() => setEditandoPct(null)} className="text-xs" style={{ color: "var(--text-muted)" }}>✕</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditandoPct(f.id); setNovoValor(String(f.comissao_percentual)); }} className="text-xs px-2 py-1 rounded-lg" style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>{f.comissao_percentual}% ✏</button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Meta:</span>
                      {editandoMeta === f.id ? (
                        <div className="flex items-center gap-1">
                          <input type="number" min="0" value={novoValor} onChange={e => setNovoValor(e.target.value)} className="w-24 rounded-xl px-2 py-1 text-sm outline-none" style={inpStyle} placeholder="R$" />
                          <button onClick={() => salvar("meta_mensal", f.id, Number(novoValor))} disabled={salvando} className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: "var(--gold)", color: "#0a0707" }}>{salvando ? "..." : "OK"}</button>
                          <button onClick={() => setEditandoMeta(null)} className="text-xs" style={{ color: "var(--text-muted)" }}>✕</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditandoMeta(f.id); setNovoValor(String(f.meta_mensal)); }} className="text-xs px-2 py-1 rounded-lg" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
                          {f.meta_mensal > 0 ? "R$ " + Number(f.meta_mensal).toLocaleString("pt-BR") : "Sem meta"} ✏
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Bonus:</span>
                      {editandoBonus === f.id ? (
                        <div className="flex items-center gap-1">
                          <input type="number" min="0" value={novoValor} onChange={e => setNovoValor(e.target.value)} className="w-24 rounded-xl px-2 py-1 text-sm outline-none" style={inpStyle} placeholder="R$" />
                          <button onClick={() => salvar("bonificacao", f.id, Number(novoValor))} disabled={salvando} className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: "var(--gold)", color: "#0a0707" }}>{salvando ? "..." : "OK"}</button>
                          <button onClick={() => setEditandoBonus(null)} className="text-xs" style={{ color: "var(--text-muted)" }}>✕</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditandoBonus(f.id); setNovoValor(String(f.bonificacao)); }} className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(122,232,160,0.1)", color: "var(--success)" }}>
                          {f.bonificacao > 0 ? "+ R$ " + f.bonificacao.toLocaleString("pt-BR") : "+ Bonus"} ✏
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setDetalhe(detalhe?.id === f.id ? null : f)}
                      className="text-xs px-3 py-1.5 rounded-xl transition hover:scale-105"
                      style={{ background: "var(--bg-input)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                      {detalhe?.id === f.id ? "▲ Ocultar" : "▼ Ver Atendimentos"}
                    </button>
                    <button onClick={() => imprimirComprovante(f)}
                      className="text-xs px-3 py-1.5 rounded-xl transition hover:scale-105"
                      style={{ background: "var(--gold-bg)", color: "var(--gold)", border: "1px solid var(--border-color)" }}>
                      Imprimir Comprovante
                    </button>
                    {f.status_pagamento !== "pago" && f.total_a_pagar > 0 && (
                      <button onClick={() => { setModalPagar(f); setObsPagamento(""); setBonus(String(f.bonificacao)); }}
                        className="text-xs px-3 py-1.5 rounded-xl font-semibold transition hover:scale-105"
                        style={{ background: "var(--success)", color: "white" }}>
                        Registrar Pagamento
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {detalhe?.id === f.id && (
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>Atendimentos do Mes</p>
                      {f.atendimentos_detalhe.length === 0 ? (
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum atendimento</p>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                          {f.atendimentos_detalhe.map((a, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-2 rounded-xl" style={{ background: "var(--bg-input)" }}>
                              <div>
                                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{a.procedimento}</p>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(a.data).toLocaleDateString("pt-BR")}</p>
                              </div>
                              <p className="text-sm font-bold" style={{ color: "var(--success)" }}>R$ {a.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>Evolucao 6 Meses</p>
                      <div className="flex items-end gap-2 h-32">
                        {f.evolucao.map((e, i) => {
                          const maxFat = Math.max(...f.evolucao.map(x => x.faturamento), 1);
                          const h = Math.round((e.faturamento / maxFat) * 100);
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <span className="text-[10px]" style={{ color: "var(--gold)" }}>R${Math.round(e.comissao)}</span>
                              <div className="w-full rounded-t-lg transition-all" style={{ height: h + "%", minHeight: 4, background: i === 5 ? "var(--gold)" : "var(--bg-input)", border: "1px solid var(--border-subtle)" }} />
                              <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{e.mes.slice(5)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalPagar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Registrar Pagamento</h2>
              <button onClick={() => setModalPagar(null)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl" style={{ background: "var(--bg-input)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{modalPagar.nome}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{modalPagar.cargo}</p>
                <p className="text-lg font-bold mt-2" style={{ color: "var(--success)" }}>
                  R$ {modalPagar.total_a_pagar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Comissao + Bonus</p>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Observacoes</label>
                <textarea value={obsPagamento} onChange={e => setObsPagamento(e.target.value)} rows={3} placeholder="Ex: Pago via PIX..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inpStyle} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalPagar(null)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={() => pagar(modalPagar)} disabled={salvando} className="flex-1 py-3 rounded-2xl text-sm font-semibold transition hover:scale-105" style={{ background: "var(--success)", color: "white" }}>
                {salvando ? "Registrando..." : "Confirmar Pagamento"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`select option { background: var(--bg-card); } textarea::placeholder, input::placeholder { color: var(--text-muted); }`}</style>
    </div>
  );
}