"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

type Paciente = {
  id: string; nome: string; telefone?: string; email?: string;
  cpf?: string; data_nascimento?: string; sexo?: string;
  alergias?: string; contraindicacoes?: string; medicamentos?: string;
  historico_medico?: string; tipo_sanguineo?: string; observacoes?: string;
  fumante?: boolean; gravida?: boolean; amamentando?: boolean;
  assinou_termo?: boolean;
};

type Anotacao = {
  id: string; conteudo: string; tipo: string; titulo?: string;
  criado_em: string; funcionarios?: { nome: string };
};

type Agendamento = {
  id: string; inicio: string; status: string;
  procedimentos?: { nome: string; cor: string };
  funcionarios?: { nome: string };
};

type Avaliacao = {
  id: string; nota_atendimento: number; nota_profissional: number;
  nota_experiencia: number; comentario?: string; criado_em: string;
};

type Faturamento = {
  id: string; valor_final: number; forma_pagamento: string;
  status_pagamento: string; criado_em: string;
};

const tiposAnotacao = [
  { key: "geral",       label: "Geral",        cor: "var(--text-muted)" },
  { key: "clinica",     label: "Clínica",      cor: "var(--info)"       },
  { key: "estetica",    label: "Estética",     cor: "var(--gold)"       },
  { key: "financeiro",  label: "Financeiro",   cor: "var(--success)"    },
  { key: "alerta",      label: "Alerta",       cor: "var(--danger)"     },
];

const tiposSanguineos = ["A+","A-","B+","B-","AB+","AB-","O+","O-","Não informado"];

