"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

type Pacote = {
  id: string;
  procedimento: string | string[];
  total_sessoes: number;
  sessoes_feitas: number;
  status: string;
  status_pagamento: string;
  categoria: string;
  forma_pagamento?: string;
  valor?: number;
  data_inicio?: string;
  data_acerto?: string;
  assinou_contrato?: boolean;
  assinou_termo?: boolean;
  observacoes?: string;
  criado_em: string;
  pacientes?: { nome: string; telefone: string; cpf?: string };
  funcionarios?: { nome: string; cor: string };
};

type Sessao = {
  id: string;
  numero_sessao: number;
  realizada_em?: string;
  observacoes?: string;
  intercorrencias?: string;
  funcionarios?: { nome: string; cor: string };
};

type Foto = {
  id: string;
  tipo: "antes" | "depois";
  url: string;
  descricao?: string;
  criado_em: string;
};

const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
  em_tratamento: { label: "Em tratamento", color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  finalizado:    { label: "Finalizado",    color: "var(--text-secondary)", bg: "rgba(168,144,128,0.1)" },
  pausado:       { label: "Pausado",       color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  cancelado:     { label: "Cancelado",     color: "#e87a7a", bg: "rgba(232,122,122,0.1)" },
};

const pagCfg: Record<string, { label: string; color: string; bg: string }> = {
  pago:     { label: "Pago",     color: "#7ae8a0", bg: "rgba(122,232,160,0.1)" },
  pendente: { label: "Pendente", color: "#e8c97a", bg: "rgba(232,201,122,0.1)" },
  parcial:  { label: "Parcial",  color: "var(--gold)", bg: "var(--gold-bg)" },
};

const formaCfg: Record<string, { label: string; color: string }> = {
  boleto:        { label: "Boleto",        color: "#e87a7a" },
  pix:           { label: "PIX",           color: "#7ae8a0" },
  credito:       { label: "Cartão Créd.",  color: "#a89bcc" },
  debito:        { label: "Cartão Déb.",   color: "#7ab8e8" },
  dinheiro:      { label: "Dinheiro",      color: "#e8c97a" },
  transferencia: { label: "Transferência", color: "var(--gold)" },
};

const formSessaoInicial = {
  data_sessao: new Date().toISOString().slice(0, 16),
  observacoes: "",
  intercorrencias: "",
};

export default function LaserDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalSessao, setModalSessao] = useState(false);
  const [formSessao, setFormSessao] = useState(formSessaoInicial);

  // ✅ Estado para fotos
  const [tipoFotoUpload, setTipoFotoUpload] = useState<"antes" | "depois">("antes");
  const [uploadandoFoto, setUploadandoFoto] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState<Foto | null>(null);
  const fileInputAntes = useRef<HTMLInputElement>(null);
  const fileInputDepois = useRef<HTMLInputElement>(null);

  async function buscar() {
    setCarregando(true);
    const [resPacote, resSessoes, resFotos] = await Promise.all([
      fetch(`/api/laser/${id}`),
      fetch(`/api/laser/sessoes?pacote_id=${id}`),
      fetch(`/api/laser/fotos?pacote_id=${id}`),
    ]);
    if (resPacote.ok) setPacote(await resPacote.json());
    if (resSessoes.ok) setSessoes(await resSessoes.json());
    if (resFotos.ok) setFotos(await resFotos.json());
    setCarregando(false);
  }

  useEffect(() => { buscar(); }, [id]);

  async function atualizar(campos: Partial<Pacote>) {
    setSalvando(true);
    const res = await fetch(`/api/laser/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campos),
    });
    if (res.ok) {
      setPacote(await res.json());
      toast.success("Salvo!");
    } else toast.error("Erro ao salvar");
    setSalvando(false);
  }

  async function registrarSessao() {
    if (!pacote) return;
    setSalvando(true);
    const res = await fetch("/api/laser/sessoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pacote_id: id,
        data_sessao: new Date(formSessao.data_sessao).toISOString(),
        observacoes: formSessao.observacoes || null,
        intercorrencias: formSessao.intercorrencias || null,
      }),
    });
    if (res.ok) {
      toast.success("Atendimento registrado!");
      setModalSessao(false);
      setFormSessao(formSessaoInicial);
      buscar();
    } else {
      const err = await res.json();
      toast.error(err.erro ?? "Erro ao registrar atendimento");
    }
    setSalvando(false);
  }

  async function excluirSessao(sessaoId: string) {
    if (!confirm("Excluir este atendimento?")) return;
    await fetch(`/api/laser/sessoes?id=${sessaoId}&pacote_id=${id}`, { method: "DELETE" });
    buscar();
    toast.success("Atendimento removido!");
  }

  // ✅ Upload de foto
  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>, tipo: "antes" | "depois") {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadandoFoto(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("arquivo", file);
      fd.append("pacote_id", id);
      fd.append("tipo", tipo);
      const res = await fetch("/api/laser/fotos", { method: "POST", body: fd });
      if (!res.ok) {
        toast.error(`Erro ao enviar ${file.name}`);
      }
    }
    setUploadandoFoto(false);
    toast.success("Fotos enviadas!");
    buscar();
    e.target.value = "";
  }

  async function excluirFoto(fotoId: string) {
    if (!confirm("Excluir esta foto?")) return;
    await fetch(`/api/laser/fotos?id=${fotoId}`, { method: "DELETE" });
    setFotoAmpliada(null);
    buscar();
    toast.success("Foto removida!");
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "var(--gold)" }} />
      </div>
    );
  }

  if (!pacote) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">⚠️</p>
        <p style={{ color: "var(--text-muted)" }}>Pacote não encontrado</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 rounded-xl text-sm"
          style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>Voltar</button>
      </div>
    );
  }

  const areas = Array.isArray(pacote.procedimento)
    ? pacote.procedimento
    : (pacote.procedimento ?? "").split(", ").filter(Boolean);

  const pct = pacote.total_sessoes > 0
    ? Math.round((pacote.sessoes_feitas / pacote.total_sessoes) * 100)
    : 0;

  const pc = pagCfg[pacote.status_pagamento] ?? pagCfg.pendente;
  const fc = formaCfg[pacote.forma_pagamento ?? ""] ?? null;
  const eBoleto = pacote.forma_pagamento === "boleto";

  const fotosAntes = fotos.filter(f => f.tipo === "antes");
  const fotosDepois = fotos.filter(f => f.tipo === "depois");

  return (
    <div className="max-w-2xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()}
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition hover:opacity-70"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="var(--text-muted)" strokeWidth={1.5}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Laser</p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {pacote.pacientes?.nome ?? "Paciente"}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{pacote.pacientes?.telefone}</p>
        </div>
      </div>

      {/* Alerta boleto */}
      {eBoleto && (
        <div className="rounded-2xl px-5 py-4 mb-5"
          style={{ background: "rgba(232,122,122,0.06)", border: "1px solid rgba(232,122,122,0.3)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "#e87a7a" }}>🔴 Pacote Boleto</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Data de acerto: <strong style={{ color: "#e87a7a" }}>
              {pacote.data_acerto
                ? new Date(pacote.data_acerto + "T12:00:00").toLocaleDateString("pt-BR")
                : "Não definida"}
            </strong>
          </p>
        </div>
      )}

      {/* Progresso sessões */}
      <div className="rounded-3xl p-6 mb-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Sessões realizadas</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold" style={{ color: "var(--gold)" }}>{pacote.sessoes_feitas}</span>
              <span className="text-lg mb-0.5" style={{ color: "var(--text-muted)" }}>/ {pacote.total_sessoes}</span>
            </div>
          </div>
          <button onClick={() => { setFormSessao(formSessaoInicial); setModalSessao(true); }}
            disabled={pacote.sessoes_feitas >= pacote.total_sessoes}
            className="px-5 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105 disabled:opacity-40"
            style={{ background: "var(--gold)", color: "var(--bg-card)" }}>
            + Registrar Atendimento
          </button>
        </div>
        <div className="h-3 rounded-full mb-1" style={{ background: "var(--border-subtle)" }}>
          <div className="h-3 rounded-full transition-all"
            style={{ width: `${pct}%`, background: pct >= 100 ? "#e87a7a" : "var(--gold)" }} />
        </div>
        <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
          <span>{pct}% concluído</span>
          <span>{pacote.total_sessoes - pacote.sessoes_feitas} sessões restantes</span>
        </div>
      </div>

      {/* Informações do pacote */}
      <div className="rounded-3xl p-6 mb-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>

        {/* Áreas */}
        <div className="mb-5">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Áreas tratadas</p>
          <div className="flex flex-wrap gap-1.5">
            {areas.map(a => (
              <span key={a} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: "var(--border-subtle)", color: "var(--text-secondary)" }}>{a}</span>
            ))}
          </div>
        </div>

        {/* Status tratamento */}
        <div className="mb-5">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Status do tratamento</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(statusCfg).map(([key, cfg]) => (
              <button key={key} onClick={() => atualizar({ status: key })}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition"
                style={{
                  background: pacote.status === key ? cfg.bg : "transparent",
                  color: cfg.color,
                  border: `1px solid ${pacote.status === key ? cfg.color : `${cfg.color}40`}`,
                }}>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status pagamento */}
        <div className="mb-5">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Status do pagamento</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(pagCfg).map(([key, cfg]) => (
              <button key={key} onClick={() => atualizar({ status_pagamento: key })}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition"
                style={{
                  background: pacote.status_pagamento === key ? cfg.bg : "transparent",
                  color: cfg.color,
                  border: `1px solid ${pacote.status_pagamento === key ? cfg.color : `${cfg.color}40`}`,
                }}>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detalhes */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: "Categoria",       valor: pacote.categoria },
            { label: "Forma pagamento", valor: fc?.label ?? pacote.forma_pagamento ?? "—", color: fc?.color },
            { label: "Valor",           valor: pacote.valor ? `R$ ${Number(pacote.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—" },
            { label: "Profissional",    valor: pacote.funcionarios?.nome ?? "—" },
            { label: "Início",          valor: pacote.data_inicio ? new Date(pacote.data_inicio + "T12:00:00").toLocaleDateString("pt-BR") : "—" },
            { label: "Cadastrado em",   valor: new Date(pacote.criado_em).toLocaleDateString("pt-BR") },
          ].map(item => (
            <div key={item.label} className="rounded-2xl px-4 py-3"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{item.label}</p>
              <p className="text-sm font-medium" style={{ color: (item as any).color ?? "var(--text-primary)" }}>{item.valor}</p>
            </div>
          ))}
        </div>

        {/* Termos e contrato */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Termo</span>
            <button onClick={() => atualizar({ assinou_termo: !pacote.assinou_termo })}
              className="relative w-11 h-6 rounded-full transition-colors"
              style={{ background: pacote.assinou_termo ? "var(--gold)" : "var(--border-color)" }}>
              <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: pacote.assinou_termo ? "calc(100% - 20px)" : "4px" }} />
            </button>
          </div>
          <div className="flex-1 rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Contrato</span>
            <button onClick={() => atualizar({ assinou_contrato: !pacote.assinou_contrato })}
              className="relative w-11 h-6 rounded-full transition-colors"
              style={{ background: pacote.assinou_contrato ? "#7ae8a0" : "var(--border-color)" }}>
              <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: pacote.assinou_contrato ? "calc(100% - 20px)" : "4px" }} />
            </button>
          </div>
        </div>
      </div>

      {/* ✅ FOTOS ANTES E DEPOIS */}
      <div className="rounded-3xl p-6 mb-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--gold)" }}>
          Fotos do Tratamento
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Coluna ANTES */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(232,122,122,0.1)", color: "#e87a7a" }}>
                Antes ({fotosAntes.length})
              </span>
              <button onClick={() => fileInputAntes.current?.click()}
                disabled={uploadandoFoto}
                className="text-xs px-2 py-1 rounded-lg transition hover:opacity-70"
                style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
                + Adicionar
              </button>
              <input ref={fileInputAntes} type="file" accept="image/*" multiple hidden
                onChange={e => handleUploadFoto(e, "antes")} />
            </div>
            {fotosAntes.length === 0 ? (
              <div className="rounded-2xl h-24 flex items-center justify-center"
                style={{ background: "var(--bg-input)", border: "1px dashed var(--border-color)" }}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Sem fotos</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {fotosAntes.map(f => (
                  <img key={f.id} src={f.url} alt="Antes"
                    onClick={() => setFotoAmpliada(f)}
                    className="w-full h-20 object-cover rounded-xl cursor-pointer transition hover:opacity-80"
                    style={{ border: "1px solid var(--border-subtle)" }} />
                ))}
              </div>
            )}
          </div>

          {/* Coluna DEPOIS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(122,232,160,0.1)", color: "#7ae8a0" }}>
                Depois ({fotosDepois.length})
              </span>
              <button onClick={() => fileInputDepois.current?.click()}
                disabled={uploadandoFoto}
                className="text-xs px-2 py-1 rounded-lg transition hover:opacity-70"
                style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
                + Adicionar
              </button>
              <input ref={fileInputDepois} type="file" accept="image/*" multiple hidden
                onChange={e => handleUploadFoto(e, "depois")} />
            </div>
            {fotosDepois.length === 0 ? (
              <div className="rounded-2xl h-24 flex items-center justify-center"
                style={{ background: "var(--bg-input)", border: "1px dashed var(--border-color)" }}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Sem fotos</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {fotosDepois.map(f => (
                  <img key={f.id} src={f.url} alt="Depois"
                    onClick={() => setFotoAmpliada(f)}
                    className="w-full h-20 object-cover rounded-xl cursor-pointer transition hover:opacity-80"
                    style={{ border: "1px solid var(--border-subtle)" }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {uploadandoFoto && (
          <p className="text-xs text-center mt-3" style={{ color: "var(--gold)" }}>Enviando fotos...</p>
        )}
      </div>

      {/* Histórico de atendimentos */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Histórico de Atendimentos ({sessoes.length})
          </p>
        </div>

        {sessoes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum atendimento registrado ainda</p>
          </div>
        ) : (
          <div>
            {sessoes.map(s => (
              <div key={s.id} className="px-6 py-4 flex gap-4"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
                  {s.numero_sessao}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      Sessão {s.numero_sessao}
                      {s.realizada_em && (
                        <span className="font-normal ml-2" style={{ color: "var(--text-muted)" }}>
                          · {new Date(s.realizada_em).toLocaleDateString("pt-BR", {
                            day: "2-digit", month: "long", year: "numeric"
                          })}
                        </span>
                      )}
                    </p>
                    <button onClick={() => excluirSessao(s.id)}
                      className="text-xs px-2 py-1 rounded-lg transition hover:opacity-70"
                      style={{ color: "var(--danger)", background: "rgba(232,122,122,0.08)" }}>
                      Remover
                    </button>
                  </div>
                  {s.funcionarios?.nome && (
                    <p className="text-xs mb-1" style={{ color: s.funcionarios.cor ?? "var(--gold)" }}>
                      {s.funcionarios.nome}
                    </p>
                  )}
                  {s.observacoes && (
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.observacoes}</p>
                  )}
                  {s.intercorrencias && (
                    <p className="text-xs mt-1 px-2 py-1 rounded-lg"
                      style={{ background: "rgba(232,122,122,0.06)", color: "#e87a7a" }}>
                      ⚠ Intercorrências: {s.intercorrencias}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal registrar atendimento */}
      {modalSessao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setModalSessao(false)}>
          <div className="w-full max-w-md rounded-3xl p-6"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Laser</p>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Registrar Atendimento</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Sessão {pacote.sessoes_feitas + 1} de {pacote.total_sessoes}
                </p>
              </div>
              <button onClick={() => setModalSessao(false)} style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>
                  Data e Hora do Atendimento
                </label>
                <input type="datetime-local" value={formSessao.data_sessao}
                  onChange={e => setFormSessao(f => ({ ...f, data_sessao: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)", colorScheme: "dark" }} />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-muted)" }}>
                  Observações <span style={{ color: "var(--text-muted)" }}>(opcional)</span>
                </label>
                <textarea value={formSessao.observacoes}
                  onChange={e => setFormSessao(f => ({ ...f, observacoes: e.target.value }))}
                  rows={3} placeholder="Evolução do tratamento, parâmetros utilizados, áreas tratadas..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#e87a7a" }}>
                  Intercorrências <span style={{ color: "var(--text-muted)" }}>(opcional)</span>
                </label>
                <textarea value={formSessao.intercorrencias}
                  onChange={e => setFormSessao(f => ({ ...f, intercorrencias: e.target.value }))}
                  rows={2} placeholder="Eritema, edema, foliculite, reações da pele..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background: "var(--bg-input)", border: "1px solid rgba(232,122,122,0.3)", color: "var(--text-primary)" }} />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalSessao(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                Cancelar
              </button>
              <button onClick={registrarSessao} disabled={salvando}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: "var(--gold)", color: "var(--bg-card)" }}>
                {salvando ? "Salvando..." : "Confirmar Atendimento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal foto ampliada */}
      {fotoAmpliada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.92)" }}
          onClick={() => setFotoAmpliada(null)}>
          <div className="max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <img src={fotoAmpliada.url} alt={fotoAmpliada.tipo}
              className="w-full rounded-2xl mb-4" />
            <div className="flex items-center justify-between">
              <span className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{
                  background: fotoAmpliada.tipo === "antes" ? "rgba(232,122,122,0.15)" : "rgba(122,232,160,0.15)",
                  color: fotoAmpliada.tipo === "antes" ? "#e87a7a" : "#7ae8a0",
                }}>
                {fotoAmpliada.tipo === "antes" ? "Antes" : "Depois"}
              </span>
              <div className="flex gap-2">
                <button onClick={() => excluirFoto(fotoAmpliada.id)}
                  className="text-xs px-3 py-1.5 rounded-xl transition hover:opacity-70"
                  style={{ background: "rgba(232,122,122,0.15)", color: "#e87a7a" }}>
                  Excluir foto
                </button>
                <button onClick={() => setFotoAmpliada(null)}
                  className="text-xs px-3 py-1.5 rounded-xl transition hover:opacity-70"
                  style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`textarea::placeholder { color: var(--text-muted); }`}</style>
    </div>
  );
}