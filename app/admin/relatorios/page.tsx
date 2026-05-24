"use client";

import { useEffect, useState, useCallback } from "react";

const tipos = [
  { key: "faturamento", label: "Faturamento", icon: "F" },
  { key: "atendimentos", label: "Atendimentos", icon: "A" },
  { key: "estoque", label: "Estoque", icon: "E" },
  { key: "pacientes", label: "Pacientes", icon: "P" },
];

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
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${tipo}-${inicio}-${fim}.csv`;
    a.click();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>Gestao</p>
          <h1 className="text-3xl font-bold" style={{ color: "#e8d5c0" }}>Relatorios</h1>
        </div>
        <button onClick={exportarCSV} disabled={dados.length === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{ background: dados.length > 0 ? "#c8a078" : "rgba(200,160,120,0.3)", color: "#0a0707" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {tipos.map(t => (
          <button key={t.key} onClick={() => setTipo(t.key)}
            className="rounded-2xl p-4 text-center transition hover:scale-[1.02]"
            style={{
              background: tipo === t.key ? "rgba(200,160,120,0.12)" : "#120d0d",
              border: `1px solid ${tipo === t.key ? "rgba(200,160,120,0.3)" : "rgba(200,160,120,0.1)"}`
            }}>
            <p className="text-2xl font-bold mb-2" style={{ color: tipo === t.key ? "#c8a078" : "#3a2e28" }}>{t.icon}</p>
            <p className="text-xs uppercase tracking-widest" style={{ color: tipo === t.key ? "#c8a078" : "#6b5a4e" }}>
              {t.label}
            </p>
          </button>
        ))}
      </div>

      {(tipo === "faturamento" || tipo === "atendimentos") && (
        <div className="flex gap-3 mb-6 items-end flex-wrap">
          <div>
            <label className="text-xs uppercase tracking-widest block mb-1" style={{ color: "#6b5a4e" }}>De</label>
            <input type="date" value={inicio} onChange={e => setInicio(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)", color: "#e8d5c0" }} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest block mb-1" style={{ color: "#6b5a4e" }}>Ate</label>
            <input type="date" value={fim} onChange={e => setFim(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)", color: "#e8d5c0" }} />
          </div>
        </div>
      )}

      <div className="rounded-3xl overflow-hidden" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(200,160,120,0.1)" }}>
          <h2 className="text-xs uppercase tracking-widest" style={{ color: "#c8a078" }}>
            {tipos.find(t => t.key === tipo)?.label} - {dados.length} registros
          </h2>
        </div>
        {carregando ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "#c8a078" }} />
          </div>
        ) : dados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">-</p>
            <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhum dado no periodo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(200,160,120,0.08)" }}>
                  {tipo === "faturamento" && ["Data", "Paciente", "Procedimento", "Profissional", "Valor", "Desconto", "Total", "Forma", "Status"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>{h}</th>
                  ))}
                  {tipo === "atendimentos" && ["Data", "Paciente", "Procedimento", "Profissional", "Status"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>{h}</th>
                  ))}
                  {tipo === "estoque" && ["Nome", "Categoria", "Quantidade", "Unidade", "Minimo", "Fornecedor"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>{h}</th>
                  ))}
                  {tipo === "pacientes" && ["Nome", "Telefone", "CPF", "Email", "Cadastro"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dados.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < dados.length - 1 ? "1px solid rgba(200,160,120,0.05)" : "none" }}>
                    {tipo === "faturamento" && <>
                      <td className="px-5 py-3 text-xs" style={{ color: "#6b5a4e" }}>{new Date(row.criado_em).toLocaleDateString("pt-BR")}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#e8d5c0" }}>{row.pacientes?.nome ?? "-"}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#a89080" }}>{row.procedimentos?.nome ?? "-"}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#6b5a4e" }}>{row.funcionarios?.nome ?? "-"}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#e8d5c0" }}>R$ {Number(row.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#e87a7a" }}>{row.desconto > 0 ? `-R$ ${Number(row.desconto).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"}</td>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: "#c8a078" }}>R$ {Number(row.valor_final).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#6b5a4e" }}>{row.forma_pagamento}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-1 rounded-full"
                          style={{ background: row.status_pagamento === "pago" ? "rgba(122,232,160,0.1)" : "rgba(232,201,122,0.1)", color: row.status_pagamento === "pago" ? "#7ae8a0" : "#e8c97a" }}>
                          {row.status_pagamento}
                        </span>
                      </td>
                    </>}
                    {tipo === "atendimentos" && <>
                      <td className="px-5 py-3 text-xs" style={{ color: "#6b5a4e" }}>{new Date(row.inicio).toLocaleDateString("pt-BR")}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#e8d5c0" }}>{row.pacientes?.nome ?? "-"}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#a89080" }}>{row.procedimentos?.nome ?? "-"}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#6b5a4e" }}>{row.funcionarios?.nome ?? "-"}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(200,160,120,0.1)", color: "#c8a078" }}>
                          {row.status}
                        </span>
                      </td>
                    </>}
                    {tipo === "estoque" && <>
                      <td className="px-5 py-3 text-sm" style={{ color: "#e8d5c0" }}>{row.nome}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#6b5a4e" }}>{row.categoria ?? "-"}</td>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: row.quantidade <= row.quantidade_minima ? "#e8c97a" : "#7ae8a0" }}>{row.quantidade}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#6b5a4e" }}>{row.unidade}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#6b5a4e" }}>{row.quantidade_minima}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#6b5a4e" }}>{row.fornecedor ?? "-"}</td>
                    </>}
                    {tipo === "pacientes" && <>
                      <td className="px-5 py-3 text-sm" style={{ color: "#e8d5c0" }}>{row.nome}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#a89080" }}>{row.telefone}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#6b5a4e" }}>{row.cpf ?? "-"}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#6b5a4e" }}>{row.email ?? "-"}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: "#3a2e28" }}>{new Date(row.criado_em).toLocaleDateString("pt-BR")}</td>
                    </>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}