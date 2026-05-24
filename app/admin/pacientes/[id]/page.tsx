"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Paciente = {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
  data_nascimento?: string;
  alergias?: string;
  contraindicacoes?: string;
  observacoes?: string;
  assinou_termo: boolean;
  criado_em: string;
  agendamentos: any[];
  pacotes: any[];
  anotacoes: any[];
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pendente:   { label: "Pendente",   color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  confirmado: { label: "Confirmado", color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  cancelado:  { label: "Cancelado",  color: "#e87a7a", bg: "rgba(232,122,122,0.1)" },
  finalizado: { label: "Finalizado", color: "#a89080", bg: "rgba(168,144,128,0.1)" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.pendente;
  return (
    <span className="text-xs px-2 py-1 rounded-full font-medium"
      style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

export default function ProntuarioPage() {
  const params = useParams();
  const router = useRouter();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<"dados" | "historico" | "pacotes" | "anotacoes">("dados");
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [novaAnotacao, setNovaAnotacao] = useState("");
  const [salvandoAnotacao, setSalvandoAnotacao] = useState(false);
  const [form, setForm] = useState<Partial<Paciente>>({});

  async function buscar() {
    setCarregando(true);
    const res = await fetch(`/api/pacientes/${params.id}`);
    const data = await res.json();
    setPaciente(data);
    setForm(data);
    setCarregando(false);
  }

  useEffect(() => { buscar(); }, [params.id]);

  async function salvarEdicao() {
    setSalvando(true);
    await fetch(`/api/pacientes/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    await buscar();
    setEditando(false);
    setSalvando(false);
  }

  async function salvarAnotacao() {
    if (!novaAnotacao.trim()) return;
    setSalvandoAnotacao(true);
    await fetch(`/api/anotacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paciente_id: params.id, conteudo: novaAnotacao }),
    });
    setNovaAnotacao("");
    await buscar();
    setSalvandoAnotacao(false);
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "#c8a078" }} />
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">404</p>
        <p style={{ color: "#6b5a4e" }}>Paciente nao encontrado</p>
        <button onClick={() => router.push("/admin/pacientes")} className="mt-4 px-6 py-3 rounded-2xl text-sm"
          style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#c8a078" }}>
          Voltar
        </button>
      </div>
    );
  }

  const abas = [
    { key: "dados", label: "Dados" },
    { key: "historico", label: `Historico (${paciente.agendamentos.length})` },
    { key: "pacotes", label: `Pacotes (${paciente.pacotes.length})` },
    { key: "anotacoes", label: `Anotacoes (${paciente.anotacoes.length})` },
  ] as const;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push("/admin/pacientes")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:opacity-70"
          style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#c8a078" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: "#c8a078" }}>Prontuario</p>
          <h1 className="text-2xl font-bold" style={{ color: "#e8d5c0" }}>{paciente.nome}</h1>
        </div>
      </div>

      <div className="rounded-3xl p-5 mb-6 flex items-center gap-5 flex-wrap"
        style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
          style={{ background: "rgba(200,160,120,0.12)", color: "#c8a078" }}>
          {paciente.nome.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold" style={{ color: "#e8d5c0" }}>{paciente.nome}</h2>
          <p className="text-sm" style={{ color: "#6b5a4e" }}>{paciente.telefone}{paciente.email ? ` · ${paciente.email}` : ""}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs px-3 py-1.5 rounded-full"
            style={{ background: paciente.assinou_termo ? "rgba(122,232,160,0.1)" : "rgba(232,122,122,0.1)", color: paciente.assinou_termo ? "#7ae8a0" : "#e87a7a" }}>
            {paciente.assinou_termo ? "Termo assinado" : "Sem termo"}
          </span>
          <span className="text-xs px-3 py-1.5 rounded-full"
            style={{ background: "rgba(200,160,120,0.1)", color: "#c8a078" }}>
            {paciente.agendamentos.length} consultas
          </span>
          <button onClick={() => setEditando(true)}
            className="px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition hover:opacity-70"
            style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#c8a078" }}>
            Editar
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-2xl" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
        {abas.map((a) => (
          <button key={a.key} onClick={() => setAba(a.key)}
            className="flex-1 py-2.5 rounded-xl text-xs uppercase tracking-widest font-medium transition"
            style={{ background: aba === a.key ? "rgba(200,160,120,0.15)" : "transparent", color: aba === a.key ? "#c8a078" : "#6b5a4e", border: aba === a.key ? "1px solid rgba(200,160,120,0.2)" : "1px solid transparent" }}>
            {a.label}
          </button>
        ))}
      </div>

      {aba === "dados" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Nome completo", key: "nome" },
            { label: "Telefone", key: "telefone" },
            { label: "Email", key: "email" },
            { label: "CPF", key: "cpf" },
            { label: "Data de nascimento", key: "data_nascimento", type: "date" },
          ].map((campo) => (
            <div key={campo.key} className="rounded-2xl p-5" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#6b5a4e" }}>{campo.label}</p>
              {editando ? (
                <input type={campo.type ?? "text"}
                  value={(form as any)[campo.key] ?? ""}
                  onChange={(e) => setForm(f => ({ ...f, [campo.key]: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.2)", color: "#e8d5c0" }} />
              ) : (
                <p className="text-sm" style={{ color: "#e8d5c0" }}>
                  {campo.key === "data_nascimento" && paciente.data_nascimento
                    ? new Date(paciente.data_nascimento).toLocaleDateString("pt-BR")
                    : (paciente as any)[campo.key] ?? "-"}
                </p>
              )}
            </div>
          ))}
          {[
            { label: "Alergias", key: "alergias" },
            { label: "Contraindicacoes", key: "contraindicacoes" },
            { label: "Observacoes gerais", key: "observacoes" },
          ].map((campo) => (
            <div key={campo.key} className="md:col-span-2 rounded-2xl p-5" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#6b5a4e" }}>{campo.label}</p>
              {editando ? (
                <textarea rows={3} value={(form as any)[campo.key] ?? ""}
                  onChange={(e) => setForm(f => ({ ...f, [campo.key]: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none"
                  style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.2)", color: "#e8d5c0" }} />
              ) : (
                <p className="text-sm leading-6" style={{ color: (paciente as any)[campo.key] ? "#e8d5c0" : "#3a2e28" }}>
                  {(paciente as any)[campo.key] ?? "Nenhum registro"}
                </p>
              )}
            </div>
          ))}
          {editando && (
            <div className="md:col-span-2 flex gap-3">
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
          )}
        </div>
      )}

      {aba === "historico" && (
        <div className="flex flex-col gap-3">
          {paciente.agendamentos.length === 0 ? (
            <div className="text-center py-16 rounded-3xl" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
              <p className="text-3xl mb-3">📅</p>
              <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhuma consulta registrada</p>
            </div>
          ) : paciente.agendamentos.map((ag: any) => (
            <div key={ag.id} className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
              <div className="w-1 h-14 rounded-full flex-shrink-0"
                style={{ background: ag.procedimentos?.cor ?? "#c8a078" }} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "#e8d5c0" }}>{ag.procedimentos?.nome}</p>
                <p className="text-xs mt-1" style={{ color: "#6b5a4e" }}>
                  {new Date(ag.inicio).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} as {new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                {ag.observacoes && <p className="text-xs mt-1" style={{ color: "#a89080" }}>{ag.observacoes}</p>}
              </div>
              <StatusBadge status={ag.status} />
            </div>
          ))}
        </div>
      )}

      {aba === "pacotes" && (
        <div className="flex flex-col gap-3">
          {paciente.pacotes.length === 0 ? (
            <div className="text-center py-16 rounded-3xl" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
              <p className="text-3xl mb-3">📦</p>
              <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhum pacote ativo</p>
            </div>
          ) : paciente.pacotes.map((pk: any) => {
            const pct = Math.round((pk.sessoes_usadas / pk.total_sessoes) * 100);
            const restantes = pk.total_sessoes - pk.sessoes_usadas;
            return (
              <div key={pk.id} className="rounded-2xl p-5"
                style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold" style={{ color: "#e8d5c0" }}>{pk.procedimentos?.nome}</p>
                  <span className="text-xs px-2 py-1 rounded-full"
                    style={{ background: pk.ativo ? "rgba(122,232,160,0.1)" : "rgba(232,122,122,0.1)", color: pk.ativo ? "#7ae8a0" : "#e87a7a" }}>
                    {pk.ativo ? "Ativo" : "Encerrado"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold" style={{ color: "#c8a078" }}>{restantes}</p>
                    <p className="text-xs" style={{ color: "#6b5a4e" }}>restantes</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "#6b5a4e" }}>{pk.sessoes_usadas} usadas</span>
                      <span style={{ color: "#6b5a4e" }}>{pk.total_sessoes} total</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "rgba(200,160,120,0.1)" }}>
                      <div className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: "#c8a078" }} />
                    </div>
                  </div>
                </div>
                <p className="text-xs" style={{ color: "#3a2e28" }}>
                  Comprado em {new Date(pk.comprado_em).toLocaleDateString("pt-BR")}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {aba === "anotacoes" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-5" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}>
            <label className="text-xs uppercase tracking-widest block mb-3" style={{ color: "#a89080" }}>Nova anotacao interna</label>
            <textarea rows={3} value={novaAnotacao} onChange={(e) => setNovaAnotacao(e.target.value)}
              placeholder="Anotacao visivel apenas para a equipe..."
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none mb-3"
              style={{ background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#e8d5c0" }} />
            <button onClick={salvarAnotacao} disabled={salvandoAnotacao || !novaAnotacao.trim()}
              className="px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest font-semibold transition hover:scale-105"
              style={{ background: novaAnotacao.trim() ? "#c8a078" : "rgba(200,160,120,0.3)", color: "#0a0707" }}>
              {salvandoAnotacao ? "Salvando..." : "Salvar anotacao"}
            </button>
          </div>
          {paciente.anotacoes.length === 0 ? (
            <div className="text-center py-12 rounded-3xl" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
              <p className="text-3xl mb-3">📝</p>
              <p className="text-sm" style={{ color: "#6b5a4e" }}>Nenhuma anotacao ainda</p>
            </div>
          ) : paciente.anotacoes.map((an: any) => (
            <div key={an.id} className="rounded-2xl p-5"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold" style={{ color: "#c8a078" }}>{an.funcionarios?.nome ?? "Equipe"}</p>
                <p className="text-xs" style={{ color: "#3a2e28" }}>{new Date(an.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })} as {new Date(an.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <p className="text-sm leading-6" style={{ color: "#a89080" }}>{an.conteudo}</p>
            </div>
          ))}
        </div>
      )}
      <style>{`textarea::placeholder { color: #3a2e28; }`}</style>
    </div>
  );
}