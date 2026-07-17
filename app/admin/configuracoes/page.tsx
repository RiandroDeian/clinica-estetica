"use client";
import { useEffect, useState } from "react";

type Permissoes = {
  agenda: boolean; pacientes: boolean; prontuario: boolean;
  pacotes: boolean; laser: boolean; procedimentos: boolean;
  estoque: boolean; financeiro: boolean; orcamentos: boolean;
  crm: boolean; metas: boolean; comissoes: boolean;
  relatorios: boolean; chat: boolean; whatsapp: boolean;
  configuracoes: boolean; auditoria: boolean; recepcao: boolean;
};

type Funcionario = {
  id: string; nome: string; email: string; role: string; cargo: string;
  cor: string; ativo: boolean; telefone?: string; data_admissao?: string;
  status?: string; especialidades?: string[]; permissoes?: Permissoes; criado_em?: string;
  recebe_follow_ups?: boolean;
};

const cargos = [
  "Administrador","Recepcionista","Esteticista","Biomédica",
  "Massoterapeuta","Gerente","Financeiro","Laser","Enfermeiro",
];

const todasEspecialidades = [
  "Limpeza de Pele","Botox","Bioestimulador de Colágeno","Preenchimento Labial",
  "Rinomodelação","Perfiloplastia","Depilação a Laser","Dry Needling",
  "Quiropraxia","Liberação Miofascial","Ventosaterapia","Protocolo Pele Perfeita",
  "Protocolo Capilar","Lipo de Papada Enzimática","Lipo Corporal Enzimática",
];

const permissoesConfig = [
  { key: "agenda",        label: "Agenda" },
  { key: "pacientes",     label: "Pacientes" },
  { key: "prontuario",    label: "Prontuário" },
  { key: "pacotes",       label: "Pacotes" },
  { key: "laser",         label: "Laser" },
  { key: "procedimentos", label: "Procedimentos" },
  { key: "estoque",       label: "Estoque" },
  { key: "financeiro",    label: "Faturamento" },
  { key: "orcamentos",    label: "Orçamentos" },
  { key: "crm",           label: "CRM" },
  { key: "metas",         label: "Metas" },
  { key: "comissoes",     label: "Comissões" },
  { key: "relatorios",    label: "Relatórios" },
  { key: "chat",          label: "Chat Interno" },
  { key: "whatsapp",      label: "WhatsApp" },
  { key: "configuracoes", label: "Configurações" },
  { key: "auditoria",     label: "Auditoria" },
  { key: "recepcao",      label: "Recepção" },
];

const cores = ["var(--gold)","#7ae8a0","#7ab8e8","#e87a7a","#e8c97a","#c87ae8","#e8a07a","#7ae8d8"];

const statusConfig: Record<string, { label: string; color: string }> = {
  ativo:    { label: "Ativo",   color: "#7ae8a0" },
  ferias:   { label: "Férias",  color: "#e8c97a" },
  inativo:  { label: "Inativo", color: "#e87a7a" },
  licenca:  { label: "Licença", color: "#7ab8e8" },
};

