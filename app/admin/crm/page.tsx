"use client";
import { useEffect, useState, useCallback } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { toast } from "sonner";

type Coluna = { id: string; nome: string; cor: string; ordem: number };
type Lead = {
  id: string; nome: string; telefone?: string; procedimento_interesse?: string;
  observacoes?: string; coluna_id: string; responsavel_id?: string;
  ultima_interacao: string; criado_em: string;
  funcionarios?: { nome: string; cor: string };
  crm_colunas?: { nome: string; cor: string };
};
type Historico = {
  id: string; criado_em: string;
  crm_leads?: { nome: string };
  coluna_origem?: { nome: string };
  coluna_destino?: { nome: string };
  funcionarios?: { nome: string };
};

function LeadCard({ lead, onClick, isDragging }: { lead: Lead; onClick: () => void; isDragging?: boolean }) {
  const diasSemInteracao = Math.floor((Date.now() - new Date(lead.ultima_interacao).getTime()) / 86400000);
  return (
    <div onClick={onClick} className="rounded-2xl p-4 cursor-pointer transition hover:scale-[1.02] select-none"
      style={{ background: isDragging ? "var(--gold-bg)" : "var(--bg-card)", border: "1px solid var(--border-color)", opacity: isDragging ? 0.5 : 1, boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.3)" : "none" }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold leading-5" style={{ color: "var(--text-primary)" }}>{lead.nome}</p>
        {diasSemInteracao > 2 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(232,122,122,0.1)", color: "var(--danger)" }}>
            {diasSemInteracao}d
          </span>
        )}
      </div>
      {lead.telefone && <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>📞 {lead.telefone}</p>}
      {lead.procedimento_interesse && (
        <span className="text-xs px-2 py-0.5 rounded-full inline-block mb-2" style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
          {lead.procedimento_interesse}
        </span>
      )}
      {lead.funcionarios && (
        <div className="flex items-center gap-1 mt-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: (lead.funcionarios.cor ?? "#c8a078") + "33", color: lead.funcionarios.cor ?? "#c8a078" }}>
            {lead.funcionarios.nome.charAt(0)}
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{lead.funcionarios.nome.split(" ")[0]}</span>
        </div>
      )}
      <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
        {new Date(lead.criado_em).toLocaleDateString("pt-BR")}
      </p>
    </div>
  );
}

function ColunaKanban({ coluna, leads, onAddLead, onEditLead, onDeleteColuna, onEditColuna, activeLead }: {
  coluna: Coluna; leads: Lead[]; onAddLead: () => void; onEditLead: (l: Lead) => void;
  onDeleteColuna: (id: string) => void; onEditColuna: (c: Coluna) => void; activeLead: Lead | null;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      className="flex flex-col flex-shrink-0 rounded-3xl"
      style={{ width: 280, background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={() => setOver(false)}
      data-coluna-id={coluna.id}>
      <div className="px-4 py-3 flex items-center justify-between rounded-t-3xl"
        style={{ background: coluna.cor + "22", borderBottom: "1px solid " + coluna.cor + "44" }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: coluna.cor }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{coluna.nome}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: coluna.cor + "33", color: coluna.cor }}>{leads.length}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEditColuna(coluna)} className="w-6 h-6 rounded-lg flex items-center justify-center transition hover:opacity-70" style={{ background: "var(--bg-input)" }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth={2}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button onClick={() => onDeleteColuna(coluna.id)} className="w-6 h-6 rounded-lg flex items-center justify-center transition hover:opacity-70" style={{ background: "rgba(232,122,122,0.1)" }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="var(--danger)" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-3 flex-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)", minHeight: 100, background: over && activeLead ? "rgba(200,160,120,0.05)" : "transparent", transition: "background 0.2s" }}>
        {leads.map(lead => (
          <div key={lead.id} draggable onDragStart={e => { e.dataTransfer.setData("lead_id", lead.id); e.dataTransfer.setData("origem_id", coluna.id); }}>
            <LeadCard lead={lead} onClick={() => onEditLead(lead)} />
          </div>
        ))}
      </div>
      <div className="p-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <button onClick={onAddLead} className="w-full py-2 rounded-xl text-xs transition hover:opacity-70 flex items-center justify-center gap-1"
          style={{ border: "1px dashed var(--border-color)", color: "var(--text-muted)" }}>
          + Adicionar lead
        </button>
      </div>
    </div>
  );
}

