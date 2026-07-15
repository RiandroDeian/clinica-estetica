"use client";

import { useState } from "react";

// ── Ficha de Anamnese Laser (versão enxuta) ──────────────────────────────────
type Pergunta = { key: string; label: string; tipo?: "sim_nao" | "texto"; alerta?: boolean; obsPlaceholder?: string };

const SECOES: { titulo: string; perguntas: Pergunta[] }[] = [
  {
    titulo: "Histórico Geral",
    perguntas: [
      { key: "hormonais_tireoide",   label: "Distúrbios hormonais / tireoide?" },
      { key: "autoimune",            label: "Doenças autoimunes?" },
      { key: "alergias",             label: "Alergias importantes?", alerta: true, obsPlaceholder: "Quais?" },
      { key: "gestante_amamentando", label: "Está gestante ou amamentando?" },
    ],
  },
  {
    titulo: "Medicamentos",
    perguntas: [
      { key: "med_continuos",  label: "Medicamentos contínuos?", obsPlaceholder: "Quais?" },
      { key: "roacutan",       label: "Faz uso de Roacutan?", alerta: true },
      { key: "anticoagulantes",label: "Anticoagulantes?" },
    ],
  },
  {
    titulo: "Hábitos",
    perguntas: [
      { key: "exposicao_solar",  label: "Exposição solar diária?" },
      { key: "protetor_solar",   label: "Uso de protetor solar?", obsPlaceholder: "Diário / Ocasional / Não usa" },
      { key: "tabagismo",        label: "Tabagismo?", obsPlaceholder: "Quantidade por dia" },
      { key: "alcool",           label: "Consumo alcoólico?" },
      { key: "atividade_fisica", label: "Pratica atividade física?" },
      { key: "alimentacao",      label: "Alimentação", tipo: "texto" },
      { key: "hidratacao",       label: "Hidratação diária (litros)", tipo: "texto" },
    ],
  },
  {
    titulo: "Procedimentos Estéticos Anteriores",
    perguntas: [
      { key: "toxina_botulinica",    label: "Já realizou toxina botulínica?", obsPlaceholder: "Quando?" },
      { key: "preenchedores",        label: "Preenchedores prévios?" },
      { key: "bioestimuladores",     label: "Bioestimuladores realizados?" },
      { key: "peeling_laser",        label: "Peeling / Laser / Microagulhamento?" },
      { key: "complicacao_anterior", label: "Alguma complicação anterior?" },
    ],
  },
];

const CHAVES_ALERTA = SECOES.flatMap(s => s.perguntas).filter(p => p.alerta).map(p => p.key);

type Resposta = { resposta?: "sim" | "nao" | ""; obs?: string };
type Anamnese = { queixa_principal?: string; respostas?: Record<string, Resposta>; observacoes_gerais?: string };

function respostaAtiva(r?: Resposta) {
  return !!r && (r.resposta === "sim" || !!(r.obs && r.obs.trim()));
}
function temAlerta(respostas?: Record<string, Resposta> | null) {
  if (!respostas) return false;
  return CHAVES_ALERTA.some(k => respostaAtiva(respostas[k]));
}
function preenchida(a?: Anamnese | null) {
  if (!a) return false;
  if (a.queixa_principal?.trim() || a.observacoes_gerais?.trim()) return true;
  return Object.values(a.respostas ?? {}).some(r => r.resposta || (r.obs && r.obs.trim()));
}