const permissoesPadrao: Record<string, Permissoes> = {
  administrador: {
    agenda:true, pacientes:true, prontuario:true, pacotes:true, laser:true,
    procedimentos:true, estoque:true, financeiro:true, orcamentos:true,
    crm:true, metas:true, comissoes:true, relatorios:true, chat:true,
    whatsapp:true, configuracoes:true, auditoria:true, recepcao:true,
  },
  recepcionista: {
    agenda:true, pacientes:true, prontuario:false, pacotes:true, laser:false,
    procedimentos:false, estoque:false, financeiro:false, orcamentos:true,
    crm:true, metas:false, comissoes:false, relatorios:false, chat:true,
    whatsapp:true, configuracoes:false, auditoria:false, recepcao:true,
  },
  esteticista: {
    agenda:true, pacientes:true, prontuario:true, pacotes:true, laser:false,
    procedimentos:true, estoque:false, financeiro:false, orcamentos:false,
    crm:false, metas:false, comissoes:true, relatorios:false, chat:true,
    whatsapp:false, configuracoes:false, auditoria:false, recepcao:false,
  },
  enfermeiro: {
    agenda:true, pacientes:true, prontuario:true, pacotes:true, laser:true,
    procedimentos:true, estoque:false, financeiro:false, orcamentos:false,
    crm:false, metas:false, comissoes:true, relatorios:false, chat:true,
    whatsapp:false, configuracoes:false, auditoria:false, recepcao:false,
  },
  massagista: {
    agenda:true, pacientes:true, prontuario:true, pacotes:true, laser:false,
    procedimentos:true, estoque:false, financeiro:false, orcamentos:false,
    crm:false, metas:false, comissoes:true, relatorios:false, chat:true,
    whatsapp:false, configuracoes:false, auditoria:false, recepcao:false,
  },
  laser: {
    agenda:true, pacientes:true, prontuario:true, pacotes:false, laser:true,
    procedimentos:false, estoque:false, financeiro:false, orcamentos:false,
    crm:false, metas:false, comissoes:true, relatorios:false, chat:true,
    whatsapp:false, configuracoes:false, auditoria:false, recepcao:false,
  },
  financeiro: {
    agenda:false, pacientes:false, prontuario:false, pacotes:true, laser:false,
    procedimentos:false, estoque:true, financeiro:true, orcamentos:true,
    crm:false, metas:true, comissoes:true, relatorios:true, chat:true,
    whatsapp:false, configuracoes:false, auditoria:false, recepcao:false,
  },
  default: {
    agenda:true, pacientes:true, prontuario:false, pacotes:false, laser:false,
    procedimentos:false, estoque:false, financeiro:false, orcamentos:false,
    crm:false, metas:false, comissoes:false, relatorios:false, chat:true,
    whatsapp:false, configuracoes:false, auditoria:false, recepcao:false,
  },
};

function getPermissoesPadrao(cargo: string): Permissoes {
  const key = cargo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return permissoesPadrao[key] ?? permissoesPadrao.default;
}

