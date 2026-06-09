const fs = require('fs');
const content = `"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

type Paciente = {
  id: string; nome: string; telefone?: string; email?: string;
  cpf?: string; data_nascimento?: string; sexo?: string;
  alergias?: string; contraindicacoes?: string; medicamentos?: string;
  historico_medico?: string; tipo_sanguineo?: string; observacoes?: string;
  fumante?: boolean; gravida?: boolean; amamentando?: boolean;
  assinou_termo?: boolean;
};

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
  const router = useRouter();
  const paciente_id = searchParams.get("id");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState("");
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<string>("saude");
  const [salvando, setSalvando] = useState(false);
  const inp = "w-full rounded-2xl px-4 py-3 text-sm outline-none";
  const inpStyle = { background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" };
  const [modalConsulta, setModalConsulta] = useState(false);
  const [modalAnamnese, setModalAnamnese] = useState(false);
  const [modalPrescricao, setModalPrescricao] = useState(false);
  const [modalExame, setModalExame] = useState(false);
  const [modalSaude, setModalSaude] = useState(false);
  const [modalAnotacao, setModalAnotacao] = useState(false);
  const [formConsulta, setFormConsulta] = useState({ tipo: "consulta", titulo: "", descricao: "", procedimento_realizado: "" });
  const [formAnamnese, setFormAnamnese] = useState({ queixa_principal: "", historia_doenca: "", antecedentes: "", habitos: "" });
  const [formPrescricao, setFormPrescricao] = useState({ medicamento: "", dosagem: "", frequencia: "", duracao: "", observacoes: "" });
  const [formExame, setFormExame] = useState({ tipo_exame: "", resultado: "", observacoes: "" });
  const [formAnotacao, setFormAnotacao] = useState({ titulo: "", conteudo: "", tipo: "geral" });
  const [formSaude, setFormSaude] = useState<any>({});
  const tiposAnotacao = [
    { key: "geral", label: "Geral", cor: "var(--text-muted)" },
    { key: "clinica", label: "Clinica", cor: "var(--info)" },
    { key: "estetica", label: "Estetica", cor: "var(--gold)" },
    { key: "alerta", label: "Alerta", cor: "var(--danger)" },
  ];
  useEffect(() => {
    fetch("/api/pacientes").then(r => r.json()).then(d => { setPacientes(Array.isArray(d) ? d : []); setCarregandoLista(false); });
  }, []);
  const buscarProntuario = useCallback(async () => {
    if (!paciente_id) return;
    setCarregando(true);
    const res = await fetch(\\\`/api/prontuario?paciente_id=\\\${paciente_id}\\\`);
    const data = await res.json();
    setDados(data);
    setFormSaude({ alergias: data.paciente?.alergias ?? "", contraindicacoes: data.paciente?.contraindicacoes ?? "", medicamentos: data.paciente?.medicamentos ?? "", historico_medico: data.paciente?.historico_medico ?? "", tipo_sanguineo: data.paciente?.tipo_sanguineo ?? "Nao informado", observacoes: data.paciente?.observacoes ?? "", fumante: data.paciente?.fumante ?? false, gravida: data.paciente?.gravida ?? false, amamentando: data.paciente?.amamentando ?? false });
    setCarregando(false);
  }, [paciente_id]);
  useEffect(() => { buscarProntuario(); }, [buscarProntuario]);
  const pacientesFiltrados = pacientes.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.telefone ?? "").includes(busca));
  async function salvarDados(acao: string, body: any) {
    setSalvando(true);
    const res = await fetch("/api/prontuario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao, paciente_id, ...body }) });
    if (res.ok) { toast.success("Salvo!"); buscarProntuario(); setModalConsulta(false); setModalAnamnese(false); setModalPrescricao(false); setModalExame(false); setModalAnotacao(false); setModalSaude(false); }
    else toast.error("Erro ao salvar");
    setSalvando(false);
  }
  if (!paciente_id) {
    return (
      <div>
        <div className="mb-6"><p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Clinica</p><h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Prontuarios</h1></div>
        <div className="relative mb-5">
          <input type="text" placeholder="Buscar paciente..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full rounded-2xl px-5 py-4 text-sm outline-none" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
        </div>
        {carregandoLista ? <div className="flex items-center justify-center h-48"><div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} /></div> : (
          <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            {pacientesFiltrados.length === 0 ? <div className="text-center py-16"><p className="text-4xl mb-3">📋</p><p style={{ color: "var(--text-muted)" }}>Nenhum paciente</p></div> : (
              <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {pacientesFiltrados.map(p => (
                  <div key={p.id} onClick={() => router.push(\\\`/admin/prontuario?id=\\\${p.id}\\\`)} className="flex items-center gap-4 px-6 py-4 cursor-pointer transition hover:bg-[var(--bg-hover)]">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>{p.nome.charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>{p.nome}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{p.telefone ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.alergias && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(232,122,122,0.1)", color: "var(--danger)" }}>Alergia</span>}
                      {!p.assinou_termo && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(232,201,122,0.1)", color: "var(--warning)" }}>Sem termo</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  if (carregando) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} /></div>;
  const p: Paciente = dados?.paciente ?? {};
  const agendamentos = dados?.agendamentos ?? [];
  const anotacoes = dados?.anotacoes ?? [];
  const faturamentos = dados?.faturamentos ?? [];
  const consultas = dados?.consultas ?? [];
  const anamneses = dados?.anamneses ?? [];
  const prescricoes = dados?.prescricoes ?? [];
  const exames = dados?.exames ?? [];
  const idade = calcularIdade(p.data_nascimento);
  const totalGasto = faturamentos.filter((f: any) => f.status_pagamento === "pago").reduce((acc: number, f: any) => acc + Number(f.valor_final || 0), 0);
  const abas = [
    { key: "saude", label: "Saude" },
    { key: "consultas", label: \\\`Consultas (\\\${consultas.length})\\\` },
    { key: "anamnese", label: \\\`Anamnese (\\\${anamneses.length})\\\` },
    { key: "prescricao", label: \\\`Prescricao (\\\${prescricoes.length})\\\` },
    { key: "exames", label: \\\`Exames (\\\${exames.length})\\\` },
    { key: "anotacoes", label: \\\`Anotacoes (\\\${anotacoes.length})\\\` },
    { key: "historico", label: \\\`Historico (\\\${agendamentos.length})\\\` },
    { key: "financeiro", label: \\\`Financeiro (\\\${faturamentos.length})\\\` },
  ];
  return (
    <div className="pb-10">
      <button onClick={() => router.push("/admin/prontuario")} className="text-sm mb-4 flex items-center gap-1 transition hover:opacity-70" style={{ color: "var(--text-muted)" }}>← Prontuarios</button>
      <div className="flex items-center gap-5 mb-5 p-5 rounded-3xl flex-wrap" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>{p.nome?.charAt(0).toUpperCase()}</div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{p.nome}</h1>
          <div className="flex flex-wrap gap-2 mt-1">
            {idade !== null && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{idade} anos</span>}
            {p.fumante && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(232,201,122,0.1)", color: "var(--warning)" }}>Fumante</span>}
            {p.gravida && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(122,184,232,0.1)", color: "var(--info)" }}>Gravida</span>}
          </div>
          {(p.alergias || p.contraindicacoes) && <div className="mt-2 px-3 py-1.5 rounded-xl text-xs" style={{ background: "rgba(232,122,122,0.08)", border: "1px solid rgba(232,122,122,0.2)", color: "var(--danger)" }}>Alergias: {p.alergias}</div>}
        </div>
        <div className="flex gap-4">
          <div className="text-center"><p className="text-lg font-bold" style={{ color: "var(--gold)" }}>{agendamentos.filter((a: any) => a.status === "finalizado").length}</p><p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Visitas</p></div>
          <div className="text-center"><p className="text-lg font-bold" style={{ color: "var(--success)" }}>R$ {totalGasto.toLocaleString("pt-BR")}</p><p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Total</p></div>
        </div>
      </div>
      <div className="flex gap-1 mb-5 p-1 rounded-2xl overflow-x-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        {abas.map(aba => <button key={aba.key} onClick={() => setAbaAtiva(aba.key)} className="flex-shrink-0 py-2 px-3 rounded-xl text-xs uppercase tracking-widest transition whitespace-nowrap" style={{ background: abaAtiva === aba.key ? "var(--gold-bg)" : "transparent", color: abaAtiva === aba.key ? "var(--gold)" : "var(--text-muted)" }}>{aba.label}</button>)}
      </div>
      {abaAtiva === "saude" && (
        <div className="rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="flex items-center justify-between mb-5"><h2 className="text-sm uppercase tracking-widest" style={{ color: "var(--gold)" }}>Dados de Saude</h2><button onClick={() => setModalSaude(true)} className="text-xs px-4 py-2 rounded-xl" style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>Editar</button></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[{ label: "Tipo Sanguineo", valor: p.tipo_sanguineo ?? "Nao informado" }, { label: "Alergias", valor: p.alergias ?? "Nenhuma" }, { label: "Contraindicacoes", valor: p.contraindicacoes ?? "Nenhuma" }, { label: "Medicamentos", valor: p.medicamentos ?? "Nenhum" }, { label: "Historico Medico", valor: p.historico_medico ?? "Nao informado" }, { label: "Observacoes", valor: p.observacoes ?? "—" }].map(item => (
              <div key={item.label} className="p-4 rounded-2xl" style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}><p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{item.label}</p><p className="text-sm" style={{ color: "var(--text-primary)" }}>{item.valor}</p></div>
            ))}
          </div>
        </div>
      )}
      {abaAtiva === "consultas" && <div className="flex flex-col gap-4"><button onClick={() => setModalConsulta(true)} className="self-end px-5 py-2.5 rounded-2xl text-sm font-semibold" style={{ background: "var(--gold)", color: "#0a0707" }}>+ Nova Consulta</button>{consultas.length === 0 ? <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}><p className="text-4xl mb-3">🩺</p><p style={{ color: "var(--text-muted)" }}>Nenhuma consulta</p></div> : consultas.map((c: any) => <div key={c.id} className="rounded-3xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>{c.tipo}</span>{c.titulo && <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{c.titulo}</p>}</div><p className="text-xs" style={{ color: "var(--text-muted)" }}>{c.funcionarios?.nome} · {new Date(c.criado_em).toLocaleDateString("pt-BR")}</p></div>{c.procedimento_realizado && <p className="text-xs mb-1" style={{ color: "var(--gold)" }}>Procedimento: {c.procedimento_realizado}</p>}{c.descricao && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.descricao}</p></div>)}</div>}
      {abaAtiva === "anamnese" && <div className="flex flex-col gap-4"><button onClick={() => setModalAnamnese(true)} className="self-end px-5 py-2.5 rounded-2xl text-sm font-semibold" style={{ background: "var(--gold)", color: "#0a0707" }}>+ Nova Anamnese</button>{anamneses.length === 0 ? <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}><p className="text-4xl mb-3">📝</p><p style={{ color: "var(--text-muted)" }}>Nenhuma anamnese</p></div> : anamneses.map((a: any) => <div key={a.id} className="rounded-3xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}><div className="flex justify-between mb-3"><p className="text-sm font-semibold" style={{ color: "var(--gold)" }}>Anamnese</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>{a.funcionarios?.nome} · {new Date(a.criado_em).toLocaleDateString("pt-BR")}</p></div>{[{ label: "Queixa", valor: a.queixa_principal }, { label: "Historia", valor: a.historia_doenca }, { label: "Antecedentes", valor: a.antecedentes }, { label: "Habitos", valor: a.habitos }].filter(i => i.valor).map(item => <div key={item.label} className="mb-2"><p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{item.label}</p><p className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.valor}</p></div>)}</div>)}</div>}
      {abaAtiva === "prescricao" && <div className="flex flex-col gap-4"><button onClick={() => setModalPrescricao(true)} className="self-end px-5 py-2.5 rounded-2xl text-sm font-semibold" style={{ background: "var(--gold)", color: "#0a0707" }}>+ Nova Prescricao</button>{prescricoes.length === 0 ? <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}><p className="text-4xl mb-3">💊</p><p style={{ color: "var(--text-muted)" }}>Nenhuma prescricao</p></div> : prescricoes.map((pr: any) => <div key={pr.id} className="rounded-3xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderLeft: "3px solid var(--success)" }}><div className="flex justify-between mb-2"><p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{pr.medicamento}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(pr.criado_em).toLocaleDateString("pt-BR")}</p></div><div className="flex gap-3 text-xs" style={{ color: "var(--text-muted)" }}>{pr.dosagem && <span>Dose: {pr.dosagem}</span>}{pr.frequencia && <span>Freq: {pr.frequencia}</span>}{pr.duracao && <span>Duracao: {pr.duracao}</span>}</div></div>)}</div>}
      {abaAtiva === "exames" && <div className="flex flex-col gap-4"><button onClick={() => setModalExame(true)} className="self-end px-5 py-2.5 rounded-2xl text-sm font-semibold" style={{ background: "var(--gold)", color: "#0a0707" }}>+ Novo Exame</button>{exames.length === 0 ? <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}><p className="text-4xl mb-3">🔬</p><p style={{ color: "var(--text-muted)" }}>Nenhum exame</p></div> : exames.map((ex: any) => <div key={ex.id} className="rounded-3xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderLeft: "3px solid var(--info)" }}><div className="flex justify-between mb-2"><p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{ex.tipo_exame}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(ex.criado_em).toLocaleDateString("pt-BR")}</p></div>{ex.resultado && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{ex.resultado}</p>}</div>)}</div>}
      {abaAtiva === "anotacoes" && <div className="flex flex-col gap-4"><button onClick={() => setModalAnotacao(true)} className="self-end px-5 py-2.5 rounded-2xl text-sm font-semibold" style={{ background: "var(--gold)", color: "#0a0707" }}>+ Nova Anotacao</button>{anotacoes.length === 0 ? <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}><p className="text-4xl mb-3">📌</p><p style={{ color: "var(--text-muted)" }}>Nenhuma anotacao</p></div> : anotacoes.map((an: any) => { const tipo = tiposAnotacao.find(t => t.key === an.tipo) ?? tiposAnotacao[0]; return <div key={an.id} className="rounded-3xl p-5" style={{ background: "var(--bg-card)", borderLeft: \\\`3px solid \\\${tipo.cor}\\\`, border: "1px solid var(--border-color)" }}><div className="flex items-center justify-between mb-2"><span className="text-xs px-2 py-0.5 rounded-full" style={{ color: tipo.cor }}>{tipo.label}{an.titulo ? \\\` — \\\${an.titulo}\\\` : ""}</span><p className="text-xs" style={{ color: "var(--text-muted)" }}>{an.funcionarios?.nome} · {new Date(an.criado_em).toLocaleDateString("pt-BR")}</p></div><p className="text-sm" style={{ color: "var(--text-secondary)" }}>{an.conteudo}</p></div>; })}</div>}
      {abaAtiva === "historico" && <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>{agendamentos.length === 0 ? <div className="text-center py-16"><p className="text-4xl mb-3">📅</p><p style={{ color: "var(--text-muted)" }}>Nenhum atendimento</p></div> : <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>{agendamentos.map((ag: any) => <div key={ag.id} className="flex items-center gap-4 px-6 py-4"><div className="w-2 h-2 rounded-full" style={{ background: ag.procedimentos?.cor ?? "var(--gold)" }} /><div className="flex-1"><p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{ag.procedimentos?.nome ?? "Procedimento"}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>{ag.funcionarios?.nome}</p></div><div className="text-right"><p className="text-sm" style={{ color: "var(--text-primary)" }}>{new Date(ag.inicio).toLocaleDateString("pt-BR")}</p><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: ag.status === "finalizado" ? "rgba(122,232,160,0.1)" : "rgba(232,201,122,0.1)", color: ag.status === "finalizado" ? "var(--success)" : "var(--warning)" }}>{ag.status}</span></div></div>)}</div>}</div>}
      {abaAtiva === "financeiro" && <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}><div className="px-6 py-4 flex justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}><h2 className="text-xs uppercase tracking-widest" style={{ color: "var(--gold)" }}>Historico Financeiro</h2><p className="text-sm font-bold" style={{ color: "var(--success)" }}>Total: R$ {totalGasto.toLocaleString("pt-BR")}</p></div>{faturamentos.length === 0 ? <div className="text-center py-16"><p className="text-4xl mb-3">💰</p><p style={{ color: "var(--text-muted)" }}>Nenhum registro</p></div> : <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>{faturamentos.map((f: any) => <div key={f.id} className="flex items-center justify-between px-6 py-4"><div><p className="text-sm font-semibold" style={{ color: "var(--gold)" }}>R$ {Number(f.valor_final).toLocaleString("pt-BR")}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>{f.forma_pagamento}</p></div><div className="text-right"><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: f.status_pagamento === "pago" ? "rgba(122,232,160,0.1)" : "rgba(232,201,122,0.1)", color: f.status_pagamento === "pago" ? "var(--success)" : "var(--warning)" }}>{f.status_pagamento}</span><p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{new Date(f.criado_em).toLocaleDateString("pt-BR")}</p></div></div>)}</div>}</div>}
      {modalConsulta && <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}><div className="w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}><div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Nova Consulta</h2><button onClick={() => setModalConsulta(false)} style={{ color: "var(--text-muted)" }}>✕</button></div><div className="flex flex-col gap-4"><div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Tipo</label><div className="flex gap-2 flex-wrap">{["consulta","procedimento","retorno","avaliacao"].map(t => <button key={t} onClick={() => setFormConsulta(f => ({ ...f, tipo: t }))} className="px-3 py-1.5 rounded-xl text-xs capitalize" style={{ background: formConsulta.tipo === t ? "var(--gold-bg)" : "var(--bg-input)", color: formConsulta.tipo === t ? "var(--gold)" : "var(--text-muted)", border: \\\`1px solid \\\${formConsulta.tipo === t ? "var(--border-color)" : "var(--border-subtle)"}\\\` }}>{t}</button>)}</div></div><div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Titulo</label><input value={formConsulta.titulo} onChange={e => setFormConsulta(f => ({ ...f, titulo: e.target.value }))} className={inp} style={inpStyle} placeholder="Titulo..." /></div><div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Procedimento</label><input value={formConsulta.procedimento_realizado} onChange={e => setFormConsulta(f => ({ ...f, procedimento_realizado: e.target.value }))} className={inp} style={inpStyle} placeholder="Ex: Botox..." /></div><div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Descricao</label><textarea value={formConsulta.descricao} onChange={e => setFormConsulta(f => ({ ...f, descricao: e.target.value }))} rows={4} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inpStyle} /></div></div><div className="flex gap-3 mt-5"><button onClick={() => setModalConsulta(false)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button><button onClick={() => salvarDados("consulta", formConsulta)} disabled={salvando} className="flex-1 py-3 rounded-2xl text-sm font-semibold" style={{ background: "var(--gold)", color: "#0a0707" }}>{salvando ? "Salvando..." : "Salvar"}</button></div></div></div>}
      {modalAnamnese && <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}><div className="w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}><div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Nova Anamnese</h2><button onClick={() => setModalAnamnese(false)} style={{ color: "var(--text-muted)" }}>✕</button></div><div className="flex flex-col gap-4">{[{ label: "Queixa Principal", key: "queixa_principal", placeholder: "O que trouxe?" }, { label: "Historia da Doenca", key: "historia_doenca", placeholder: "Descreva..." }, { label: "Antecedentes", key: "antecedentes", placeholder: "Cirurgias..." }, { label: "Habitos", key: "habitos", placeholder: "Alimentacao..." }].map(field => <div key={field.key}><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{field.label}</label><textarea value={(formAnamnese as any)[field.key]} onChange={e => setFormAnamnese(f => ({ ...f, [field.key]: e.target.value }))} rows={3} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inpStyle} placeholder={field.placeholder} /></div>)}</div><div className="flex gap-3 mt-5"><button onClick={() => setModalAnamnese(false)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button><button onClick={() => salvarDados("anamnese", formAnamnese)} disabled={salvando} className="flex-1 py-3 rounded-2xl text-sm font-semibold" style={{ background: "var(--gold)", color: "#0a0707" }}>{salvando ? "Salvando..." : "Salvar"}</button></div></div></div>}
      {modalPrescricao && <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}><div className="w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}><div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Nova Prescricao</h2><button onClick={() => setModalPrescricao(false)} style={{ color: "var(--text-muted)" }}>✕</button></div><div className="grid grid-cols-2 gap-4"><div className="col-span-2"><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Medicamento</label><input value={formPrescricao.medicamento} onChange={e => setFormPrescricao(f => ({ ...f, medicamento: e.target.value }))} className={inp} style={inpStyle} placeholder="Nome..." /></div>{[{ label: "Dosagem", key: "dosagem", placeholder: "500mg" }, { label: "Frequencia", key: "frequencia", placeholder: "2x dia" }, { label: "Duracao", key: "duracao", placeholder: "7 dias" }].map(field => <div key={field.key}><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{field.label}</label><input value={(formPrescricao as any)[field.key]} onChange={e => setFormPrescricao(f => ({ ...f, [field.key]: e.target.value }))} className={inp} style={inpStyle} placeholder={field.placeholder} /></div>)}<div className="col-span-2"><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Observacoes</label><textarea value={formPrescricao.observacoes} onChange={e => setFormPrescricao(f => ({ ...f, observacoes: e.target.value }))} rows={3} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inpStyle} /></div></div><div className="flex gap-3 mt-5"><button onClick={() => setModalPrescricao(false)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button><button onClick={() => salvarDados("prescricao", formPrescricao)} disabled={salvando || !formPrescricao.medicamento} className="flex-1 py-3 rounded-2xl text-sm font-semibold" style={{ background: formPrescricao.medicamento ? "var(--gold)" : "var(--gold-bg)", color: "#0a0707" }}>{salvando ? "Salvando..." : "Salvar"}</button></div></div></div>}
      {modalExame && <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}><div className="w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}><div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Novo Exame</h2><button onClick={() => setModalExame(false)} style={{ color: "var(--text-muted)" }}>✕</button></div><div className="flex flex-col gap-4"><div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Tipo</label><input value={formExame.tipo_exame} onChange={e => setFormExame(f => ({ ...f, tipo_exame: e.target.value }))} className={inp} style={inpStyle} placeholder="Ex: Hemograma..." /></div><div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Resultado</label><textarea value={formExame.resultado} onChange={e => setFormExame(f => ({ ...f, resultado: e.target.value }))} rows={4} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inpStyle} /></div><div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Observacoes</label><textarea value={formExame.observacoes} onChange={e => setFormExame(f => ({ ...f, observacoes: e.target.value }))} rows={2} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inpStyle} /></div></div><div className="flex gap-3 mt-5"><button onClick={() => setModalExame(false)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button><button onClick={() => salvarDados("exame", formExame)} disabled={salvando || !formExame.tipo_exame} className="flex-1 py-3 rounded-2xl text-sm font-semibold" style={{ background: formExame.tipo_exame ? "var(--gold)" : "var(--gold-bg)", color: "#0a0707" }}>{salvando ? "Salvando..." : "Salvar"}</button></div></div></div>}
      {modalAnotacao && <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}><div className="w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}><div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Nova Anotacao</h2><button onClick={() => setModalAnotacao(false)} style={{ color: "var(--text-muted)" }}>✕</button></div><div className="flex gap-2 mb-4 flex-wrap">{tiposAnotacao.map(t => <button key={t.key} onClick={() => setFormAnotacao(f => ({ ...f, tipo: t.key }))} className="px-3 py-1.5 rounded-xl text-xs" style={{ background: formAnotacao.tipo === t.key ? "var(--gold-bg)" : "var(--bg-input)", color: t.cor, border: \\\`1px solid \\\${formAnotacao.tipo === t.key ? "var(--border-color)" : "var(--border-subtle)"}\\\` }}>{t.label}</button>)}</div><div className="flex flex-col gap-4"><input type="text" placeholder="Titulo" value={formAnotacao.titulo} onChange={e => setFormAnotacao(f => ({ ...f, titulo: e.target.value }))} className={inp} style={inpStyle} /><textarea placeholder="Anotacao..." value={formAnotacao.conteudo} onChange={e => setFormAnotacao(f => ({ ...f, conteudo: e.target.value }))} rows={5} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inpStyle} /></div><div className="flex gap-3 mt-5"><button onClick={() => setModalAnotacao(false)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button><button onClick={() => salvarDados("anotacao", formAnotacao)} disabled={salvando || !formAnotacao.conteudo.trim()} className="flex-1 py-3 rounded-2xl text-sm font-semibold" style={{ background: formAnotacao.conteudo.trim() ? "var(--gold)" : "var(--gold-bg)", color: "#0a0707" }}>{salvando ? "Salvando..." : "Salvar"}</button></div></div></div>}
      {modalSaude && <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}><div className="w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}><div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Editar Saude</h2><button onClick={() => setModalSaude(false)} style={{ color: "var(--text-muted)" }}>✕</button></div><div className="flex flex-col gap-4"><div className="flex gap-4 flex-wrap">{[{ label: "Fumante", key: "fumante" }, { label: "Gravida", key: "gravida" }, { label: "Amamentando", key: "amamentando" }].map(item => <label key={item.key} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formSaude[item.key] ?? false} onChange={e => setFormSaude((f: any) => ({ ...f, [item.key]: e.target.checked }))} className="w-4 h-4 rounded" /><span className="text-sm" style={{ color: "var(--text-primary)" }}>{item.label}</span></label>)}</div>{[{ label: "Alergias", key: "alergias" }, { label: "Contraindicacoes", key: "contraindicacoes" }, { label: "Medicamentos", key: "medicamentos" }, { label: "Historico Medico", key: "historico_medico" }, { label: "Observacoes", key: "observacoes" }].map(item => <div key={item.key}><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{item.label}</label><textarea value={formSaude[item.key] ?? ""} onChange={e => setFormSaude((f: any) => ({ ...f, [item.key]: e.target.value }))} rows={2} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inpStyle} /></div>)}</div><div className="flex gap-3 mt-5"><button onClick={() => setModalSaude(false)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button><button onClick={() => salvarDados("atualizar_paciente", formSaude)} disabled={salvando} className="flex-1 py-3 rounded-2xl text-sm font-semibold" style={{ background: "var(--gold)", color: "#0a0707" }}>{salvando ? "Salvando..." : "Salvar"}</button></div></div></div>}
    </div>
  );
}
`;
fs.writeFileSync('app/admin/prontuario/page.tsx', content, 'utf8');
console.log('OK:', content.split('\n').length, 'linhas');
