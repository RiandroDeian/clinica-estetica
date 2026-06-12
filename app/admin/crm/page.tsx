"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

type Coluna = { id: string; nome: string; cor: string; ordem: number };
type Tarefa = { id: string; lead_id: string; titulo: string; data_vencimento?: string; concluida: boolean };
type Lead = {
  id: string; nome: string; telefone?: string; procedimento_interesse?: string;
  observacoes?: string; coluna_id: string; responsavel_id?: string;
  ultima_interacao: string; criado_em: string; etiquetas?: string[];
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

const ETIQUETAS = [
  { key: "vip", label: "VIP", cor: "#e8c97a" },
  { key: "urgente", label: "Urgente", cor: "#e87a7a" },
  { key: "retorno", label: "Retorno", cor: "#7aa6e8" },
  { key: "novo", label: "Novo", cor: "#7ae8b4" },
  { key: "frio", label: "Frio", cor: "#a89080" },
];

function LeadCard({ lead, onClick, tarefas, onNotaRapida }: { lead: Lead; onClick: () => void; tarefas: Tarefa[]; onNotaRapida?: () => void }) {
  const diasSemInteracao = Math.floor((Date.now() - new Date(lead.ultima_interacao).getTime()) / 86400000);
  const diasNaColuna = Math.floor((Date.now() - new Date(lead.criado_em).getTime()) / 86400000);
  const tarefasPendentes = tarefas.filter(t => !t.concluida);
  const tarefasVencidas = tarefasPendentes.filter(t => t.data_vencimento && new Date(t.data_vencimento) < new Date());
  const etiquetas = lead.etiquetas ?? [];

  return (
    <div onClick={onClick} draggable
      onDragStart={e => { e.dataTransfer.setData("lead_id", lead.id); e.dataTransfer.setData("origem_id", lead.coluna_id); }}
      className="rounded-2xl p-4 cursor-pointer transition hover:scale-[1.02] select-none"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
      
      {etiquetas.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-2">
          {etiquetas.map(e => {
            const et = ETIQUETAS.find(x => x.key === e);
            return et ? (
              <span key={e} className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: et.cor + "22", color: et.cor }}>
                {et.label}
              </span>
            ) : null;
          })}
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-semibold leading-5" style={{ color: "var(--text-primary)" }}>{lead.nome}</p>
        <div className="flex flex-col items-end gap-1">
          {diasSemInteracao > 2 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: "rgba(232,122,122,0.1)", color: "var(--danger)" }}>
              {diasSemInteracao}d sem contato
            </span>
          )}
        </div>
      </div>

      {lead.telefone && (
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>📞 {lead.telefone}</p>
          <a href={"https://wa.me/55" + lead.telefone.replace(/\D/g, "")} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-[10px] px-1.5 py-0.5 rounded-full transition hover:scale-105"
            style={{ background: "rgba(37,211,102,0.1)", color: "#25D366" }}>
            WhatsApp
          </a>
        </div>
      )}

      {lead.procedimento_interesse && (
        <span className="text-xs px-2 py-0.5 rounded-full inline-block mb-2"
          style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
          {lead.procedimento_interesse}
        </span>
      )}

      {tarefasPendentes.length > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: tarefasVencidas.length > 0 ? "rgba(232,122,122,0.1)" : "rgba(122,232,160,0.1)", color: tarefasVencidas.length > 0 ? "var(--danger)" : "var(--success)" }}>
            {tarefasVencidas.length > 0 ? "⚠" : "✓"} {tarefasPendentes.length} tarefa{tarefasPendentes.length > 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        {lead.funcionarios ? (
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: (lead.funcionarios.cor ?? "#c8a078") + "33", color: lead.funcionarios.cor ?? "#c8a078" }}>
              {lead.funcionarios.nome.charAt(0)}
            </div>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{lead.funcionarios.nome.split(" ")[0]}</span>
          </div>
        ) : <div />}
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{diasNaColuna}d</span>
      </div>
    </div>
  );
}

