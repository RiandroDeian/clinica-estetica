"use client";

import { useEffect, useState, useCallback } from "react";

type Log = {
  id: string;
  funcionario_nome: string;
  acao: string;
  tabela: string;
  registro_id: string;
  descricao: string;
  dados_antes: any;
  dados_depois: any;
  criado_em: string;
};

const acaoCfg: Record<string, { label: string; color: string; bg: string }> = {
  criar:    { label: "Criou",    color: "#7ae8a0", bg: "rgba(122,232,160,0.1)"  },
  editar:   { label: "Editou",   color: "#e8c97a", bg: "rgba(232,201,122,0.1)"  },
  excluir:  { label: "Excluiu",  color: "#e87a7a", bg: "rgba(232,122,122,0.1)"  },
  acessar:  { label: "Acessou",  color: "#7ab8e8", bg: "rgba(122,184,232,0.1)"  },
  login:    { label: "Login",    color: "#c8a078", bg: "rgba(200,160,120,0.1)"  },
  logout:   { label: "Logout",   color: "#a89080", bg: "rgba(168,144,128,0.1)"  },
};

const tabelas = ["pacientes","agendamentos","pacotes","laser_pacotes","funcionarios","faturamentos","procedimentos"];
const acoes   = ["criar","editar","excluir","acessar","login","logout"];

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState("");
  const [filtroTabela, setFiltroTabela] = useState("");
  const [filtroAcao, setFiltroAcao] = useState("");
  const [logDetalhe, setLogDetalhe] = useState<Log | null>(null);

  const buscar = useCallback(async () => {
    setCarregando(true);
    const params = new URLSearchParams({
      pagina: String(pagina),
      busca,
      ...(filtroTabela && { tabela: filtroTabela }),
      ...(filtroAcao   && { acao:   filtroAcao   }),
    });
    const res = await fetch(`/api/auditoria?${params}`);
    const data = await res.json();
    setLogs(data.logs ?? []);
    setTotal(data.total ?? 0);
    setCarregando(false);
  }, [pagina, busca, filtroTabela, filtroAcao]);

  useEffect(() => {
    const t = setTimeout(buscar, 300);
    return () => clearTimeout(t);
  }, [buscar]);

  const totalPaginas = Math.ceil(total / 50);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Segurança</p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Auditoria</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Log completo de todas as alterações do sistema</p>
        </div>
        <div className="px-4 py-2 rounded-2xl text-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
          {total} registro{total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input value={busca} onChange={e => { setBusca(e.target.value); setPagina(1); }}
          placeholder="Buscar descrição..."
          className="flex-1 min-w-[200px] rounded-2xl px-4 py-3 text-sm outline-none"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
        <select value={filtroTabela} onChange={e => { setFiltroTabela(e.target.value); setPagina(1); }}
          className="rounded-2xl px-4 py-3 text-sm outline-none"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: filtroTabela ? "var(--text-primary)" : "var(--text-muted)" }}>
          <option value="">Todas as tabelas</option>
          {tabelas.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filtroAcao} onChange={e => { setFiltroAcao(e.target.value); setPagina(1); }}
          className="rounded-2xl px-4 py-3 text-sm outline-none"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: filtroAcao ? "var(--text-primary)" : "var(--text-muted)" }}>
          <option value="">Todas as ações</option>
          {acoes.map(a => <option key={a} value={a}>{acaoCfg[a]?.label ?? a}</option>)}
        </select>
      </div>

      {/* Lista */}
      <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        {carregando ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum log encontrado</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Os logs aparecem conforme ações são realizadas no sistema</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {logs.map(log => {
              const cfg = acaoCfg[log.acao] ?? acaoCfg.acessar;
              return (
                <div key={log.id}
                  className="px-6 py-4 transition cursor-pointer hover:bg-[var(--bg-hover)]"
                  onClick={() => setLogDetalhe(log)}>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      <div>
                        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {log.funcionario_nome ?? "Sistema"}
                        </span>
                        {log.tabela && (
                          <span className="text-xs ml-2 px-2 py-0.5 rounded"
                            style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
                            {log.tabela}
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{log.descricao}</p>
                    </div>
                    <div className="text-xs text-right flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                      <p>{new Date(log.criado_em).toLocaleDateString("pt-BR")}</p>
                      <p>{new Date(log.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
            className="px-4 py-2 rounded-xl text-sm transition hover:opacity-70 disabled:opacity-30"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
            ← Anterior
          </button>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>{pagina} / {totalPaginas}</span>
          <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
            className="px-4 py-2 rounded-xl text-sm transition hover:opacity-70 disabled:opacity-30"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
            Próxima →
          </button>
        </div>
      )}

      {/* Modal detalhe */}
      {logDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setLogDetalhe(null)}>
          <div className="w-full max-w-lg rounded-3xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="px-6 py-5 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Detalhe do Log</p>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>{logDetalhe.descricao}</p>
              </div>
              <button onClick={() => setLogDetalhe(null)} style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-3">
              {[
                { label: "Funcionário",  valor: logDetalhe.funcionario_nome ?? "Sistema" },
                { label: "Ação",         valor: acaoCfg[logDetalhe.acao]?.label ?? logDetalhe.acao },
                { label: "Tabela",       valor: logDetalhe.tabela ?? "—" },
                { label: "Registro ID",  valor: logDetalhe.registro_id ?? "—" },
                { label: "Data/Hora",    valor: new Date(logDetalhe.criado_em).toLocaleString("pt-BR") },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-2"
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{item.label}</span>
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>{item.valor}</span>
                </div>
              ))}
              {logDetalhe.dados_antes && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--danger)" }}>Antes</p>
                  <pre className="text-xs rounded-xl p-3 overflow-auto max-h-32"
                    style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>
                    {JSON.stringify(logDetalhe.dados_antes, null, 2)}
                  </pre>
                </div>
              )}
              {logDetalhe.dados_depois && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--success)" }}>Depois</p>
                  <pre className="text-xs rounded-xl p-3 overflow-auto max-h-32"
                    style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>
                    {JSON.stringify(logDetalhe.dados_depois, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`select option { background: var(--bg-card); } input::placeholder { color: var(--text-muted); }`}</style>
    </div>
  );
}