export default function CRMPage() {
  const [colunas, setColunas] = useState<Coluna[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [procedimentos, setProcedimentos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroResp, setFiltroResp] = useState("");
  const [filtroProc, setFiltroProc] = useState("");
  const [abaAtiva, setAbaAtiva] = useState<"kanban"|"historico"|"dashboard">("kanban");
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [modalLead, setModalLead] = useState<{ lead?: Lead; coluna_id?: string } | null>(null);
  const [modalColuna, setModalColuna] = useState<Coluna | null>(null);
  const [novaColuna, setNovaColuna] = useState(false);
  const [formLead, setFormLead] = useState({ nome: "", telefone: "", procedimento_interesse: "", responsavel_id: "", coluna_id: "", observacoes: "" });
  const [formColuna, setFormColuna] = useState({ nome: "", cor: "#c8a078" });
  const [salvando, setSalvando] = useState(false);
  const [abaModal, setAbaModal] = useState<"dados"|"historico">("dados");

  const buscar = useCallback(async () => {
    setCarregando(true);
    const [c, l, h, f, p] = await Promise.all([
      fetch("/api/crm/colunas").then(r => r.json()),
      fetch("/api/crm/leads").then(r => r.json()),
      fetch("/api/crm/historico").then(r => r.json()),
      fetch("/api/funcionarios").then(r => r.json()),
      fetch("/api/procedimentos").then(r => r.json()),
    ]);
    setColunas(Array.isArray(c) ? c : []);
    setLeads(Array.isArray(l) ? l : []);
    setHistorico(Array.isArray(h) ? h : []);
    setFuncionarios(Array.isArray(f) ? f : []);
    setProcedimentos(Array.isArray(p) ? p : []);
    setCarregando(false);
  }, []);

  useEffect(() => { buscar(); }, [buscar]);

  async function salvarLead() {
    if (!formLead.nome.trim()) return;
    setSalvando(true);
    const method = modalLead?.lead ? "PATCH" : "POST";
    const body = modalLead?.lead ? { id: modalLead.lead.id, coluna_origem_id: modalLead.lead.coluna_id, ...formLead } : formLead;
    const res = await fetch("/api/crm/leads", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { toast.success("Salvo!"); setModalLead(null); buscar(); }
    else toast.error("Erro ao salvar");
    setSalvando(false);
  }

  async function deletarLead(id: string) {
    if (!confirm("Remover este lead?")) return;
    await fetch("/api/crm/leads?id=" + id, { method: "DELETE" });
    toast.success("Lead removido");
    setModalLead(null);
    buscar();
  }

  async function salvarColuna() {
    if (!formColuna.nome.trim()) return;
    setSalvando(true);
    if (modalColuna) {
      await fetch("/api/crm/colunas", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: modalColuna.id, ...formColuna }) });
    } else {
      await fetch("/api/crm/colunas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formColuna) });
    }
    toast.success("Coluna salva!");
    setModalColuna(null);
    setNovaColuna(false);
    buscar();
    setSalvando(false);
  }

  async function deletarColuna(id: string) {
    if (!confirm("Remover esta coluna? Os leads serao mantidos.")) return;
    await fetch("/api/crm/colunas?id=" + id, { method: "DELETE" });
    toast.success("Coluna removida");
    buscar();
  }

  function handleDrop(e: React.DragEvent, colunaDestinoId: string) {
    const leadId = e.dataTransfer.getData("lead_id");
    const origemId = e.dataTransfer.getData("origem_id");
    if (!leadId || origemId === colunaDestinoId) return;
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, coluna_id: colunaDestinoId } : l));
    fetch("/api/crm/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: leadId, coluna_id: colunaDestinoId, coluna_origem_id: origemId }) })
      .then(() => buscar());
  }

  const leadsFiltrados = leads.filter(l => {
    const matchBusca = l.nome.toLowerCase().includes(busca.toLowerCase()) || (l.telefone ?? "").includes(busca);
    const matchResp = !filtroResp || l.responsavel_id === filtroResp;
    const matchProc = !filtroProc || (l.procedimento_interesse ?? "").toLowerCase().includes(filtroProc.toLowerCase());
    return matchBusca && matchResp && matchProc;
  });

  const totalLeads = leads.length;
  const totalAvaliacao = leads.filter(l => colunas.find(c => c.id === l.coluna_id)?.nome?.toLowerCase().includes("avaliacao")).length;
  const totalCompareceu = leads.filter(l => colunas.find(c => c.id === l.coluna_id)?.nome?.toLowerCase().includes("compareceu")).length;
  const totalFechou = leads.filter(l => colunas.find(c => c.id === l.coluna_id)?.nome?.toLowerCase().includes("fechou")).length;
  const taxaConversao = totalLeads > 0 ? Math.round((totalFechou / totalLeads) * 100) : 0;

  const cores = ["#c8a078","#7aa6e8","#7ae8b4","#e8c97a","#e87a7a","#a078c8","#25D366","#e8a07a","#7ae8e8"];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap flex-shrink-0">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Comercial</p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>CRM — Funil de Pacientes</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setNovaColuna(true); setModalColuna(null); setFormColuna({ nome: "", cor: "#c8a078" }); }}
            className="px-4 py-2.5 rounded-2xl text-xs uppercase tracking-widest transition hover:scale-105"
            style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
            + Coluna
          </button>
          <button onClick={() => {
            const primeiraColuna = colunas[0];
            if (!primeiraColuna) return;
            setModalLead({ coluna_id: primeiraColuna.id });
            setFormLead({ nome: "", telefone: "", procedimento_interesse: "", responsavel_id: "", coluna_id: primeiraColuna.id, observacoes: "" });
            setAbaModal("dados");
          }}
            className="px-4 py-2.5 rounded-2xl text-xs uppercase tracking-widest font-semibold transition hover:scale-105"
            style={{ background: "var(--gold)", color: "#0a0707" }}>
            + Novo Lead
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4 p-1 rounded-2xl flex-shrink-0" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        {[{ key: "kanban", label: "Kanban" }, { key: "dashboard", label: "Dashboard" }, { key: "historico", label: "Historico" }].map(a => (
          <button key={a.key} onClick={() => setAbaAtiva(a.key as any)}
            className="flex-1 py-2 rounded-xl text-xs uppercase tracking-widest transition"
            style={{ background: abaAtiva === a.key ? "var(--gold-bg)" : "transparent", color: abaAtiva === a.key ? "var(--gold)" : "var(--text-muted)" }}>
            {a.label}
          </button>
        ))}
      </div>

      {abaAtiva === "kanban" && (
        <>
          <div className="flex gap-3 mb-4 flex-wrap flex-shrink-0">
            <input type="text" placeholder="Buscar lead..." value={busca} onChange={e => setBusca(e.target.value)}
              className="rounded-2xl px-4 py-2.5 text-sm outline-none flex-1 min-w-48"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
            <select value={filtroResp} onChange={e => setFiltroResp(e.target.value)}
              className="rounded-2xl px-4 py-2.5 text-sm outline-none"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
              <option value="">Todos responsaveis</option>
              {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
            <input type="text" placeholder="Filtrar procedimento..." value={filtroProc} onChange={e => setFiltroProc(e.target.value)}
              className="rounded-2xl px-4 py-2.5 text-sm outline-none"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
          </div>
          {carregando ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} />
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 400 }}
              onDragOver={e => e.preventDefault()}>
              {colunas.map(coluna => (
                <div key={coluna.id} onDrop={e => handleDrop(e, coluna.id)} onDragOver={e => e.preventDefault()}>
                  <ColunaKanban
                    coluna={coluna}
                    leads={leadsFiltrados.filter(l => l.coluna_id === coluna.id)}
                    activeLead={activeLead}
                    onAddLead={() => {
                      setModalLead({ coluna_id: coluna.id });
                      setFormLead({ nome: "", telefone: "", procedimento_interesse: "", responsavel_id: "", coluna_id: coluna.id, observacoes: "" });
                      setAbaModal("dados");
                    }}
                    onEditLead={lead => {
                      setModalLead({ lead, coluna_id: lead.coluna_id });
                      setFormLead({ nome: lead.nome, telefone: lead.telefone ?? "", procedimento_interesse: lead.procedimento_interesse ?? "", responsavel_id: lead.responsavel_id ?? "", coluna_id: lead.coluna_id, observacoes: lead.observacoes ?? "" });
                      setAbaModal("dados");
                    }}
                    onDeleteColuna={deletarColuna}
                    onEditColuna={c => { setModalColuna(c); setFormColuna({ nome: c.nome, cor: c.cor }); }}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {abaAtiva === "dashboard" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Total Leads", valor: totalLeads, cor: "var(--gold)" },
              { label: "Avaliacoes", valor: totalAvaliacao, cor: "var(--info)" },
              { label: "Compareceu", valor: totalCompareceu, cor: "var(--warning)" },
              { label: "Fechou Pacote", valor: totalFechou, cor: "var(--success)" },
              { label: "Taxa Conversao", valor: taxaConversao + "%", cor: "var(--gold)" },
            ].map(k => (
              <div key={k.label} className="rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                <p className="text-3xl font-bold" style={{ color: k.cor }}>{k.valor}</p>
                <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>{k.label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <h2 className="text-xs uppercase tracking-widest mb-5" style={{ color: "var(--gold)" }}>Distribuicao por Coluna</h2>
            <div className="flex flex-col gap-3">
              {colunas.map(c => {
                const count = leads.filter(l => l.coluna_id === c.id).length;
                const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                return (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.cor }} />
                    <span className="text-sm w-48 truncate" style={{ color: "var(--text-primary)" }}>{c.nome}</span>
                    <div className="flex-1 h-2 rounded-full" style={{ background: "var(--bg-input)" }}>
                      <div className="h-2 rounded-full transition-all" style={{ width: pct + "%", background: c.cor }} />
                    </div>
                    <span className="text-sm font-bold w-8 text-right" style={{ color: c.cor }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {abaAtiva === "historico" && (
        <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <h2 className="text-xs uppercase tracking-widest" style={{ color: "var(--gold)" }}>Historico de Movimentacoes</h2>
          </div>
          {historico.length === 0 ? (
            <div className="text-center py-16"><p className="text-4xl mb-3">📋</p><p style={{ color: "var(--text-muted)" }}>Nenhuma movimentacao ainda</p></div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {historico.map(h => (
                <div key={h.id} className="px-6 py-4 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--gold)" }} />
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                      <span className="font-semibold">{h.crm_leads?.nome}</span> movido de{" "}
                      <span className="font-semibold" style={{ color: "var(--warning)" }}>{h.coluna_origem?.nome ?? "—"}</span> para{" "}
                      <span className="font-semibold" style={{ color: "var(--success)" }}>{h.coluna_destino?.nome ?? "—"}</span>
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {h.funcionarios?.nome ?? "Sistema"} · {new Date(h.criado_em).toLocaleDateString("pt-BR")} {new Date(h.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(modalLead !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>{modalLead.lead ? "Editar Lead" : "Novo Lead"}</h2>
              <button onClick={() => setModalLead(null)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            {modalLead.lead && (
              <div className="flex gap-1 mb-5 p-1 rounded-2xl" style={{ background: "var(--bg-input)" }}>
                {[{ key: "dados", label: "Dados" }, { key: "historico", label: "Historico" }].map(a => (
                  <button key={a.key} onClick={() => setAbaModal(a.key as any)}
                    className="flex-1 py-1.5 rounded-xl text-xs transition"
                    style={{ background: abaModal === a.key ? "var(--gold-bg)" : "transparent", color: abaModal === a.key ? "var(--gold)" : "var(--text-muted)" }}>
                    {a.label}
                  </button>
                ))}
              </div>
            )}
            {abaModal === "historico" && modalLead.lead ? (
              <div className="flex flex-col gap-2">
                {historico.filter(h => h.crm_leads?.nome === modalLead.lead?.nome).length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Nenhuma movimentacao</p>
                ) : historico.filter(h => h.crm_leads?.nome === modalLead.lead?.nome).map(h => (
                  <div key={h.id} className="px-4 py-3 rounded-2xl" style={{ background: "var(--bg-input)" }}>
                    <p className="text-xs" style={{ color: "var(--text-primary)" }}>
                      {h.coluna_origem?.nome ?? "—"} → {h.coluna_destino?.nome ?? "—"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {h.funcionarios?.nome} · {new Date(h.criado_em).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Nome *</label>
                  <input value={formLead.nome} onChange={e => setFormLead(f => ({ ...f, nome: e.target.value }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none" placeholder="Nome do lead..."
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Telefone</label>
                  <input value={formLead.telefone} onChange={e => setFormLead(f => ({ ...f, telefone: e.target.value }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none" placeholder="(61) 9xxxx-xxxx"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Procedimento de Interesse</label>
                  <select value={formLead.procedimento_interesse} onChange={e => setFormLead(f => ({ ...f, procedimento_interesse: e.target.value }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
                    <option value="">Selecionar...</option>
                    {procedimentos.map((p: any) => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Responsavel</label>
                  <select value={formLead.responsavel_id} onChange={e => setFormLead(f => ({ ...f, responsavel_id: e.target.value }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
                    <option value="">Sem responsavel</option>
                    {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Coluna</label>
                  <select value={formLead.coluna_id} onChange={e => setFormLead(f => ({ ...f, coluna_id: e.target.value }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
                    {colunas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Observacoes</label>
                  <textarea value={formLead.observacoes} onChange={e => setFormLead(f => ({ ...f, observacoes: e.target.value }))}
                    rows={3} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
                </div>
                <div className="flex gap-3">
                  {modalLead.lead && (
                    <button onClick={() => deletarLead(modalLead.lead!.id)}
                      className="px-4 py-3 rounded-2xl text-sm transition hover:scale-105"
                      style={{ background: "rgba(232,122,122,0.1)", color: "var(--danger)" }}>
                      Excluir
                    </button>
                  )}
                  <button onClick={() => setModalLead(null)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
                  <button onClick={salvarLead} disabled={salvando || !formLead.nome.trim()}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold transition hover:scale-105"
                    style={{ background: formLead.nome.trim() ? "var(--gold)" : "var(--gold-bg)", color: "#0a0707" }}>
                    {salvando ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(novaColuna || modalColuna) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>{modalColuna ? "Editar Coluna" : "Nova Coluna"}</h2>
              <button onClick={() => { setNovaColuna(false); setModalColuna(null); }} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Nome</label>
                <input value={formColuna.nome} onChange={e => setFormColuna(f => ({ ...f, nome: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none" placeholder="Nome da coluna..."
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {cores.map(cor => (
                    <button key={cor} onClick={() => setFormColuna(f => ({ ...f, cor }))}
                      className="w-8 h-8 rounded-full transition hover:scale-110"
                      style={{ background: cor, border: formColuna.cor === cor ? "3px solid white" : "2px solid transparent", boxShadow: formColuna.cor === cor ? "0 0 0 2px " + cor : "none" }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setNovaColuna(false); setModalColuna(null); }} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={salvarColuna} disabled={salvando || !formColuna.nome.trim()}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold transition hover:scale-105"
                style={{ background: "var(--gold)", color: "#0a0707" }}>
                {salvando ? "..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`select option { background: var(--bg-card); } input::placeholder, textarea::placeholder { color: var(--text-muted); }`}</style>
    </div>
  );
}