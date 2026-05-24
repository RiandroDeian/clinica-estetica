"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Sessao = {
  id: string;
  numero_sessao: number;
  realizada_em: string;
  observacoes?: string;
  intercorrencias?: string;
  funcionarios?: { nome: string };
};

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
  pacientes?: { nome: string; telefone: string; cpf?: string; data_nascimento?: string; alergias?: string };
  funcionarios?: { nome: string; cor: string };
  sessoes: Sessao[];
};

const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
  em_tratamento: { label: "Em tratamento", color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  finalizado:    { label: "Finalizado",    color: "#a89080", bg: "rgba(168,144,128,0.1)" },
  pausado:       { label: "Pausado",       color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  cancelado:     { label: "Cancelado",     color: "#e87a7a", bg: "rgba(232,122,122,0.1)" },
};

export default function LaserProntuarioPage() {
  const params = useParams();
  const router = useRouter();
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modalSessao, setModalSessao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [formSessao, setFormSessao] = useState({ observacoes: "", intercorrencias: "" });
  const [editando, setEditando] = useState(false);
  const [formEdit, setFormEdit] = useState<any>({});

  async function buscar() {
    setCarregando(true);
    const res = await fetch(`/api/laser/${params.id}`);
    const data = await res.json();
    setPacote(data);
    setFormEdit(data);
    setCarregando(false);
  }

  useEffect(() => { buscar(); }, [params.id]);

  async function registrarSessao() {
    setSalvando(true);
    await fetch(`/api/laser/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acao: "registrar_sessao",
        paciente_id: pacote?.pacientes ? (pacote as any).paciente_id : "",
        ...formSessao
      }),
    });
    setModalSessao(false);
    setFormSessao({ observacoes: "", intercorrencias: "" });
    buscar();
    setSalvando(false);
  }

  async function salvarEdicao() {
    setSalvando(true);
    await fetch(`/api/laser/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formEdit),
    });
    setEditando(false);
    buscar();
    setSalvando(false);
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "#c8a078" }} />
      </div>
    );
  }

  if (!pacote) {
    return (
      <div className="text-center py-20">
        <p style={{ color: "#6b5a4e" }}>Pacote nao encontrado</p>
        <button onClick={() => router.push("/admin/laser")} className="mt-4 px-6 py-3 rounded-2xl text-sm"
          style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#c8a078" }}>Voltar</button>
      </div>
    );
  }

  const pct = Math.round((pacote.sessoes_feitas / pacote.total_sessoes) * 100);
  const restantes = pacote.total_sessoes - pacote.sessoes_feitas;
  const sc = statusCfg[pacote.status] ?? statusCfg.em_tratamento;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push("/admin/laser")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:opacity-70"
          style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#c8a078" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: "#c8a078" }}>Prontuario Laser</p>
          <h1 className="text-2xl font-bold" style={{ color: "#e8d5c0" }}>{pacote.pacientes?.nome}</h1>
        </div>
      </div>

      <div className="rounded-3xl p-6 mb-6" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: "#e8d5c0" }}>{pacote.procedimento}</p>
            <p className="text-xs" style={{ color: "#6b5a4e" }}>
              {pacote.pacientes?.telefone}
              {pacote.pacientes?.cpf && ` - CPF: ${pacote.pacientes.cpf}`}
            </p>
            {pacote.pacientes?.alergias && (
              <p className="text-xs mt-1" style={{ color: "#e8c97a" }}>Alergias: {pacote.pacientes.alergias}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ color: sc.color, background: sc.bg }}>{sc.label}</span>
            <span className="text-xs px-3 py-1.5 rounded-full"
              style={{ background: pacote.assinou_termo ? "rgba(122,232,160,0.1)" : "rgba(232,122,122,0.1)", color: pacote.assinou_termo ? "#7ae8a0" : "#e87a7a" }}>
              {pacote.assinou_termo ? "Termo assinado" : "Sem termo"}
            </span>
            <button onClick={() => setEditando(true)}
              className="px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition hover:opacity-70"
              style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#c8a078" }}>
              Editar
            </button>
            {pacote.status === "em_tratamento" && (
              <button onClick={() => setModalSessao(true)}
                className="px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: "#c8a078", color: "#0a0707" }}>
                Registrar Sessao
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center rounded-2xl p-4" style={{ background: "#0e0a0a" }}>
            <p className="text-3xl font-bold mb-1" style={{ color: "#c8a078" }}>{pacote.sessoes_feitas}</p>
            <p className="text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>Feitas</p>
          </div>
          <div className="text-center rounded-2xl p-4" style={{ background: "#0e0a0a" }}>
            <p className="text-3xl font-bold mb-1" style={{ color: restantes === 0 ? "#7ae8a0" : "#e8d5c0" }}>{restantes}</p>
            <p className="text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>Restantes</p>
          </div>
          <div className="text-center rounded-2xl p-4" style={{ background: "#0e0a0a" }}>
            <p className="text-3xl font-bold mb-1" style={{ color: "#c8a078" }}>{pacote.total_sessoes}</p>
            <p className="text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>Total</p>
          </div>
        </div>

        <div className="mb-2 flex justify-between text-xs" style={{ color: "#6b5a4e" }}>
          <span>Progresso</span><span>{pct}%</span>
        </div>
        <div className="h-3 rounded-full mb-4" style={{ background: "rgba(200,160,120,0.1)" }}>
          <div className="h-3 rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: pct === 100 ? "#7ae8a0" : "#c8a078" }} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Profissional", val: pacote.funcionarios?.nome ?? "-" },
            { label: "Valor", val: pacote.valor ? `R$ ${Number(pacote.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-" },
            { label: "Pagamento", val: pacote.status_pagamento },
            { label: "Inicio", val: pacote.data_inicio ? new Date(pacote.data_inicio).toLocaleDateString("pt-BR") : "-" },
          ].map((item, i) => (
            <div key={i} className="rounded-xl p-3" style={{ background: "#0e0a0a" }}>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#3a2e28" }}>{item.label}</p>
              <p className="text-sm font-semibold" style={{ color: "#e8d5c0" }}>{item.val}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: "#c8a078" }}>
          Historico de Sessoes
        </h2>
        {pacote.sessoes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhuma sessao registrada ainda</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pacote.sessoes.map(s => (
              <div key={s.id} className="rounded-2xl p-4 flex items-start gap-4"
                style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.08)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "rgba(200,160,120,0.12)", color: "#c8a078" }}>
                  {s.numero_sessao}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: "#e8d5c0" }}>
                      Sessao {s.numero_sessao}
                    </p>
                    <p className="text-xs" style={{ color: "#6b5a4e" }}>
                      {new Date(s.realizada_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} - {new Date(s.realizada_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {s.funcionarios?.nome && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(200,160,120,0.1)", color: "#c8a078" }}>
                        {s.funcionarios.nome}
                      </span>
                    )}
                  </div>
                  {s.observacoes && <p className="text-xs mb-1" style={{ color: "#a89080" }}>{s.observacoes}</p>}
                  {s.intercorrencias && (
                    <p className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(232,201,122,0.08)", color: "#e8c97a" }}>
                      Intercorrencia: {s.intercorrencias}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalSessao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-3xl p-8" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#c8a078" }}>Registrar Sessao</h2>
                <p className="text-xs mt-1" style={{ color: "#6b5a4e" }}>Sessao {pacote.sessoes_feitas + 1} de {pacote.total_sessoes}</p>
              </div>
              <button onClick={() => setModalSessao(false)} style={{ color: "#6b5a4e" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Observacoes</label>
                <textarea value={formSessao.observacoes} onChange={e => setFormSessao(f => ({ ...f, observacoes: e.target.value }))}
                  rows={3} placeholder="Evolucao, tecnica utilizada..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Intercorrencias</label>
                <textarea value={formSessao.intercorrencias} onChange={e => setFormSessao(f => ({ ...f, intercorrencias: e.target.value }))}
                  rows={2} placeholder="Reacoes, intercorrencias (opcional)..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalSessao(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#6b5a4e" }}>
                Cancelar
              </button>
              <button onClick={registrarSessao} disabled={salvando}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: "#c8a078", color: "#0a0707" }}>
                {salvando ? "Salvando..." : "Confirmar Sessao"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl p-8 max-h-[90vh] overflow-y-auto" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: "#c8a078" }}>Editar Pacote</h2>
              <button onClick={() => setEditando(false)} style={{ color: "#6b5a4e" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { label: "Status", key: "status", type: "select", opts: ["em_tratamento","finalizado","pausado","cancelado"] },
                { label: "Status Pagamento", key: "status_pagamento", type: "select", opts: ["pendente","pago","parcial"] },
                { label: "Valor (R$)", key: "valor", type: "number" },
                { label: "Observacoes", key: "observacoes", type: "textarea" },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>{field.label}</label>
                  {field.type === "select" ? (
                    <select value={formEdit[field.key] ?? ""} onChange={e => setFormEdit((f: any) => ({ ...f, [field.key]: e.target.value }))}
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }}>
                      {field.opts?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea value={formEdit[field.key] ?? ""} onChange={e => setFormEdit((f: any) => ({ ...f, [field.key]: e.target.value }))}
                      rows={3} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                      style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
                  ) : (
                    <input type={field.type} value={formEdit[field.key] ?? ""} onChange={e => setFormEdit((f: any) => ({ ...f, [field.key]: e.target.value }))}
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditando(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#6b5a4e" }}>
                Cancelar
              </button>
              <button onClick={salvarEdicao} disabled={salvando}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: "#c8a078", color: "#0a0707" }}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`select option { background: #120d0d; } textarea::placeholder { color: #3a2e28; }`}</style>
    </div>
  );
}