function ColunaKanban({ coluna, leads, tarefas, onAddLead, onEditLead, onDeleteColuna, onEditColuna, onNotaRapida }: {
  coluna: Coluna; leads: Lead[]; tarefas: Tarefa[];
  onAddLead: () => void; onEditLead: (l: Lead) => void;
  onDeleteColuna: (id: string) => void; onEditColuna: (c: Coluna) => void;
  onNotaRapida?: (l: Lead) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div className="flex flex-col flex-shrink-0 rounded-3xl"
      style={{ width: 280, background: "var(--bg-card)", border: over ? "1px solid " + coluna.cor : "1px solid var(--border-color)", transition: "border 0.2s" }}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { setOver(false); }}>
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
      <div className="flex flex-col gap-2 p-3 flex-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)", minHeight: 100 }}>
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} onClick={() => onEditLead(lead)}
            onNotaRapida={() => onNotaRapida(lead)}
            tarefas={tarefas.filter(t => t.lead_id === lead.id)} />
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
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [procedimentos, setProcedimentos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroResp, setFiltroResp] = useState("");
  const [filtroProc, setFiltroProc] = useState("");
  const [filtroEtiqueta, setFiltroEtiqueta] = useState("");
  const [abaAtiva, setAbaAtiva] = useState<"kanban"|"historico"|"dashboard">("kanban");
  const [modalLead, setModalLead] = useState<{ lead?: Lead; coluna_id?: string } | null>(null);
  const [modalColuna, setModalColuna] = useState<Coluna | null>(null);
  const [novaColuna, setNovaColuna] = useState(false);
  const [formLead, setFormLead] = useState({ nome: "", telefone: "", procedimento_interesse: "", responsavel_id: "", coluna_id: "", observacoes: "", etiquetas: [] as string[] });
  const [formColuna, setFormColuna] = useState({ nome: "", cor: "#c8a078" });
  const [salvando, setSalvando] = useState(false);
  const [abaModal, setAbaModal] = useState<"dados"|"tarefas"|"historico">("dados");
  const [tarefasLead, setTarefasLead] = useState<Tarefa[]>([]);
  const [novaTarefa, setNovaTarefa] = useState({ titulo: "", data_vencimento: "" });
  const [salvandoTarefa, setSalvandoTarefa] = useState(false);
  const [modalIntegracao, setModalIntegracao] = useState<Lead | null>(null);
  const [salvandoIntegracao, setSalvandoIntegracao] = useState(false);
  const [ordenacao, setOrdenacao] = useState<"recente"|"nome"|"interacao">("recente");
  const [notaRapida, setNotaRapida] = useState<{ lead: Lead; texto: string } | null>(null);
  const [salvandoNota, setSalvandoNota] = useState(false);

  const buscar = useCallback(async () => {
    setCarregando(true);
    const [c, l, h, f, p, t] = await Promise.all([
      fetch("/api/crm/colunas").then(r => r.json()),
      fetch("/api/crm/leads").then(r => r.json()),
      fetch("/api/crm/historico").then(r => r.json()),
      fetch("/api/funcionarios").then(r => r.json()),
      fetch("/api/procedimentos").then(r => r.json()),
      fetch("/api/crm/tarefas").then(r => r.json()),
    ]);
    setColunas(Array.isArray(c) ? c : []);
    setLeads(Array.isArray(l) ? l : []);
    setHistorico(Array.isArray(h) ? h : []);
    setFuncionarios(Array.isArray(f) ? f : []);
    setProcedimentos(Array.isArray(p) ? p : []);
    setTarefas(Array.isArray(t) ? t : []);
    setCarregando(false);
  }, []);

  useEffect(() => { buscar(); }, [buscar]);

  async function buscarTarefasLead(lead_id: string) {
    const res = await fetch("/api/crm/tarefas?lead_id=" + lead_id);
    const data = await res.json();
    setTarefasLead(Array.isArray(data) ? data : []);
  }

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
    if (!confirm("Remover esta coluna?")) return;
    await fetch("/api/crm/colunas?id=" + id, { method: "DELETE" });
    toast.success("Coluna removida");
    buscar();
  }

  async function adicionarTarefa(lead_id: string) {
    if (!novaTarefa.titulo.trim()) return;
    setSalvandoTarefa(true);
    await fetch("/api/crm/tarefas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead_id, ...novaTarefa }) });
    setNovaTarefa({ titulo: "", data_vencimento: "" });
    buscarTarefasLead(lead_id);
    buscar();
    setSalvandoTarefa(false);
  }

  async function toggleTarefa(tarefa: Tarefa) {
    await fetch("/api/crm/tarefas", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: tarefa.id, concluida: !tarefa.concluida }) });
    if (modalLead?.lead) buscarTarefasLead(modalLead.lead.id);
    buscar();
  }

  async function deletarTarefa(id: string, lead_id: string) {
    await fetch("/api/crm/tarefas?id=" + id, { method: "DELETE" });
    buscarTarefasLead(lead_id);
    buscar();
  }

  function toggleEtiqueta(key: string) {
    setFormLead(f => ({
      ...f,
      etiquetas: (f.etiquetas ?? []).includes(key)
        ? (f.etiquetas ?? []).filter(e => e !== key)
        : [...(f.etiquetas ?? []), key],
    }));
  }

  function exportarCSV() {
    const header = ["Nome","Telefone","Procedimento","Responsavel","Coluna","Etiquetas","Criado em"];
    const rows = leads.map(l => [l.nome, l.telefone ?? "", l.procedimento_interesse ?? "", l.funcionarios?.nome ?? "", colunas.find(col => col.id === l.coluna_id)?.nome ?? "", (l.etiquetas ?? []).join(";"), new Date(l.criado_em).toLocaleDateString("pt-BR")]);
    const csv = [header, ...rows].map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "crm-leads.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  async function criarPacienteDoLead(lead: Lead) {
    setSalvandoIntegracao(true);
    const res = await fetch("/api/pacientes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: lead.nome, telefone: lead.telefone ?? "" }) });
    if (res.ok) {
      const colunaFechou = colunas.find(c => c.nome.toLowerCase().includes("fechou") || c.nome.toLowerCase().includes("tratamento"));
      if (colunaFechou) await fetch("/api/crm/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: lead.id, coluna_id: colunaFechou.id, coluna_origem_id: lead.coluna_id }) });
      setModalIntegracao(null); buscar();
    }
    setSalvandoIntegracao(false);
  }

  async function salvarNotaRapida() {
    if (!notaRapida) return;
    setSalvandoNota(true);
    await fetch("/api/crm/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: notaRapida.lead.id, observacoes: notaRapida.texto }) });
    setNotaRapida(null); buscar();
    setSalvandoNota(false);
  }

  const leadsFiltradosOrdenados = (items: Lead[]) => {
    const f = items.filter(l => {
      const matchBusca = l.nome.toLowerCase().includes(busca.toLowerCase()) || (l.telefone ?? "").includes(busca);
      const matchResp = !filtroResp || l.responsavel_id === filtroResp;
      const matchEtiqueta = !filtroEtiqueta || (l.etiquetas ?? []).includes(filtroEtiqueta);
      return matchBusca && matchResp && matchEtiqueta;
    });
    if (ordenacao === "nome") return f.sort((a, b) => a.nome.localeCompare(b.nome));
    if (ordenacao === "interacao") return f.sort((a, b) => new Date(b.ultima_interacao).getTime() - new Date(a.ultima_interacao).getTime());
    return f.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
  };

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
    const matchEtiqueta = !filtroEtiqueta || (l.etiquetas ?? []).includes(filtroEtiqueta);
    return matchBusca && matchResp && matchProc && matchEtiqueta;
  });

  const totalLeads = leads.length;
  const totalAvaliacao = leads.filter(l => colunas.find(c => c.id === l.coluna_id)?.nome?.toLowerCase().includes("avalia")).length;
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
          <button onClick={exportarCSV} className="px-4 py-2.5 rounded-2xl text-xs uppercase tracking-widest transition hover:scale-105" style={{ border: "1px solid var(--border-color)", color: "var(--success)" }}>↓ CSV</button>
          <button onClick={() => { setNovaColuna(true); setModalColuna(null); setFormColuna({ nome: "", cor: "#c8a078" }); }}
            className="px-4 py-2.5 rounded-2xl text-xs uppercase tracking-widest transition hover:scale-105"
            style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
            + Coluna
          </button>
          <button onClick={() => {
            const primeiraColuna = colunas[0];
            if (!primeiraColuna) return;
            setModalLead({ coluna_id: primeiraColuna.id });
            setFormLead({ nome: "", telefone: "", procedimento_interesse: "", responsavel_id: "", coluna_id: primeiraColuna.id, observacoes: "", etiquetas: [] });
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
            <select value={filtroEtiqueta} onChange={e => setFiltroEtiqueta(e.target.value)}
              className="rounded-2xl px-4 py-2.5 text-sm outline-none"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
              <option value="">Todas etiquetas</option>
              {ETIQUETAS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
            </select>
            <select value={ordenacao} onChange={e => setOrdenacao(e.target.value as any)} className="rounded-2xl px-4 py-2.5 text-sm outline-none" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
              <option value="recente">Mais recentes</option>
              <option value="nome">Nome A-Z</option>
              <option value="interacao">Ultima interacao</option>
            </select>
          </div>
          {carregando ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} />
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
              {colunas.map(coluna => (
                <div key={coluna.id} onDrop={e => handleDrop(e, coluna.id)} onDragOver={e => e.preventDefault()}>
                  <ColunaKanban
                    coluna={coluna}
                    leads={leadsFiltradosOrdenados(leads).filter(l => l.coluna_id === coluna.id)}
                    tarefas={tarefas}
                    onAddLead={() => {
                      setModalLead({ coluna_id: coluna.id });
                      setFormLead({ nome: "", telefone: "", procedimento_interesse: "", responsavel_id: "", coluna_id: coluna.id, observacoes: "", etiquetas: [] });
                      setAbaModal("dados");
                    }}
                    onEditLead={lead => {
                      setModalLead({ lead, coluna_id: lead.coluna_id });
                      setFormLead({ nome: lead.nome, telefone: lead.telefone ?? "", procedimento_interesse: lead.procedimento_interesse ?? "", responsavel_id: lead.responsavel_id ?? "", coluna_id: lead.coluna_id, observacoes: lead.observacoes ?? "", etiquetas: lead.etiquetas ?? [] });
                      setAbaModal("dados");
                      buscarTarefasLead(lead.id);
                    }}
                    onDeleteColuna={deletarColuna}
                    onNotaRapida={(lead) => setNotaRapida({ lead, texto: lead.observacoes ?? "" })}
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
          <div className="rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <h2 className="text-xs uppercase tracking-widest mb-5" style={{ color: "var(--gold)" }}>Tarefas Vencidas</h2>
            {tarefas.filter(t => !t.concluida && t.data_vencimento && new Date(t.data_vencimento) < new Date()).length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhuma tarefa vencida</p>
            ) : (
              <div className="flex flex-col gap-2">
                {tarefas.filter(t => !t.concluida && t.data_vencimento && new Date(t.data_vencimento) < new Date()).map(t => {
                  const lead = leads.find(l => l.id === t.lead_id);
                  return (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "rgba(232,122,122,0.05)", border: "1px solid rgba(232,122,122,0.2)" }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--danger)" }} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t.titulo}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{lead?.nome} · Venceu {new Date(t.data_vencimento!).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

      {modalLead !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>{modalLead.lead ? "Editar Lead" : "Novo Lead"}</h2>
              <button onClick={() => setModalLead(null)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            {modalLead.lead && (
              <div className="flex gap-1 mb-5 p-1 rounded-2xl" style={{ background: "var(--bg-input)" }}>
                {[{ key: "dados", label: "Dados" }, { key: "tarefas", label: "Tarefas (" + tarefasLead.filter(t => !t.concluida).length + ")" }, { key: "historico", label: "Historico" }].map(a => (
                  <button key={a.key} onClick={() => setAbaModal(a.key as any)}
                    className="flex-1 py-1.5 rounded-xl text-xs transition"
                    style={{ background: abaModal === a.key ? "var(--gold-bg)" : "transparent", color: abaModal === a.key ? "var(--gold)" : "var(--text-muted)" }}>
                    {a.label}
                  </button>
                ))}
              </div>
            )}

            {abaModal === "tarefas" && modalLead.lead && (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input value={novaTarefa.titulo} onChange={e => setNovaTarefa(f => ({ ...f, titulo: e.target.value }))}
                    placeholder="Nova tarefa..." onKeyDown={e => e.key === "Enter" && adicionarTarefa(modalLead.lead!.id)}
                    className="flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
                  <input type="datetime-local" value={novaTarefa.data_vencimento} onChange={e => setNovaTarefa(f => ({ ...f, data_vencimento: e.target.value }))}
                    className="rounded-2xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)", colorScheme: "dark" }} />
                  <button onClick={() => adicionarTarefa(modalLead.lead!.id)} disabled={salvandoTarefa || !novaTarefa.titulo.trim()}
                    className="px-4 py-2.5 rounded-2xl text-sm font-semibold transition hover:scale-105"
                    style={{ background: "var(--gold)", color: "#0a0707" }}>
                    +
                  </button>
                </div>
                {tarefasLead.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>Nenhuma tarefa</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {tarefasLead.map(t => {
                      const vencida = !t.concluida && t.data_vencimento && new Date(t.data_vencimento) < new Date();
                      return (
                        <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                          style={{ background: "var(--bg-input)", border: vencida ? "1px solid rgba(232,122,122,0.3)" : "1px solid var(--border-subtle)" }}>
                          <button onClick={() => toggleTarefa(t)} className="flex-shrink-0">
                            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition"
                              style={{ borderColor: t.concluida ? "var(--success)" : "var(--border-color)", background: t.concluida ? "var(--success)" : "transparent" }}>
                              {t.concluida && <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="white" strokeWidth={3}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </div>
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm" style={{ color: t.concluida ? "var(--text-muted)" : "var(--text-primary)", textDecoration: t.concluida ? "line-through" : "none" }}>{t.titulo}</p>
                            {t.data_vencimento && (
                              <p className="text-xs mt-0.5" style={{ color: vencida ? "var(--danger)" : "var(--text-muted)" }}>
                                {vencida ? "⚠ Venceu" : "📅"} {new Date(t.data_vencimento).toLocaleDateString("pt-BR")} {new Date(t.data_vencimento).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            )}
                          </div>
                          <button onClick={() => deletarTarefa(t.id, modalLead.lead!.id)} className="flex-shrink-0 transition hover:opacity-70" style={{ color: "var(--danger)" }}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {abaModal === "historico" && modalLead.lead && (
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
            )}

            {abaModal === "dados" && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Etiquetas</label>
                  <div className="flex gap-2 flex-wrap">
                    {ETIQUETAS.map(e => (
                      <button key={e.key} onClick={() => toggleEtiqueta(e.key)}
                        className="text-xs px-3 py-1.5 rounded-full transition hover:scale-105"
                        style={{ background: (formLead.etiquetas ?? []).includes(e.key) ? e.cor + "33" : "var(--bg-input)", color: (formLead.etiquetas ?? []).includes(e.key) ? e.cor : "var(--text-muted)", border: (formLead.etiquetas ?? []).includes(e.key) ? "1px solid " + e.cor : "1px solid var(--border-subtle)" }}>
                        {e.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Nome *</label>
                  <input value={formLead.nome} onChange={e => setFormLead(f => ({ ...f, nome: e.target.value }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none" placeholder="Nome do lead..."
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Telefone</label>
                  <div className="flex gap-2">
                    <input value={formLead.telefone} onChange={e => setFormLead(f => ({ ...f, telefone: e.target.value }))}
                      className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none" placeholder="(61) 9xxxx-xxxx"
                      style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
                    {formLead.telefone && (
                      <a href={"https://wa.me/55" + formLead.telefone.replace(/\D/g, "")} target="_blank" rel="noopener noreferrer"
                        className="px-4 py-3 rounded-2xl text-sm font-semibold transition hover:scale-105 flex items-center gap-1"
                        style={{ background: "rgba(37,211,102,0.1)", color: "#25D366" }}>
                        💬
                      </a>
                    )}
                  </div>
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
                    <>
                    <button onClick={() => setModalIntegracao(modalLead.lead!)} className="px-4 py-3 rounded-2xl text-sm transition hover:scale-105" style={{ background: "rgba(122,232,160,0.1)", color: "var(--success)" }}>+ Paciente</button>
                    <button onClick={() => deletarLead(modalLead.lead!.id)}
                      className="px-4 py-3 rounded-2xl text-sm transition hover:scale-105"
                      style={{ background: "rgba(232,122,122,0.1)", color: "var(--danger)" }}>
                      Excluir
                    </button>
                    </>
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
      {modalIntegracao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Criar Paciente</h2>
              <button onClick={() => setModalIntegracao(null)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="p-4 rounded-2xl mb-5" style={{ background: "var(--bg-input)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{modalIntegracao.nome}</p>
              {modalIntegracao.telefone && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{modalIntegracao.telefone}</p>}
            </div>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>Isso vai criar este lead como paciente no sistema e mover para Em Tratamento.</p>
            <div className="flex gap-3">
              <button onClick={() => setModalIntegracao(null)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={() => criarPacienteDoLead(modalIntegracao)} disabled={salvandoIntegracao} className="flex-1 py-3 rounded-2xl text-sm font-semibold transition hover:scale-105" style={{ background: "var(--success)", color: "white" }}>{salvandoIntegracao ? "Criando..." : "Confirmar"}</button>
            </div>
          </div>
        </div>
      )}
      {notaRapida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Nota — {notaRapida.lead.nome}</h2>
              <button onClick={() => setNotaRapida(null)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <textarea value={notaRapida.texto} onChange={e => setNotaRapida(n => n ? { ...n, texto: e.target.value } : null)} rows={5} placeholder="Digite uma nota..." autoFocus className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none mb-4" style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
            <div className="flex gap-3">
              <button onClick={() => setNotaRapida(null)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={salvarNotaRapida} disabled={salvandoNota} className="flex-1 py-3 rounded-2xl text-sm font-semibold transition hover:scale-105" style={{ background: "var(--gold)", color: "#0a0707" }}>{salvandoNota ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`select option { background: var(--bg-card); } input::placeholder, textarea::placeholder { color: var(--text-muted); }`}</style>
    </div>
  );
}