function calcularIdade(data?: string) {
  if (!data) return null;
  const hoje = new Date();
  const nasc = new Date(data + "T12:00:00");
  let idade = hoje.getFullYear() - nasc.getFullYear();
  if (hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

export default function ProntuarioPage() {
  const searchParams = useSearchParams();
  const paciente_id = searchParams.get("id");

  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<"resumo"|"historico"|"anotacoes"|"financeiro"|"avaliacoes">("resumo");
  const [editandoSaude, setEditandoSaude] = useState(false);
  const [salvandoSaude, setSalvandoSaude] = useState(false);
  const [novaAnotacao, setNovaAnotacao] = useState(false);
  const [formAnotacao, setFormAnotacao] = useState({ titulo: "", conteudo: "", tipo: "geral" });
  const [salvandoAnotacao, setSalvandoAnotacao] = useState(false);
  const [formSaude, setFormSaude] = useState<Partial<Paciente>>({});

  const buscar = useCallback(async () => {
    if (!paciente_id) return;
    setCarregando(true);
    const res = await fetch(`/api/prontuario?paciente_id=${paciente_id}`);
    const data = await res.json();
    setDados(data);
    setFormSaude({
      alergias: data.paciente?.alergias ?? "",
      contraindicacoes: data.paciente?.contraindicacoes ?? "",
      medicamentos: data.paciente?.medicamentos ?? "",
      historico_medico: data.paciente?.historico_medico ?? "",
      tipo_sanguineo: data.paciente?.tipo_sanguineo ?? "Não informado",
      observacoes: data.paciente?.observacoes ?? "",
      fumante: data.paciente?.fumante ?? false,
      gravida: data.paciente?.gravida ?? false,
      amamentando: data.paciente?.amamentando ?? false,
    });
    setCarregando(false);
  }, [paciente_id]);

  useEffect(() => { buscar(); }, [buscar]);

  async function salvarSaude() {
    setSalvandoSaude(true);
    const res = await fetch("/api/prontuario", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "atualizar_paciente", paciente_id, ...formSaude }),
    });
    if (res.ok) { toast.success("Dados atualizados!"); setEditandoSaude(false); buscar(); }
    else toast.error("Erro ao salvar");
    setSalvandoSaude(false);
  }

  async function salvarAnotacao() {
    if (!formAnotacao.conteudo.trim()) return;
    setSalvandoAnotacao(true);
    const res = await fetch("/api/prontuario", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "anotacao", paciente_id, ...formAnotacao }),
    });
    if (res.ok) {
      toast.success("Anotação salva!");
      setNovaAnotacao(false);
      setFormAnotacao({ titulo: "", conteudo: "", tipo: "geral" });
      buscar();
    } else toast.error("Erro ao salvar");
    setSalvandoAnotacao(false);
  }

  if (!paciente_id) return (
    <div className="text-center py-20">
      <p className="text-4xl mb-3">📋</p>
      <p style={{ color: "var(--text-muted)" }}>Selecione um paciente para ver o prontuário</p>
      <a href="/admin/pacientes" className="inline-block mt-4 px-6 py-3 rounded-2xl text-sm transition hover:scale-105"
        style={{ background: "var(--gold)", color: "#0a0707" }}>
        Ir para Pacientes
      </a>
    </div>
  );

  if (carregando) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} />
    </div>
  );

  const p: Paciente = dados?.paciente ?? {};
  const agendamentos: Agendamento[] = dados?.agendamentos ?? [];
  const anotacoes: Anotacao[] = dados?.anotacoes ?? [];
  const avaliacoes: Avaliacao[] = dados?.avaliacoes ?? [];
  const faturamentos: Faturamento[] = dados?.faturamentos ?? [];
  const idade = calcularIdade(p.data_nascimento);

  const totalGasto = faturamentos.filter(f => f.status_pagamento === "pago").reduce((acc, f) => acc + Number(f.valor_final || 0), 0);
  const mediaAvaliacao = avaliacoes.length > 0 ? (avaliacoes.reduce((acc, a) => acc + a.nota_atendimento, 0) / avaliacoes.length).toFixed(1) : null;

  const inp = "w-full rounded-2xl px-4 py-3 text-sm outline-none";
  const inpStyle = { background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <a href="/admin/pacientes" className="text-sm transition hover:opacity-70" style={{ color: "var(--text-muted)" }}>← Pacientes</a>
      </div>

      <div className="flex items-center gap-5 mb-6 p-6 rounded-3xl flex-wrap"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
          {p.nome?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{p.nome}</h1>
          <div className="flex flex-wrap gap-3 mt-1">
            {idade && <span className="text-sm" style={{ color: "var(--text-muted)" }}>{idade} anos</span>}
            {p.tipo_sanguineo && p.tipo_sanguineo !== "Não informado" && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(232,122,122,0.1)", color: "var(--danger)" }}>
                {p.tipo_sanguineo}
              </span>
            )}
            {p.fumante && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(232,201,122,0.1)", color: "var(--warning)" }}>Fumante</span>}
            {p.gravida && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(122,184,232,0.1)", color: "var(--info)" }}>Grávida</span>}
            {p.amamentando && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(122,184,232,0.1)", color: "var(--info)" }}>Amamentando</span>}
            {p.assinou_termo && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(122,232,160,0.1)", color: "var(--success)" }}>✓ Termo assinado</span>}
          </div>
          {(p.alergias || p.contraindicacoes) && (
            <div className="mt-2 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(232,122,122,0.08)", border: "1px solid rgba(232,122,122,0.2)", color: "var(--danger)" }}>
              ⚠ {[p.alergias && `Alergias: ${p.alergias}`, p.contraindicacoes && `Contraindicações: ${p.contraindicacoes}`].filter(Boolean).join(" · ")}
            </div>
          )}
        </div>
        <div className="flex gap-4 flex-shrink-0">
          {[
            { label: "Visitas",    valor: agendamentos.filter(a => a.status === "finalizado").length, cor: "var(--gold)"    },
            { label: "Gasto Total",valor: `R$ ${totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`,         cor: "var(--success)" },
            { label: "Avaliação",  valor: mediaAvaliacao ? `${mediaAvaliacao}★` : "—",                                      cor: "var(--warning)" },
          ].map(k => (
            <div key={k.label} className="text-center">
              <p className="text-lg font-bold" style={{ color: k.cor }}>{k.valor}</p>
              <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-5 p-1 rounded-2xl flex-wrap" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        {([
          { key: "resumo",     label: "Saúde"      },
          { key: "historico",  label: `Histórico (${agendamentos.length})`  },
          { key: "anotacoes",  label: `Anotações (${anotacoes.length})`     },
          { key: "financeiro", label: `Financeiro (${faturamentos.length})` },
          { key: "avaliacoes", label: `Avaliações (${avaliacoes.length})`   },
        ] as const).map(aba => (
          <button key={aba.key} onClick={() => setAbaAtiva(aba.key)}
            className="flex-1 py-2 rounded-xl text-xs uppercase tracking-widest transition"
            style={{ background: abaAtiva === aba.key ? "var(--gold-bg)" : "transparent", color: abaAtiva === aba.key ? "var(--gold)" : "var(--text-muted)" }}>
            {aba.label}
          </button>
        ))}
      </div>

      {/* ABA SAÚDE */}
      {abaAtiva === "resumo" && (
        <div className="rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm uppercase tracking-widest" style={{ color: "var(--gold)" }}>Dados de Saúde</h2>
            <button onClick={() => setEditandoSaude(!editandoSaude)}
              className="text-xs px-4 py-2 rounded-xl transition hover:opacity-80"
              style={{ background: "var(--gold-bg)", color: "var(--gold)", border: "1px solid var(--border-color)" }}>
              {editandoSaude ? "Cancelar" : "Editar"}
            </button>
          </div>

          {editandoSaude ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Fumante",     key: "fumante"     },
                  { label: "Grávida",     key: "gravida"     },
                  { label: "Amamentando", key: "amamentando" },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={(formSaude as any)[item.key] ?? false}
                      onChange={e => setFormSaude(f => ({ ...f, [item.key]: e.target.checked }))}
                      className="w-4 h-4 rounded" />
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>{item.label}</span>
                  </label>
                ))}
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Tipo Sanguíneo</label>
                  <select value={formSaude.tipo_sanguineo ?? "Não informado"} onChange={e => setFormSaude(f => ({ ...f, tipo_sanguineo: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={inpStyle}>
                    {tiposSanguineos.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {[
                { label: "Alergias",          key: "alergias"          },
                { label: "Contraindicações",   key: "contraindicacoes"  },
                { label: "Medicamentos em uso", key: "medicamentos"     },
                { label: "Histórico Médico",   key: "historico_medico"  },
                { label: "Observações",        key: "observacoes"       },
              ].map(item => (
                <div key={item.key}>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{item.label}</label>
                  <textarea value={(formSaude as any)[item.key] ?? ""} onChange={e => setFormSaude(f => ({ ...f, [item.key]: e.target.value }))}
                    rows={3} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inpStyle} />
                </div>
              ))}
              <div className="flex gap-3">
                <button onClick={() => setEditandoSaude(false)}
                  className="flex-1 py-3 rounded-2xl text-sm transition hover:opacity-70"
                  style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                  Cancelar
                </button>
                <button onClick={salvarSaude} disabled={salvandoSaude}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold transition hover:scale-105"
                  style={{ background: "var(--gold)", color: "#0a0707" }}>
                  {salvandoSaude ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Tipo Sanguíneo",    valor: p.tipo_sanguineo ?? "Não informado" },
                { label: "Alergias",          valor: p.alergias ?? "Nenhuma registrada"  },
                { label: "Contraindicações",  valor: p.contraindicacoes ?? "Nenhuma"     },
                { label: "Medicamentos",      valor: p.medicamentos ?? "Nenhum"          },
                { label: "Histórico Médico",  valor: p.historico_medico ?? "Não informado" },
                { label: "Observações",       valor: p.observacoes ?? "—"               },
              ].map(item => (
                <div key={item.label} className="p-4 rounded-2xl" style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>{item.valor}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA HISTÓRICO */}
      {abaAtiva === "historico" && (
        <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          {agendamentos.length === 0 ? (
            <div className="text-center py-16"><p className="text-4xl mb-3">📅</p><p style={{ color: "var(--text-muted)" }}>Nenhum atendimento registrado</p></div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {agendamentos.map(ag => (
                <div key={ag.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ag.procedimentos?.cor ?? "var(--gold)" }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{ag.procedimentos?.nome ?? "Procedimento"}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{ag.funcionarios?.nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>{new Date(ag.inicio).toLocaleDateString("pt-BR")}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: ag.status === "finalizado" ? "rgba(122,232,160,0.1)" : ag.status === "cancelado" ? "rgba(232,122,122,0.1)" : "rgba(232,201,122,0.1)",
                      color: ag.status === "finalizado" ? "var(--success)" : ag.status === "cancelado" ? "var(--danger)" : "var(--warning)"
                    }}>{ag.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA ANOTAÇÕES */}
      {abaAtiva === "anotacoes" && (
        <div className="flex flex-col gap-4">
          <button onClick={() => setNovaAnotacao(!novaAnotacao)}
            className="self-end px-5 py-2.5 rounded-2xl text-sm font-semibold transition hover:scale-105"
            style={{ background: "var(--gold)", color: "#0a0707" }}>
            + Nova Anotação
          </button>

          {novaAnotacao && (
            <div className="rounded-3xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <div className="flex gap-2 mb-3 flex-wrap">
                {tiposAnotacao.map(t => (
                  <button key={t.key} onClick={() => setFormAnotacao(f => ({ ...f, tipo: t.key }))}
                    className="px-3 py-1.5 rounded-xl text-xs transition"
                    style={{ background: formAnotacao.tipo === t.key ? "var(--gold-bg)" : "var(--bg-input)", color: t.cor, border: `1px solid ${formAnotacao.tipo === t.key ? "var(--border-color)" : "var(--border-subtle)"}` }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="Título (opcional)" value={formAnotacao.titulo}
                onChange={e => setFormAnotacao(f => ({ ...f, titulo: e.target.value }))}
                className={`${inp} mb-3`} style={inpStyle} />
              <textarea placeholder="Anotação..." value={formAnotacao.conteudo}
                onChange={e => setFormAnotacao(f => ({ ...f, conteudo: e.target.value }))}
                rows={4} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none mb-3" style={inpStyle} />
              <div className="flex gap-3">
                <button onClick={() => setNovaAnotacao(false)}
                  className="flex-1 py-2.5 rounded-2xl text-sm transition hover:opacity-70"
                  style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
                <button onClick={salvarAnotacao} disabled={salvandoAnotacao || !formAnotacao.conteudo.trim()}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition hover:scale-105"
                  style={{ background: "var(--gold)", color: "#0a0707" }}>
                  {salvandoAnotacao ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          )}

          {anotacoes.length === 0 ? (
            <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-4xl mb-3">📝</p><p style={{ color: "var(--text-muted)" }}>Nenhuma anotação ainda</p>
            </div>
          ) : (
            anotacoes.map(an => {
              const tipo = tiposAnotacao.find(t => t.key === an.tipo) ?? tiposAnotacao[0];
              return (
                <div key={an.id} className="rounded-3xl p-5" style={{ background: "var(--bg-card)", border: `1px solid var(--border-color)`, borderLeft: `3px solid ${tipo.cor}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-input)", color: tipo.cor }}>{tipo.label}</span>
                      {an.titulo && <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{an.titulo}</p>}
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {an.funcionarios?.nome} · {new Date(an.criado_em).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{an.conteudo}</p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ABA FINANCEIRO */}
      {abaAtiva === "financeiro" && (
        <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <h2 className="text-xs uppercase tracking-widest" style={{ color: "var(--gold)" }}>Histórico Financeiro</h2>
            <p className="text-sm font-bold" style={{ color: "var(--success)" }}>
              Total: R$ {totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          {faturamentos.length === 0 ? (
            <div className="text-center py-16"><p className="text-4xl mb-3">💰</p><p style={{ color: "var(--text-muted)" }}>Nenhum registro financeiro</p></div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {faturamentos.map(f => (
                <div key={f.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--gold)" }}>R$ {Number(f.valor_final).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{f.forma_pagamento}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: f.status_pagamento === "pago" ? "rgba(122,232,160,0.1)" : "rgba(232,201,122,0.1)",
                      color: f.status_pagamento === "pago" ? "var(--success)" : "var(--warning)"
                    }}>{f.status_pagamento}</span>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{new Date(f.criado_em).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA AVALIAÇÕES */}
      {abaAtiva === "avaliacoes" && (
        avaliacoes.length === 0 ? (
          <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <p className="text-4xl mb-3">⭐</p><p style={{ color: "var(--text-muted)" }}>Nenhuma avaliação ainda</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {avaliacoes.map(av => (
              <div key={av.id} className="rounded-3xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  {[
                    { label: "Atendimento",  nota: av.nota_atendimento  },
                    { label: "Profissional", nota: av.nota_profissional  },
                    { label: "Experiência",  nota: av.nota_experiencia   },
                  ].map(item => (
                    <div key={item.label} className="text-center p-3 rounded-xl" style={{ background: "var(--bg-input)" }}>
                      <p className="text-xl font-bold" style={{ color: "var(--gold)" }}>{item.nota}/10</p>
                      <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                    </div>
                  ))}
                </div>
                {av.comentario && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>"{av.comentario}"</p>}
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>{new Date(av.criado_em).toLocaleDateString("pt-BR")}</p>
              </div>
            ))}
          </div>
        )
      )}
      <style>{`textarea::placeholder, input::placeholder { color: var(--text-muted); } select option { background: var(--bg-card); }`}</style>
    </div>
  );
}
