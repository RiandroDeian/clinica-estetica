"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Pacote = {
  id: string;
  procedimento: string;
  total_sessoes: number;
  sessoes_feitas: number;
  status: string;
  status_pagamento: string;
  forma_pagamento?: string;
  valor?: number;
  data_inicio?: string;
  observacoes?: string;
  assinou_termo: boolean;
  criado_em: string;
  pacientes?: { nome: string; telefone: string; cpf?: string };
  funcionarios?: { nome: string; cor: string };
};

type Resumo = {
  totalPacientes: number;
  pacotesAtivos: number;
  sessoesMes: number;
  faturamento: number;
};

const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
  em_tratamento: { label: "Em tratamento", color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  finalizado:    { label: "Finalizado",    color: "#a89080", bg: "rgba(168,144,128,0.1)" },
  pausado:       { label: "Pausado",       color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  cancelado:     { label: "Cancelado",     color: "#e87a7a", bg: "rgba(232,122,122,0.1)" },
};

const pagCfg: Record<string, { label: string; color: string; bg: string }> = {
  pago:     { label: "Pago",     color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  pendente: { label: "Pendente", color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  parcial:  { label: "Parcial",  color: "#c8a078", bg: "rgba(200,160,120,0.1)" },
};

const formas = ["pix","debito","credito","dinheiro","transferencia"];
const procedimentos = [
  "Depilacao Laser - Virilha",
  "Depilacao Laser - Axila",
  "Depilacao Laser - Perna Completa",
  "Depilacao Laser - Busco",
  "Depilacao Laser - Rosto",
  "Depilacao Laser - Braco",
  "Depilacao Laser - Peitoral",
  "Depilacao Laser - Costas",
  "Depilacao Laser - Abdomen",
  "Depilacao Laser - Full Body",
];

export default function LaserPage() {
  const router = useRouter();
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPag, setFiltroPag] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [pacientesLista, setPacientesLista] = useState<any[]>([]);
  const [funcionariosLista, setFuncionariosLista] = useState<any[]>([]);
  const [form, setForm] = useState({
    paciente_id: "", funcionario_id: "", procedimento: "",
    total_sessoes: "6", valor: "", forma_pagamento: "pix",
    status_pagamento: "pendente", data_inicio: new Date().toISOString().slice(0,10),
    observacoes: "", assinou_termo: false,
  });

  const buscar = useCallback(async () => {
    setCarregando(true);
    let url = `/api/laser?busca=${encodeURIComponent(busca)}`;
    if (filtroStatus) url += `&status=${filtroStatus}`;
    if (filtroPag) url += `&status_pagamento=${filtroPag}`;
    const res = await fetch(url);
    const data = await res.json();
    setPacotes(data.pacotes ?? []);
    setResumo(data.resumo ?? null);
    setCarregando(false);
  }, [busca, filtroStatus, filtroPag]);

  useEffect(() => {
    const t = setTimeout(buscar, 300);
    return () => clearTimeout(t);
  }, [buscar]);

  useEffect(() => {
    fetch("/api/pacientes").then(r => r.json()).then(d => setPacientesLista(Array.isArray(d) ? d : []));
    fetch("/api/funcionarios").then(r => r.json()).then(d => setFuncionariosLista(Array.isArray(d) ? d : []));
  }, []);

  async function salvar() {
    setSalvando(true);
    await fetch("/api/laser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, total_sessoes: Number(form.total_sessoes), valor: form.valor ? Number(form.valor) : null }),
    });
    setModalAberto(false);
    setForm({ paciente_id: "", funcionario_id: "", procedimento: "", total_sessoes: "6", valor: "", forma_pagamento: "pix", status_pagamento: "pendente", data_inicio: new Date().toISOString().slice(0,10), observacoes: "", assinou_termo: false });
    buscar();
    setSalvando(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>Controle</p>
          <h1 className="text-3xl font-bold" style={{ color: "#e8d5c0" }}>Pacientes Laser</h1>
        </div>
        <button onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
          style={{ background: "#c8a078", color: "#0a0707" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          Novo Pacote
        </button>
      </div>

      {resumo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Pacientes", valor: resumo.totalPacientes, icon: "👥" },
            { label: "Pacotes Ativos", valor: resumo.pacotesAtivos, icon: "🔆" },
            { label: "Sessoes Realizadas", valor: resumo.sessoesMes, icon: "✅" },
            { label: "Faturamento", valor: `R$ ${resumo.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: "💰" },
          ].map((c, i) => (
            <div key={i} className="rounded-3xl p-6" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
              <div className="text-2xl mb-3">{c.icon}</div>
              <p className="text-2xl font-bold mb-1" style={{ color: "#c8a078" }}>{c.valor}</p>
              <p className="text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>{c.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" stroke="currentColor" strokeWidth={1.5} style={{ color: "#6b5a4e" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input type="text" placeholder="Buscar paciente ou CPF..." value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full rounded-2xl pl-11 pr-5 py-3 text-sm outline-none"
            style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="rounded-2xl px-4 py-3 text-sm outline-none"
          style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)", color: filtroStatus ? "#e8d5c0" : "#6b5a4e" }}>
          <option value="">Todos os status</option>
          {Object.entries(statusCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filtroPag} onChange={e => setFiltroPag(e.target.value)}
          className="rounded-2xl px-4 py-3 text-sm outline-none"
          style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)", color: filtroPag ? "#e8d5c0" : "#6b5a4e" }}>
          <option value="">Todos pagamentos</option>
          {Object.entries(pagCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "#c8a078" }} />
        </div>
      ) : pacotes.length === 0 ? (
        <div className="text-center py-20 rounded-3xl" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
          <p className="text-4xl mb-4">🔆</p>
          <p className="text-lg font-semibold mb-2" style={{ color: "#c8a078" }}>Nenhum pacote encontrado</p>
          <p className="text-sm" style={{ color: "#6b5a4e" }}>Cadastre o primeiro pacote laser</p>
        </div>
      ) : (
        <div className="rounded-3xl overflow-hidden" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(200,160,120,0.1)" }}>
                  {["Paciente","Procedimento","Sessoes","Progresso","Status","Pagamento","Profissional","Termo",""].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pacotes.map((p, i) => {
                  const pct = Math.round((p.sessoes_feitas / p.total_sessoes) * 100);
                  const restantes = p.total_sessoes - p.sessoes_feitas;
                  const sc = statusCfg[p.status] ?? statusCfg.em_tratamento;
                  const pc = pagCfg[p.status_pagamento] ?? pagCfg.pendente;
                  return (
                    <tr key={p.id} className="transition hover:bg-[rgba(200,160,120,0.04)] cursor-pointer"
                      style={{ borderBottom: i < pacotes.length - 1 ? "1px solid rgba(200,160,120,0.06)" : "none" }}
                      onClick={() => router.push(`/admin/laser/${p.id}`)}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: "rgba(200,160,120,0.12)", color: "#c8a078" }}>
                            {p.pacientes?.nome?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "#e8d5c0" }}>{p.pacientes?.nome}</p>
                            <p className="text-xs" style={{ color: "#6b5a4e" }}>{p.pacientes?.telefone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: "#a89080" }}>{p.procedimento}</td>
                      <td className="px-5 py-4">
                        <div className="text-center">
                          <p className="text-lg font-bold" style={{ color: "#c8a078" }}>{restantes}</p>
                          <p className="text-xs" style={{ color: "#6b5a4e" }}>restantes</p>
                        </div>
                      </td>
                      <td className="px-5 py-4" style={{ minWidth: 120 }}>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(200,160,120,0.1)" }}>
                            <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: "#c8a078" }} />
                          </div>
                          <span className="text-xs flex-shrink-0" style={{ color: "#6b5a4e" }}>
                            {p.sessoes_feitas}/{p.total_sessoes}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: sc.color, background: sc.bg }}>{sc.label}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: pc.color, background: pc.bg }}>{pc.label}</span>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: "#6b5a4e" }}>{p.funcionarios?.nome ?? "-"}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-1 rounded-full"
                          style={{ background: p.assinou_termo ? "rgba(122,232,160,0.1)" : "rgba(232,122,122,0.1)", color: p.assinou_termo ? "#7ae8a0" : "#e87a7a" }}>
                          {p.assinou_termo ? "Sim" : "Nao"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5} style={{ color: "#6b5a4e" }}>
                          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: "#c8a078" }}>Novo Pacote Laser</h2>
              <button onClick={() => setModalAberto(false)} style={{ color: "#6b5a4e" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Paciente</label>
                <select value={form.paciente_id} onChange={e => setForm(f => ({ ...f, paciente_id: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: form.paciente_id ? "#e8d5c0" : "#3a2e28" }}>
                  <option value="">Selecionar paciente...</option>
                  {pacientesLista.map((p: any) => <option key={p.id} value={p.id}>{p.nome} - {p.telefone}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Procedimento</label>
                <select value={form.procedimento} onChange={e => setForm(f => ({ ...f, procedimento: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: form.procedimento ? "#e8d5c0" : "#3a2e28" }}>
                  <option value="">Selecionar procedimento...</option>
                  {procedimentos.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Total de Sessoes</label>
                <input type="number" value={form.total_sessoes} onChange={e => setForm(f => ({ ...f, total_sessoes: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Valor (R$)</label>
                <input type="number" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                  placeholder="0,00" className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Forma de Pagamento</label>
                <select value={form.forma_pagamento} onChange={e => setForm(f => ({ ...f, forma_pagamento: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }}>
                  {formas.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Status Pagamento</label>
                <select value={form.status_pagamento} onChange={e => setForm(f => ({ ...f, status_pagamento: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }}>
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="parcial">Parcial</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Data de Inicio</label>
                <input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Profissional</label>
                <select value={form.funcionario_id} onChange={e => setForm(f => ({ ...f, funcionario_id: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: form.funcionario_id ? "#e8d5c0" : "#3a2e28" }}>
                  <option value="">Selecionar profissional...</option>
                  {funcionariosLista.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Observacoes</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  rows={2} placeholder="Observacoes do pacote..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
              </div>
              <div className="sm:col-span-2 flex items-center gap-3">
                <button type="button" onClick={() => setForm(f => ({ ...f, assinou_termo: !f.assinou_termo }))}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition flex-shrink-0"
                  style={{ background: form.assinou_termo ? "#c8a078" : "transparent", border: "1px solid rgba(200,160,120,0.4)" }}>
                  {form.assinou_termo && (
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#0a0707" strokeWidth={2.5}>
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
                <span className="text-sm" style={{ color: "#a89080" }}>Assinou o termo de consentimento</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#6b5a4e" }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando || !form.paciente_id || !form.procedimento}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: form.paciente_id && form.procedimento ? "#c8a078" : "rgba(200,160,120,0.3)", color: "#0a0707" }}>
                {salvando ? "Salvando..." : "Salvar Pacote"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`select option { background: #120d0d; } input::placeholder, textarea::placeholder { color: #3a2e28; }`}</style>
    </div>
  );
}