export default function AnamneseLaserCard({
  anamnese,
  salvando,
  onSalvar,
}: {
  anamnese?: Anamnese | null;
  salvando: boolean;
  onSalvar: (a: Anamnese) => Promise<void>;
}) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Anamnese>({ queixa_principal: "", respostas: {}, observacoes_gerais: "" });

  function abrir() {
    setForm({
      queixa_principal: anamnese?.queixa_principal ?? "",
      respostas: anamnese?.respostas ? { ...anamnese.respostas } : {},
      observacoes_gerais: anamnese?.observacoes_gerais ?? "",
    });
    setModal(true);
  }
  function setResposta(key: string, patch: Partial<Resposta>) {
    setForm(f => ({ ...f, respostas: { ...f.respostas, [key]: { ...(f.respostas?.[key] ?? {}), ...patch } } }));
  }
  async function salvar() {
    await onSalvar(form);
    setModal(false);
  }

  const respostas = anamnese?.respostas ?? null;
  const alerta = temAlerta(respostas);
  const jaTem = preenchida(anamnese);

  return (
    <>
      {/* Card */}
      <div className="rounded-3xl p-6 mb-5"
        style={{ background: "var(--bg-card)", border: `1px solid ${alerta ? "#e87a7a" : "var(--border-color)"}` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--gold)" }}>Anamnese (Laser)</p>
            {alerta && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "rgba(232,122,122,0.15)", color: "#e87a7a" }}>⚠ Alergia / Roacutan</span>
            )}
          </div>
          <button onClick={abrir}
            className="text-xs px-3 py-1.5 rounded-xl font-medium transition hover:opacity-80"
            style={{ background: "var(--gold-bg)", color: "var(--gold)", border: "1px solid rgba(200,160,120,0.3)" }}>
            {jaTem ? "Editar" : "Preencher"}
          </button>
        </div>

        {!jaTem ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Anamnese ainda não preenchida.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {anamnese?.queixa_principal && (
              <div>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Queixa principal</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{anamnese.queixa_principal}</p>
              </div>
            )}
            {SECOES.map(secao => {
              const respondidas = secao.perguntas.filter(p => respostaAtiva(respostas?.[p.key]) || respostas?.[p.key]?.resposta === "nao");
              if (respondidas.length === 0) return null;
              return (
                <div key={secao.titulo}>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{secao.titulo}</p>
                  <div className="flex flex-col gap-1.5">
                    {respondidas.map(p => {
                      const r = respostas?.[p.key] ?? {};
                      const alertaAtivo = p.alerta && respostaAtiva(r);
                      return (
                        <div key={p.key} className="flex items-start gap-2 rounded-xl px-3 py-2"
                          style={{ background: alertaAtivo ? "rgba(232,122,122,0.1)" : "var(--bg-input)", border: `1px solid ${alertaAtivo ? "#e87a7a" : "var(--border-subtle)"}` }}>
                          <span className="text-sm flex-1" style={{ color: alertaAtivo ? "#e87a7a" : "var(--text-secondary)" }}>
                            {p.label}{r.obs ? <span style={{ color: "var(--text-muted)" }}> — {r.obs}</span> : null}
                          </span>
                          {p.tipo !== "texto" && r.resposta && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                              style={{ background: r.resposta === "sim" ? (alertaAtivo ? "#e87a7a" : "rgba(122,232,160,0.15)") : "var(--border-subtle)", color: r.resposta === "sim" ? (alertaAtivo ? "white" : "#7ae8a0") : "var(--text-muted)" }}>
                              {r.resposta === "sim" ? "Sim" : "Não"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {anamnese?.observacoes_gerais && (
              <div>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Observações gerais</p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{anamnese.observacoes_gerais}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-2xl rounded-3xl p-6 max-h-[92vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-1 sticky top-0 z-10 -mx-6 px-6 pb-3" style={{ background: "var(--bg-card)" }}>
              <h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Anamnese — Laser</h2>
              <button onClick={() => setModal(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>Marque Sim ou Não. Observação opcional. Alergias e Roacutan ficam destacados quando marcados.</p>

            {temAlerta(form.respostas) && (
              <div className="mb-4 rounded-2xl px-4 py-3 text-sm font-semibold"
                style={{ background: "rgba(232,122,122,0.12)", color: "#e87a7a", border: "1px solid #e87a7a" }}>
                ⚠ Atenção: paciente com alergia e/ou uso de Roacutan.
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs uppercase tracking-widest mb-2 font-semibold" style={{ color: "var(--gold)" }}>Queixa principal</label>
              <input type="text" value={form.queixa_principal ?? ""}
                onChange={e => setForm(f => ({ ...f, queixa_principal: e.target.value }))}
                placeholder="O que a paciente busca com o laser?"
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
            </div>

            <div className="flex flex-col gap-6">
              {SECOES.map(secao => (
                <div key={secao.titulo}>
                  <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: "var(--gold)" }}>{secao.titulo}</p>
                  <div className="flex flex-col gap-2">
                    {secao.perguntas.map(p => {
                      const r = form.respostas?.[p.key] ?? {};
                      const alertaAtivo = p.alerta && respostaAtiva(r);
                      const isTexto = p.tipo === "texto";
                      return (
                        <div key={p.key} className="rounded-2xl px-3 py-2.5"
                          style={{ background: alertaAtivo ? "rgba(232,122,122,0.1)" : "var(--bg-input)", border: `1px solid ${alertaAtivo ? "#e87a7a" : "var(--border-subtle)"}` }}>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm flex-1 min-w-[140px]" style={{ color: alertaAtivo ? "#e87a7a" : "var(--text-primary)" }}>
                              {p.label} {p.alerta && <span title="Campo de alerta">⚠</span>}
                            </span>
                            {!isTexto && (
                              <div className="flex gap-1.5 flex-shrink-0">
                                {(["sim", "nao"] as const).map(op => {
                                  const ativo = r.resposta === op;
                                  const corSim = p.alerta ? "#e87a7a" : "#7ae8a0";
                                  return (
                                    <button key={op} type="button"
                                      onClick={() => setResposta(p.key, { resposta: ativo ? "" : op })}
                                      className="px-4 py-1.5 rounded-xl text-xs font-semibold transition"
                                      style={{
                                        background: ativo ? (op === "sim" ? corSim : "var(--text-muted)") : "transparent",
                                        color: ativo ? (op === "sim" && p.alerta ? "white" : "#0a0707") : "var(--text-muted)",
                                        border: `1px solid ${ativo ? "transparent" : "var(--border-color)"}`,
                                      }}>
                                      {op === "sim" ? "Sim" : "Não"}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <input type="text" value={r.obs ?? ""}
                            onChange={e => setResposta(p.key, { obs: e.target.value })}
                            placeholder={p.obsPlaceholder ?? (isTexto ? "Descreva..." : "Observação (opcional)")}
                            className="w-full mt-2 rounded-xl px-3 py-2 text-sm outline-none"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div>
                <p className="text-xs uppercase tracking-widest mb-2 font-semibold" style={{ color: "var(--gold)" }}>Observações gerais</p>
                <textarea value={form.observacoes_gerais ?? ""}
                  onChange={e => setForm(f => ({ ...f, observacoes_gerais: e.target.value }))}
                  rows={3} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                  placeholder="Qualquer observação adicional..." />
              </div>
            </div>

            <div className="flex gap-3 mt-6 sticky bottom-0 -mx-6 px-6 pt-3" style={{ background: "var(--bg-card)" }}>
              <button onClick={() => setModal(false)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="flex-1 py-3 rounded-2xl text-sm font-semibold" style={{ background: "var(--gold)", color: "#0a0707" }}>{salvando ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