export default function ConfiguracoesPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<"perfil"|"permissoes"|"agenda">("perfil");
  const [modalNovo, setModalNovo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [form, setForm] = useState({
    nome: "", email: "", senha: "", cargo: "Recepcionista", cor: "var(--gold)",
    telefone: "", data_admissao: "", status: "ativo", especialidades: [] as string[],
    permissoes: permissoesPadrao.recepcionista,
  });

  async function buscar() {
    setCarregando(true);
    const res = await fetch("/api/funcionarios");
    const data = await res.json();
    setFuncionarios(Array.isArray(data) ? data : []);
    setCarregando(false);
  }

  useEffect(() => { buscar(); }, []);

  function abrirDrawer(f: Funcionario) {
    setFuncionarioSelecionado(f);
    setAbaAtiva("perfil");
    setDrawerAberto(true);
  }

  async function salvarEdicao(campos: Partial<Funcionario>) {
    if (!funcionarioSelecionado) return;
    setSalvando(true);
    const res = await fetch("/api/funcionarios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: funcionarioSelecionado.id, ...campos }),
    });
    if (res.ok) {
      const atualizado = await res.json();
      setFuncionarioSelecionado(atualizado);
      buscar();
      setSucesso("Salvo com sucesso!");
      setTimeout(() => setSucesso(""), 2500);
    }
    setSalvando(false);
  }

  async function criarFuncionario() {
    setSalvando(true);
    const res = await fetch("/api/funcionarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        role: form.cargo.toLowerCase() === "administrador" ? "admin" : "funcionario",
      }),
    });
    if (res.ok) {
      setModalNovo(false);
      setForm({ nome:"", email:"", senha:"", cargo:"Recepcionista", cor:"var(--gold)", telefone:"", data_admissao:"", status:"ativo", especialidades:[], permissoes: permissoesPadrao.recepcionista });
      buscar();
      setSucesso("Funcionário criado!");
      setTimeout(() => setSucesso(""), 2500);
    }
    setSalvando(false);
  }

  const total = funcionarios.length;
  const ativos = funcionarios.filter(f => f.status === "ativo" || (!f.status && f.ativo)).length;
  const ferias = funcionarios.filter(f => f.status === "ferias").length;
  const s = funcionarioSelecionado;

  return (
    <div className="flex gap-6 h-full">
      {/* COLUNA PRINCIPAL */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Sistema</p>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Configurações</h1>
          </div>
          <button onClick={() => setModalNovo(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
            style={{ background: "var(--gold)", color: "var(--bg-input)" }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
            Novo Funcionário
          </button>
        </div>

        {sucesso && (
          <div className="mb-4 rounded-2xl px-5 py-3 text-sm"
            style={{ background: "rgba(122,232,160,0.1)", border: "1px solid rgba(122,232,160,0.2)", color: "#7ae8a0" }}>
            {sucesso}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total",     valor: total,  cor: "var(--gold)" },
            { label: "Ativos",    valor: ativos, cor: "#7ae8a0" },
            { label: "Em Férias", valor: ferias, cor: "#e8c97a" },
          ].map(k => (
            <div key={k.label} className="rounded-2xl px-5 py-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <p className="text-2xl font-bold" style={{ color: k.cor }}>{k.valor}</p>
              <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Lista de funcionários */}
        <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Equipe</p>
          </div>
          {carregando ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "var(--gold)" }} />
            </div>
          ) : (
            funcionarios.map((f, i) => {
              const sc = statusConfig[f.status ?? "ativo"] ?? statusConfig.ativo;
              return (
                <div key={f.id} className="flex items-center gap-4 px-5 py-4 cursor-pointer transition hover:bg-[var(--bg-hover)]"
                  style={{ borderBottom: i < funcionarios.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                  onClick={() => abrirDrawer(f)}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: (f.cor ?? "var(--gold)") + "22", color: f.cor ?? "var(--gold)" }}>
                    {f.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{f.nome}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{f.email}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                    style={{ background: sc.color + "18", color: sc.color }}>
                    {sc.label}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                    style={{ background: "var(--border-subtle)", color: "var(--text-muted)" }}>
                    {f.cargo}
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 flex-shrink-0" stroke="var(--text-muted)" strokeWidth={1.5}>
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* DRAWER LATERAL */}
      {drawerAberto && s && (
        <div className="w-96 flex-shrink-0 rounded-3xl overflow-hidden flex flex-col"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>

          {/* Header drawer */}
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: (s.cor ?? "var(--gold)") + "22", color: s.cor ?? "var(--gold)" }}>
                {s.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{s.nome}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.cargo}</p>
              </div>
            </div>
            <button onClick={() => setDrawerAberto(false)} style={{ color: "var(--text-muted)" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Abas */}
          <div className="flex" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            {(["perfil","permissoes","agenda"] as const).map(aba => (
              <button key={aba} onClick={() => setAbaAtiva(aba)}
                className="flex-1 py-3 text-xs uppercase tracking-widest transition"
                style={{
                  color: abaAtiva === aba ? "var(--gold)" : "var(--text-muted)",
                  borderBottom: abaAtiva === aba ? "2px solid var(--gold)" : "2px solid transparent",
                  background: "transparent",
                }}>
                {aba === "perfil" ? "Perfil" : aba === "permissoes" ? "Permissões" : "Agenda"}
              </button>
            ))}
          </div>

          <div className="flex-1 p-5 overflow-y-auto">
            {/* ABA PERFIL */}
            {abaAtiva === "perfil" && (
              <div className="flex flex-col gap-4">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Permissões são aplicadas automaticamente ao trocar o cargo, mas podem ser ajustadas individualmente.
                </p>

                {/* Status */}
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Status</label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                      <button key={key} onClick={() => salvarEdicao({ status: key })}
                        className="px-3 py-1.5 rounded-xl text-xs transition"
                        style={{
                          background: (s.status ?? "ativo") === key ? cfg.color + "18" : "transparent",
                          color: cfg.color,
                          border: `1px solid ${(s.status ?? "ativo") === key ? cfg.color : cfg.color + "40"}`,
                        }}>
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cargo */}
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Cargo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {cargos.map(c => (
                      <button key={c} onClick={() => {
                        const novasPermissoes = getPermissoesPadrao(c);
                        salvarEdicao({ cargo: c, permissoes: novasPermissoes });
                        setFuncionarioSelecionado(prev => prev ? { ...prev, cargo: c, permissoes: novasPermissoes } : null);
                      }}
                        className="py-2 rounded-xl text-xs uppercase tracking-widest transition"
                        style={{
                          background: s.cargo === c ? "var(--border-color)" : "transparent",
                          color: s.cargo === c ? "var(--gold)" : "var(--text-muted)",
                          border: `1px solid ${s.cargo === c ? "rgba(200,160,120,0.3)" : "var(--gold-bg)"}`,
                        }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cor */}
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Cor identificadora</label>
                  <div className="flex gap-2 flex-wrap">
                    {cores.map(cor => (
                      <button key={cor} onClick={() => salvarEdicao({ cor })}
                        className="w-8 h-8 rounded-full transition hover:scale-110"
                        style={{ background: cor, border: s.cor === cor ? "3px solid white" : "2px solid transparent" }} />
                    ))}
                  </div>
                </div>

                {/* Especialidades */}
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Especialidades</label>
                  <div className="flex flex-wrap gap-2">
                    {todasEspecialidades.map(esp => {
                      const ativa = s.especialidades?.includes(esp);
                      return (
                        <button key={esp} onClick={() => {
                          const novas = ativa
                            ? (s.especialidades ?? []).filter(e => e !== esp)
                            : [...(s.especialidades ?? []), esp];
                          salvarEdicao({ especialidades: novas });
                          setFuncionarioSelecionado(prev => prev ? { ...prev, especialidades: novas } : null);
                        }}
                          className="px-2.5 py-1 rounded-xl text-xs transition"
                          style={{
                            background: ativa ? "var(--gold-bg)" : "transparent",
                            color: ativa ? "var(--gold)" : "var(--text-muted)",
                            border: `1px solid ${ativa ? "rgba(200,160,120,0.3)" : "var(--border-subtle)"}`,
                          }}>
                          {esp}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ✅ Alertas de follow-up (quem recebe as tarefas de contato) */}
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Alertas de follow-up</label>
                  <div className="flex items-center justify-between rounded-2xl px-4 py-3"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                    <div className="pr-3">
                      <p className="text-sm" style={{ color: "var(--text-primary)" }}>Recebe alertas de contato</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        Vê na aba Pacientes quem precisa de mensagem (24h, 48h, feedback 72h e 7 dias).
                      </p>
                    </div>
                    <button onClick={() => {
                      const novo = !s.recebe_follow_ups;
                      salvarEdicao({ recebe_follow_ups: novo });
                      setFuncionarioSelecionado(prev => prev ? { ...prev, recebe_follow_ups: novo } : null);
                    }}
                      className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                      style={{ background: s.recebe_follow_ups ? "var(--gold)" : "var(--border-color)" }}>
                      <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: s.recebe_follow_ups ? "calc(100% - 20px)" : "4px" }} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ABA PERMISSÕES */}
            {abaAtiva === "permissoes" && (
              <div className="flex flex-col gap-3">
                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                  Ative ou desative o acesso a cada módulo individualmente.
                </p>

                {/* ✅ Botão para dar acesso total */}
                <button onClick={() => {
                  const total = permissoesPadrao.administrador;
                  salvarEdicao({ permissoes: total });
                  setFuncionarioSelecionado(prev => prev ? { ...prev, permissoes: total } : null);
                }}
                  className="w-full py-2 rounded-xl text-xs uppercase tracking-widest transition mb-2"
                  style={{ background: "rgba(122,232,160,0.1)", color: "#7ae8a0", border: "1px solid rgba(122,232,160,0.3)" }}>
                  Dar acesso total
                </button>

                {permissoesConfig.map(p => {
                  const ativo = (s.permissoes as any)?.[p.key] ?? false;
                  return (
                    <div key={p.key} className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                      style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                      <span className="text-sm" style={{ color: "var(--text-primary)" }}>{p.label}</span>
                      <button onClick={() => {
                        const novas = { ...(s.permissoes ?? {}), [p.key]: !ativo } as Permissoes;
                        salvarEdicao({ permissoes: novas });
                        setFuncionarioSelecionado(prev => prev ? { ...prev, permissoes: novas } : null);
                      }}
                        className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                        style={{ background: ativo ? "var(--gold)" : "var(--border-color)" }}>
                        <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                          style={{ left: ativo ? "calc(100% - 20px)" : "4px" }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ABA AGENDA */}
            {abaAtiva === "agenda" && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                  Configurações de agenda do profissional em breve.
                </p>
              </div>
            )}
          </div>

          {salvando && (
            <div className="px-5 py-3 flex items-center gap-2"
              style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <div className="w-4 h-4 rounded-full border-2 animate-spin"
                style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "var(--gold)" }} />
              <span className="text-xs" style={{ color: "var(--gold)" }}>Salvando...</span>
            </div>
          )}
        </div>
      )}

      {/* MODAL NOVO FUNCIONÁRIO */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: "var(--gold)" }}>Novo Funcionário</h2>
              <button onClick={() => setModalNovo(false)} style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {[
                { label: "Nome completo*", key: "nome",     type: "text" },
                { label: "Email*",         key: "email",    type: "email" },
                { label: "Senha inicial*", key: "senha",    type: "password" },
                { label: "Telefone",       key: "telefone", type: "tel" },
                { label: "Data de admissão", key: "data_admissao", type: "date" },
              ].map(campo => (
                <div key={campo.key}>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>{campo.label}</label>
                  <input type={campo.type} value={(form as any)[campo.key]}
                    onChange={e => setForm(f => ({ ...f, [campo.key]: e.target.value }))}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
                </div>
              ))}

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Cargo</label>
                <div className="grid grid-cols-2 gap-2">
                  {cargos.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, cargo: c, permissoes: getPermissoesPadrao(c) }))}
                      className="py-2.5 rounded-xl text-xs uppercase tracking-widest transition"
                      style={{
                        background: form.cargo === c ? "var(--border-color)" : "transparent",
                        color: form.cargo === c ? "var(--gold)" : "var(--text-muted)",
                        border: `1px solid ${form.cargo === c ? "rgba(200,160,120,0.3)" : "var(--gold-bg)"}`,
                      }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest block mb-3" style={{ color: "var(--text-secondary)" }}>Cor identificadora</label>
                <div className="flex gap-2 flex-wrap">
                  {cores.map(cor => (
                    <button key={cor} onClick={() => setForm(f => ({ ...f, cor }))}
                      className="w-8 h-8 rounded-full transition hover:scale-110"
                      style={{ background: cor, border: form.cor === cor ? "3px solid white" : "2px solid transparent" }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalNovo(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{ border: "1px solid rgba(200,160,120,0.2)", color: "var(--text-muted)" }}>
                Cancelar
              </button>
              <button onClick={criarFuncionario} disabled={salvando || !form.nome || !form.email || !form.senha}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: "var(--gold)", color: "var(--bg-input)" }}>
                {salvando ? "Salvando..." : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`input::placeholder { color: #3a2e28; } input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.3); }`}</style>
    </div>
  );
}