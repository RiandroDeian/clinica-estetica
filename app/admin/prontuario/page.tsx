"use client";

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

// ── Anamnese estruturada (Ficha de Anamnese Facial) ──────────────────────────
type PerguntaAnamnese = { key: string; label: string; tipo?: "sim_nao" | "texto"; alerta?: boolean; obsPlaceholder?: string };
const ANAMNESE_SECOES: { titulo: string; perguntas: PerguntaAnamnese[] }[] = [
  {
    titulo: "Histórico Geral",
    perguntas: [
      { key: "cardiaco",             label: "Problemas cardíacos?" },
      { key: "hipertensao_diabetes", label: "Hipertensão / Diabetes?" },
      { key: "hormonais_tireoide",   label: "Distúrbios hormonais / tireoide?" },
      { key: "autoimune",            label: "Doenças autoimunes?" },
      { key: "coagulacao",           label: "Distúrbios de coagulação?" },
      { key: "epilepsia",            label: "Epilepsia ou convulsões?" },
      { key: "respiratorio",         label: "Asma ou problemas respiratórios?" },
      { key: "alergias",             label: "Alergias importantes?", alerta: true, obsPlaceholder: "Quais alergias?" },
      { key: "alergia_lidocaina",    label: "Alergia a lidocaína?", alerta: true },
      { key: "gestante_amamentando", label: "Está gestante ou amamentando?" },
      { key: "cirurgias_recentes",   label: "Cirurgias recentes (últimos 6 meses)?" },
      { key: "queloide",             label: "Histórico de quelóide ou cicatrização ruim?" },
      { key: "herpes_facial",        label: "Já teve herpes na região facial?" },
    ],
  },
  {
    titulo: "Medicamentos",
    perguntas: [
      { key: "med_continuos",        label: "Medicamentos contínuos?", obsPlaceholder: "Quais?" },
      { key: "anticoagulantes",      label: "Anticoagulantes?" },
      { key: "suplementos",          label: "Suplementos (colágeno, vitaminas, pré-treino, etc)?" },
      { key: "antibioticos_recentes",label: "Uso recente de antibióticos?" },
    ],
  },
  {
    titulo: "Hábitos",
    perguntas: [
      { key: "exposicao_solar",      label: "Exposição solar diária?" },
      { key: "protetor_solar",       label: "Uso de protetor solar?", obsPlaceholder: "Diário / Ocasional / Não usa" },
      { key: "tabagismo",            label: "Tabagismo?", obsPlaceholder: "Quantidade por dia" },
      { key: "alcool",               label: "Consumo alcoólico?" },
      { key: "atividade_fisica",     label: "Pratica atividade física?" },
      { key: "alimentacao",          label: "Alimentação", tipo: "texto" },
      { key: "hidratacao",           label: "Hidratação diária (litros)", tipo: "texto" },
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
  {
    titulo: "Contraindicações",
    perguntas: [
      { key: "contraindicacoes",     label: "Possui alguma contraindicação?", alerta: true, obsPlaceholder: "Descreva a contraindicação" },
    ],
  },
];

const ANAMNESE_PERGUNTAS: Record<string, PerguntaAnamnese> = Object.fromEntries(
  ANAMNESE_SECOES.flatMap(s => s.perguntas).map(p => [p.key, p])
);
const CHAVES_ALERTA = ANAMNESE_SECOES.flatMap(s => s.perguntas).filter(p => p.alerta).map(p => p.key);

type RespostaAnamnese = { resposta?: "sim" | "nao" | ""; obs?: string };
function respostaAtiva(r?: RespostaAnamnese) {
  return !!r && (r.resposta === "sim" || !!(r.obs && r.obs.trim()));
}
function anamneseTemAlerta(respostas?: Record<string, RespostaAnamnese> | null) {
  if (!respostas) return false;
  return CHAVES_ALERTA.some(k => respostaAtiva(respostas[k]));
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
  const [formAnamnese, setFormAnamnese] = useState<{ respostas: Record<string, RespostaAnamnese>; observacoes_gerais: string }>({ respostas: {}, observacoes_gerais: "" });
  function setResposta(key: string, patch: Partial<RespostaAnamnese>) {
    setFormAnamnese(f => ({ ...f, respostas: { ...f.respostas, [key]: { ...f.respostas[key], ...patch } } }));
  }
  const [formPrescricao, setFormPrescricao] = useState({ medicamento: "", dosagem: "", frequencia: "", duracao: "", observacoes: "" });
  const [formExame, setFormExame] = useState({ tipo_exame: "", resultado: "", observacoes: "" });
  const [formAnotacao, setFormAnotacao] = useState({ titulo: "", conteudo: "", tipo: "geral" });
  const [formSaude, setFormSaude] = useState<any>({});
  const [modalAtestado, setModalAtestado] = useState(false);
  const [formAtestado, setFormAtestado] = useState({ finalidade: "repouso", dias: "1", cid: "", observacoes: "" });
  const [fotos, setFotos] = useState<any[]>([]);
  const [uploadando, setUploadando] = useState(false);
  const [modalTermo, setModalTermo] = useState(false);
  const [salvandoTermo, setSalvandoTermo] = useState(false);
  const [modalFoto, setModalFoto] = useState(false);
  const [modalVerAtendimento, setModalVerAtendimento] = useState<any | null>(null);
  const [formFoto, setFormFoto] = useState({ tipo: "antes", descricao: "" });
  const tiposAnotacao = [
    { key: "geral", label: "Geral", cor: "var(--text-muted)" },
    { key: "clinica", label: "Clinica", cor: "var(--info)" },
    { key: "estetica", label: "Estetica", cor: "var(--gold)" },
    { key: "alerta", label: "Alerta", cor: "var(--danger)" },
  ];

  useEffect(() => {
    fetch("/api/pacientes").then(r => r.json()).then(d => {
      setPacientes(Array.isArray(d) ? d : []);
      setCarregandoLista(false);
    });
  }, []);

  const buscarProntuario = useCallback(async () => {
    if (!paciente_id) return;
    setCarregando(true);
    const res = await fetch("/api/prontuario?paciente_id=" + paciente_id);
    const data = await res.json();
    setDados(data);
    setFormSaude({
      alergias: data.paciente?.alergias ?? "",
      contraindicacoes: data.paciente?.contraindicacoes ?? "",
      medicamentos: data.paciente?.medicamentos ?? "",
      historico_medico: data.paciente?.historico_medico ?? "",
      tipo_sanguineo: data.paciente?.tipo_sanguineo ?? "Nao informado",
      observacoes: data.paciente?.observacoes ?? "",
      fumante: data.paciente?.fumante ?? false,
      gravida: data.paciente?.gravida ?? false,
      amamentando: data.paciente?.amamentando ?? false,
    });
    setCarregando(false);
  }, [paciente_id]);

  useEffect(() => { buscarProntuario(); }, [buscarProntuario]);

  const pacientesFiltrados = pacientes.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (p.telefone ?? "").includes(busca)
  );

  async function salvarDados(acao: string, body: any) {
    setSalvando(true);
    const res = await fetch("/api/prontuario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao, paciente_id, ...body }),
    });
    if (res.ok) {
      toast.success("Salvo!");
      buscarProntuario();
      setModalConsulta(false); setModalAnamnese(false);
      setModalPrescricao(false); setModalExame(false);
      setModalAnotacao(false); setModalSaude(false);
    } else toast.error("Erro ao salvar");
    setSalvando(false);
  }

  function gerarAtestado() {
    const p2: any = dados?.paciente ?? {};
    const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const finalidades: any = {
      repouso: `Atestamos que o(a) paciente ${p2.nome} necessita de repouso pelo periodo de ${formAtestado.dias} dia(s).`,
      comparecimento: `Atestamos que o(a) paciente ${p2.nome} compareceu a esta clinica na data de ${hoje}.`,
      livre: formAtestado.observacoes,
    };
    const texto = finalidades[formAtestado.finalidade] ?? "";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Atestado</title><style>
      body { font-family: Georgia, serif; max-width: 700px; margin: 60px auto; color: #1a1a1a; }
      .logo { text-align: center; margin-bottom: 40px; }
      .logo h1 { font-size: 28px; letter-spacing: 8px; margin: 0; color: #c8a078; }
      .logo p { font-size: 11px; letter-spacing: 4px; color: #888; margin: 4px 0 0; }
      h2 { text-align: center; font-size: 16px; letter-spacing: 6px; text-transform: uppercase; margin: 40px 0; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 12px 0; }
      .corpo { font-size: 15px; line-height: 2; text-align: justify; margin: 30px 0; }
      .dados { margin: 20px 0; font-size: 14px; }
      .dados span { font-weight: bold; }
      .rodape { margin-top: 80px; text-align: center; }
      .assinatura { border-top: 1px solid #333; width: 250px; margin: 0 auto 8px; }
      .cidade { margin-top: 40px; text-align: right; font-size: 13px; color: #666; }
      ${formAtestado.cid ? `.cid { font-size: 12px; color: #888; margin-top: 20px; }` : ""}
    </style></head><body>
      <div class="logo"><h1>MONCIE</h1><p>ESTHETIQUE</p></div>
      <h2>Atestado</h2>
      <div class="corpo">${texto}</div>
      ${formAtestado.cid ? `<p class="cid">CID: ${formAtestado.cid}</p>` : ""}
      ${formAtestado.finalidade !== "livre" && formAtestado.observacoes ? `<div class="dados"><span>Observacoes:</span> ${formAtestado.observacoes}</div>` : ""}
      <div class="cidade">Planaltina, Brasilia — ${hoje}</div>
      <div class="rodape">
        <div class="assinatura"></div>
        <p style="font-size:13px;margin:0">Moncié Esthetique</p>
        <p style="font-size:11px;color:#888;margin:4px 0 0">Clinica de Estetica Avancada</p>
      </div>
    </body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.print(); }
    setModalAtestado(false);
  }

  async function assinarTermo() {
    setSalvandoTermo(true);
    await fetch("/api/prontuario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "atualizar_paciente", paciente_id, assinou_termo: true }) });
    setSalvandoTermo(false); setModalTermo(false); buscarProntuario();
  }

  function gerarPDF() {
    const p2: any = dados?.paciente ?? {};
    const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Prontuario</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;color:#1a1a1a}.logo{text-align:center;margin-bottom:30px}.logo h1{font-size:22px;letter-spacing:8px;color:#c8a078;margin:0}h2{font-size:13px;letter-spacing:5px;text-transform:uppercase;border-top:1px solid #ddd;border-bottom:1px solid #ddd;padding:8px 0;margin:20px 0}table{width:100%;border-collapse:collapse}td{padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}td:first-child{color:#888;font-size:11px;text-transform:uppercase;width:35%}.alerta{background:rgba(232,122,122,0.08);border:1px solid rgba(232,122,122,0.3);padding:10px;border-radius:8px;margin:10px 0;font-size:12px;color:#c0392b}.cidade{text-align:right;font-size:11px;color:#888;margin-top:30px}</style></head><body><div class="logo"><h1>MONCIE</h1><p style="font-size:10px;letter-spacing:4px;color:#888;margin:4px 0 0">ESTHETIQUE</p></div><h2>Prontuario do Paciente</h2><table><tr><td>Nome</td><td><strong>${p2.nome}</strong></td></tr>${p2.data_nascimento ? `<tr><td>Nascimento</td><td>${new Date(p2.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR")}</td></tr>` : ""}${p2.telefone ? `<tr><td>Telefone</td><td>${p2.telefone}</td></tr>` : ""}${p2.tipo_sanguineo ? `<tr><td>Tipo Sanguineo</td><td>${p2.tipo_sanguineo}</td></tr>` : ""}</table>${p2.alergias ? `<div class="alerta">Alergias: ${p2.alergias}</div>` : ""}${p2.medicamentos ? `<div class="alerta">Medicamentos: ${p2.medicamentos}</div>` : ""}${consultas.length > 0 ? `<h2>Consultas (${consultas.length})</h2>` + consultas.map((cc: any) => `<div style="border-left:3px solid #c8a078;padding:8px 12px;margin-bottom:8px;background:#f9f9f9"><p style="margin:0;font-size:13px;font-weight:bold">${cc.tipo}${cc.titulo ? " — " + cc.titulo : ""}</p>${cc.descricao ? `<p style="margin:4px 0 0;font-size:12px;color:#555">${cc.descricao}</p>` : ""}<p style="margin:4px 0 0;font-size:11px;color:#999">${new Date(cc.criado_em).toLocaleDateString("pt-BR")}</p></div>`).join("") : ""}${prescricoes.length > 0 ? `<h2>Prescricoes (${prescricoes.length})</h2>` + prescricoes.map((pr: any) => `<div style="border-left:3px solid #7ae8a0;padding:8px 12px;margin-bottom:8px;background:#f9f9f9"><p style="margin:0;font-size:13px;font-weight:bold">${pr.medicamento}</p><p style="margin:4px 0 0;font-size:12px;color:#666">${[pr.dosagem && "Dose: " + pr.dosagem, pr.frequencia && "Freq: " + pr.frequencia].filter(Boolean).join(" · ")}</p></div>`).join("") : ""}<div class="cidade">Planaltina, Brasilia — ${hoje}</div></body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  }

  if (!paciente_id) {
    return (
      <div>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Clinica</p>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Prontuarios</h1>
        </div>
        <div className="relative mb-5">
          <input type="text" placeholder="Buscar paciente..." value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full rounded-2xl px-5 py-4 text-sm outline-none"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
        </div>
        {carregandoLista ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} />
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            {pacientesFiltrados.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📋</p>
                <p style={{ color: "var(--text-muted)" }}>Nenhum paciente</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {pacientesFiltrados.map(p => (
                  <div key={p.id} onClick={() => router.push("/admin/prontuario?id=" + p.id)}
                    className="flex items-center gap-4 px-6 py-4 cursor-pointer transition hover:bg-[var(--bg-hover)]">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
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

  if (carregando) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} />
    </div>
  );

  const p: Paciente = dados?.paciente ?? {};
  const agendamentos = dados?.agendamentos ?? [];
  const anotacoes = dados?.anotacoes ?? [];
  const faturamentos = dados?.faturamentos ?? [];
  const consultas = dados?.consultas ?? [];
  const anamneses = dados?.anamneses ?? [];
  const prescricoes = dados?.prescricoes ?? [];
  const exames = dados?.exames ?? [];
  const idade = calcularIdade(p.data_nascimento);
  const totalGasto = faturamentos
    .filter((f: any) => f.status_pagamento === "pago")
    .reduce((acc: number, f: any) => acc + Number(f.valor_final || 0), 0);

  const abas = [
    { key: "saude",      label: "Saude" },
    { key: "consultas",  label: "Consultas (" + consultas.length + ")" },
    { key: "anamnese",   label: "Anamnese (" + anamneses.length + ")" },
    { key: "prescricao", label: "Prescricao (" + prescricoes.length + ")" },
    { key: "exames",     label: "Exames (" + exames.length + ")" },
    { key: "anotacoes",  label: "Anotacoes (" + anotacoes.length + ")" },
    { key: "historico",  label: "Historico (" + agendamentos.length + ")" },
    { key: "financeiro", label: "Financeiro (" + faturamentos.length + ")" },
    { key: "fotos", label: "Fotos (" + fotos.length + ")" },
    { key: "timeline", label: "Linha do Tempo" },
  ];

  return (
    <div className="pb-10">
      <button onClick={() => router.push("/admin/prontuario")}
        className="text-sm mb-4 flex items-center gap-1 transition hover:opacity-70"
        style={{ color: "var(--text-muted)" }}>
        ← Prontuarios
      </button>
      {dados?.paciente && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={gerarPDF} className="text-xs px-3 py-1.5 rounded-xl transition hover:scale-105" style={{ background: "var(--gold-bg)", color: "var(--gold)", border: "1px solid var(--border-color)" }}>📄 Exportar PDF</button>
          {!dados?.paciente?.assinou_termo
            ? <button onClick={() => setModalTermo(true)} className="text-xs px-3 py-1.5 rounded-xl transition hover:scale-105" style={{ background: "rgba(122,232,160,0.1)", color: "var(--success)", border: "1px solid rgba(122,232,160,0.2)" }}>✍ Assinar Termo</button>
            : <span className="text-xs px-3 py-1.5 rounded-xl" style={{ background: "rgba(122,232,160,0.1)", color: "var(--success)" }}>✓ Termo Assinado</span>
          }
        </div>
      )}

      <div className="flex items-center gap-5 mb-5 p-5 rounded-3xl flex-wrap"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
          style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>
          {p.nome?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{p.nome}</h1>
          <div className="flex flex-wrap gap-2 mt-1">
            {idade !== null && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{idade} anos</span>}
            {p.fumante && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(232,201,122,0.1)", color: "var(--warning)" }}>Fumante</span>}
            {p.gravida && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(122,184,232,0.1)", color: "var(--info)" }}>Gravida</span>}
          </div>
          {(p.alergias || p.contraindicacoes) && (
            <div className="mt-2 px-3 py-1.5 rounded-xl text-xs"
              style={{ background: "rgba(232,122,122,0.08)", border: "1px solid rgba(232,122,122,0.2)", color: "var(--danger)" }}>
              Alergias: {p.alergias}
            </div>
          )}
          {p.medicamentos && p.medicamentos !== "Nenhum" && (
            <div className="mt-1 px-3 py-1.5 rounded-xl text-xs"
              style={{ background: "rgba(232,201,122,0.08)", border: "1px solid rgba(232,201,122,0.2)", color: "var(--warning)" }}>
              💊 Medicamentos em uso: {p.medicamentos}
            </div>
          )}
          {p.contraindicacoes && p.contraindicacoes !== "Nenhuma" && (
            <div className="mt-1 px-3 py-1.5 rounded-xl text-xs"
              style={{ background: "rgba(168,144,232,0.08)", border: "1px solid rgba(168,144,232,0.2)", color: "var(--info)" }}>
              ⛔ Contraindicacoes: {p.contraindicacoes}
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: "var(--gold)" }}>
              {agendamentos.filter((a: any) => a.status === "finalizado").length}
            </p>
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Visitas</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: "var(--success)" }}>
              R$ {totalGasto.toLocaleString("pt-BR")}
            </p>
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Total</p>
          </div>
        </div>
      </div>

      {/* #6 — paciente liberado pela recepção */}
      {agendamentos.some((a: any) => a.liberado && a.status !== "finalizado" && a.status !== "cancelado" && new Date(a.inicio).toDateString() === new Date().toDateString()) && (
        <div className="mb-5 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm font-semibold"
          style={{ background: "rgba(122,184,232,0.12)", color: "#7ab8e8", border: "1px solid rgba(122,184,232,0.35)" }}>
          🔔 Paciente liberado para atendimento — pode chamar ao consultório.
        </div>
      )}

      <div className="flex gap-1 mb-5 p-1 rounded-2xl overflow-x-auto"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        {abas.map(aba => (
          <button key={aba.key} onClick={() => setAbaAtiva(aba.key)}
            className="flex-shrink-0 py-2 px-3 rounded-xl text-xs uppercase tracking-widest transition whitespace-nowrap"
            style={{ background: abaAtiva === aba.key ? "var(--gold-bg)" : "transparent", color: abaAtiva === aba.key ? "var(--gold)" : "var(--text-muted)" }}>
            {aba.label}
          </button>
        ))}
      </div>

      {abaAtiva === "saude" && (
        <div className="rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm uppercase tracking-widest" style={{ color: "var(--gold)" }}>Dados de Saude</h2>
            <div className="flex gap-2">
              <button onClick={() => setModalAtestado(true)} className="text-xs px-4 py-2 rounded-xl transition hover:scale-105" style={{ background: "rgba(122,232,160,0.1)", color: "var(--success)", border: "1px solid rgba(122,232,160,0.2)" }}>Atestado</button>
              <button onClick={() => setModalSaude(true)} className="text-xs px-4 py-2 rounded-xl" style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>Editar</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Tipo Sanguineo", valor: p.tipo_sanguineo ?? "Nao informado" },
              { label: "Alergias", valor: p.alergias ?? "Nenhuma" },
              { label: "Contraindicacoes", valor: p.contraindicacoes ?? "Nenhuma" },
              { label: "Medicamentos", valor: p.medicamentos ?? "Nenhum" },
              { label: "Historico Medico", valor: p.historico_medico ?? "Nao informado" },
              { label: "Observacoes", valor: p.observacoes ?? "—" },
            ].map(item => (
              <div key={item.label} className="p-4 rounded-2xl" style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>{item.valor}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {abaAtiva === "consultas" && (
        <div className="flex flex-col gap-4">
          <button onClick={() => setModalConsulta(true)} className="self-end px-5 py-2.5 rounded-2xl text-sm font-semibold"
            style={{ background: "var(--gold)", color: "#0a0707" }}>+ Nova Consulta</button>
          {consultas.length === 0 ? (
            <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-4xl mb-3">🩺</p><p style={{ color: "var(--text-muted)" }}>Nenhuma consulta</p>
            </div>
          ) : consultas.map((c: any) => (
            <div key={c.id} className="rounded-3xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>{c.tipo}</span>
                  {c.titulo && <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{c.titulo}</p>}
                  <button onClick={() => setModalVerAtendimento(c)}
                    className="ml-auto text-xs px-3 py-1 rounded-xl transition hover:opacity-70"
                    style={{ background: "var(--gold-bg)", color: "var(--gold)", border: "1px solid rgba(200,160,120,0.3)" }}>
                    Ver
                  </button>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{c.funcionarios?.nome} · {new Date(c.criado_em).toLocaleDateString("pt-BR")}</p>
              </div>
              {c.procedimento_realizado && <p className="text-xs mb-1" style={{ color: "var(--gold)" }}>Procedimento: {c.procedimento_realizado}</p>}
              {c.descricao && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.descricao}</p>}
            </div>
          ))}
        </div>
      )}

      {abaAtiva === "anamnese" && (
        <div className="flex flex-col gap-4">
          <button onClick={() => { setFormAnamnese({ respostas: {}, observacoes_gerais: "" }); setModalAnamnese(true); }} className="self-end px-5 py-2.5 rounded-2xl text-sm font-semibold"
            style={{ background: "var(--gold)", color: "#0a0707" }}>+ Nova Anamnese</button>
          {anamneses.length === 0 ? (
            <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-4xl mb-3">📝</p><p style={{ color: "var(--text-muted)" }}>Nenhuma anamnese</p>
            </div>
          ) : anamneses.map((a: any) => {
            const respostas: Record<string, RespostaAnamnese> | null = a.respostas ?? null;
            const temAlerta = anamneseTemAlerta(respostas);
            return (
            <div key={a.id} className="rounded-3xl p-5"
              style={{ background: "var(--bg-card)", border: `1px solid ${temAlerta ? "#e87a7a" : "var(--border-color)"}` }}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: "var(--gold)" }}>Anamnese</p>
                  {temAlerta && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: "rgba(232,122,122,0.15)", color: "#e87a7a" }}>⚠ Alergia / Contraindicação</span>
                  )}
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{a.funcionarios?.nome} · {new Date(a.criado_em).toLocaleDateString("pt-BR")}</p>
              </div>

              {respostas ? (
                <div className="flex flex-col gap-4">
                  {ANAMNESE_SECOES.map(secao => {
                    const respondidas = secao.perguntas.filter(p => respostaAtiva(respostas[p.key]) || respostas[p.key]?.resposta === "nao");
                    if (respondidas.length === 0) return null;
                    return (
                      <div key={secao.titulo}>
                        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{secao.titulo}</p>
                        <div className="flex flex-col gap-1.5">
                          {respondidas.map(p => {
                            const r = respostas[p.key] ?? {};
                            const alertaAtivo = p.alerta && respostaAtiva(r);
                            return (
                              <div key={p.key} className="flex items-start gap-2 rounded-xl px-3 py-2"
                                style={{ background: alertaAtivo ? "rgba(232,122,122,0.1)" : "var(--bg-input)", border: `1px solid ${alertaAtivo ? "#e87a7a" : "var(--border-subtle)"}` }}>
                                <span className="text-sm flex-1" style={{ color: alertaAtivo ? "#e87a7a" : "var(--text-secondary)" }}>
                                  {p.label}
                                  {r.obs ? <span style={{ color: "var(--text-muted)" }}> — {r.obs}</span> : null}
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
                  {a.observacoes_gerais && (
                    <div>
                      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Observações gerais</p>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{a.observacoes_gerais}</p>
                    </div>
                  )}
                </div>
              ) : (
                [
                  { label: "Queixa", valor: a.queixa_principal },
                  { label: "Historia", valor: a.historia_doenca },
                  { label: "Antecedentes", valor: a.antecedentes },
                  { label: "Habitos", valor: a.habitos },
                ].filter(i => i.valor).map(item => (
                  <div key={item.label} className="mb-2">
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.valor}</p>
                  </div>
                ))
              )}
            </div>
          );})}
        </div>
      )}

      {abaAtiva === "prescricao" && (
        <div className="flex flex-col gap-4">
          <button onClick={() => setModalPrescricao(true)} className="self-end px-5 py-2.5 rounded-2xl text-sm font-semibold"
            style={{ background: "var(--gold)", color: "#0a0707" }}>+ Nova Prescricao</button>
          {prescricoes.length === 0 ? (
            <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-4xl mb-3">💊</p><p style={{ color: "var(--text-muted)" }}>Nenhuma prescricao</p>
            </div>
          ) : prescricoes.map((pr: any) => (
            <div key={pr.id} className="rounded-3xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderLeft: "3px solid var(--success)" }}>
              <div className="flex justify-between mb-2">
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{pr.medicamento}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(pr.criado_em).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="flex gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                {pr.dosagem && <span>Dose: {pr.dosagem}</span>}
                {pr.frequencia && <span>Freq: {pr.frequencia}</span>}
                {pr.duracao && <span>Duracao: {pr.duracao}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {abaAtiva === "exames" && (
        <div className="flex flex-col gap-4">
          <button onClick={() => setModalExame(true)} className="self-end px-5 py-2.5 rounded-2xl text-sm font-semibold"
            style={{ background: "var(--gold)", color: "#0a0707" }}>+ Novo Exame</button>
          {exames.length === 0 ? (
            <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-4xl mb-3">🔬</p><p style={{ color: "var(--text-muted)" }}>Nenhum exame</p>
            </div>
          ) : exames.map((ex: any) => (
            <div key={ex.id} className="rounded-3xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderLeft: "3px solid var(--info)" }}>
              <div className="flex justify-between mb-2">
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{ex.tipo_exame}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(ex.criado_em).toLocaleDateString("pt-BR")}</p>
              </div>
              {ex.resultado && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{ex.resultado}</p>}
            </div>
          ))}
        </div>
      )}

      {abaAtiva === "anotacoes" && (
        <div className="flex flex-col gap-4">
          <button onClick={() => setModalAnotacao(true)} className="self-end px-5 py-2.5 rounded-2xl text-sm font-semibold"
            style={{ background: "var(--gold)", color: "#0a0707" }}>+ Nova Anotacao</button>
          {anotacoes.length === 0 ? (
            <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-4xl mb-3">📌</p><p style={{ color: "var(--text-muted)" }}>Nenhuma anotacao</p>
            </div>
          ) : anotacoes.map((an: any) => {
            const tipo = tiposAnotacao.find(t => t.key === an.tipo) ?? tiposAnotacao[0];
            return (
              <div key={an.id} className="rounded-3xl p-5"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderLeft: "3px solid " + tipo.cor }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: tipo.cor }}>
                    {tipo.label}{an.titulo ? " — " + an.titulo : ""}
                  </span>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {an.funcionarios?.nome} · {new Date(an.criado_em).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{an.conteudo}</p>
              </div>
            );
          })}
        </div>
      )}

      {abaAtiva === "historico" && (
        <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          {agendamentos.length === 0 ? (
            <div className="text-center py-16"><p className="text-4xl mb-3">📅</p><p style={{ color: "var(--text-muted)" }}>Nenhum atendimento</p></div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {agendamentos.map((ag: any) => (
                <div key={ag.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-2 h-2 rounded-full" style={{ background: ag.procedimentos?.cor ?? "var(--gold)" }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{ag.procedimentos?.nome ?? "Procedimento"}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{ag.funcionarios?.nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>{new Date(ag.inicio).toLocaleDateString("pt-BR")}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: ag.status === "finalizado" ? "rgba(122,232,160,0.1)" : "rgba(232,201,122,0.1)",
                      color: ag.status === "finalizado" ? "var(--success)" : "var(--warning)",
                    }}>{ag.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {abaAtiva === "financeiro" && (
        <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="px-6 py-4 flex justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <h2 className="text-xs uppercase tracking-widest" style={{ color: "var(--gold)" }}>Historico Financeiro</h2>
            <p className="text-sm font-bold" style={{ color: "var(--success)" }}>Total: R$ {totalGasto.toLocaleString("pt-BR")}</p>
          </div>
          {faturamentos.length === 0 ? (
            <div className="text-center py-16"><p className="text-4xl mb-3">💰</p><p style={{ color: "var(--text-muted)" }}>Nenhum registro</p></div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {faturamentos.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--gold)" }}>R$ {Number(f.valor_final).toLocaleString("pt-BR")}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{f.forma_pagamento}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: f.status_pagamento === "pago" ? "rgba(122,232,160,0.1)" : "rgba(232,201,122,0.1)",
                      color: f.status_pagamento === "pago" ? "var(--success)" : "var(--warning)",
                    }}>{f.status_pagamento}</span>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{new Date(f.criado_em).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {abaAtiva === "fotos" && (
        <div className="flex flex-col gap-4">
          <button onClick={() => setModalFoto(true)} className="self-end px-5 py-2.5 rounded-2xl text-sm font-semibold"
            style={{ background: "var(--gold)", color: "#0a0707" }}>+ Adicionar Foto</button>
          {fotos.length === 0 ? (
            <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-4xl mb-3">📷</p><p style={{ color: "var(--text-muted)" }}>Nenhuma foto registrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {fotos.map((f: any) => (
                <div key={f.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                  <img src={f.url} alt={f.descricao ?? f.tipo} className="w-full h-48 object-cover" />
                  <div className="p-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: f.tipo === "antes" ? "rgba(232,122,122,0.1)" : "rgba(122,232,160,0.1)", color: f.tipo === "antes" ? "var(--danger)" : "var(--success)" }}>{f.tipo}</span>
                    {f.descricao && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{f.descricao}</p>}
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{new Date(f.criado_em).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {modalFoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Adicionar Foto</h2>
              <button onClick={() => setModalFoto(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Tipo</label>
                <div className="flex gap-2">
                  {["antes", "depois", "evolucao"].map(t => (
                    <button key={t} onClick={() => setFormFoto(f => ({ ...f, tipo: t }))}
                      className="flex-1 py-2 rounded-xl text-xs capitalize transition"
                      style={{ background: formFoto.tipo === t ? "var(--gold-bg)" : "var(--bg-input)", color: formFoto.tipo === t ? "var(--gold)" : "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Descrição</label>
                <input value={formFoto.descricao} onChange={e => setFormFoto(f => ({ ...f, descricao: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                  placeholder="Ex: Antes do botox..." />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Arquivo</label>
                <input type="file" accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !paciente_id) return;
                    setUploadando(true);
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("paciente_id", paciente_id);
                    const res = await fetch("/api/prontuario/upload", { method: "POST", body: fd });
                    const data = await res.json();
                   if (data.url) {
                      const novaFoto = { url: data.url, tipo: formFoto.tipo, descricao: formFoto.descricao };
                      await salvarDados("foto", novaFoto);
                      // ✅ Atualiza a lista de fotos imediatamente
                      setFotos(prev => [novaFoto, ...prev]);
                      setModalFoto(false);
                      setFormFoto({ tipo: "antes", descricao: "" });
                    }
                    setUploadando(false);
                  }}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
              </div>
              {uploadando && <p className="text-xs text-center" style={{ color: "var(--gold)" }}>Enviando foto...</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalFoto(false)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {abaAtiva === "timeline" && (() => {
        const eventos: any[] = [
          ...agendamentos.map((a: any) => ({ tipo: "agendamento", data: a.inicio, cor: "var(--gold)", icon: "📅", titulo: a.procedimentos?.nome ?? "Procedimento", sub: a.funcionarios?.nome + " · " + a.status })),
          ...consultas.map((c: any) => ({ tipo: "consulta", data: c.criado_em, cor: "var(--info)", icon: "🩺", titulo: c.tipo + (c.titulo ? " — " + c.titulo : ""), sub: c.funcionarios?.nome })),
          ...anamneses.map((a: any) => ({ tipo: "anamnese", data: a.criado_em, cor: "#a078c8", icon: "📝", titulo: "Anamnese", sub: a.funcionarios?.nome })),
          ...prescricoes.map((pr: any) => ({ tipo: "prescricao", data: pr.criado_em, cor: "var(--success)", icon: "💊", titulo: pr.medicamento, sub: pr.dosagem })),
          ...exames.map((ex: any) => ({ tipo: "exame", data: ex.criado_em, cor: "var(--warning)", icon: "🔬", titulo: ex.tipo_exame, sub: ex.resultado })),
          ...anotacoes.map((an: any) => ({ tipo: "anotacao", data: an.criado_em, cor: "var(--text-muted)", icon: "📌", titulo: an.titulo ?? "Anotacao", sub: an.conteudo?.slice(0, 60) })),
        ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        return eventos.length === 0 ? (
          <div className="text-center py-16 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}><p className="text-4xl mb-3">🕐</p><p style={{ color: "var(--text-muted)" }}>Nenhum evento registrado</p></div>
        ) : (
          <div className="flex flex-col gap-0">
            {eventos.map((ev, i) => (
              <div key={i} className="flex gap-4 relative">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 z-10" style={{ background: ev.cor + "22", border: "2px solid " + ev.cor }}>{ev.icon}</div>
                  {i < eventos.length - 1 && <div className="w-0.5 flex-1 my-1" style={{ background: "var(--border-subtle)" }} />}
                </div>
                <div className="pb-5 flex-1 min-w-0">
                  <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{ev.titulo}</p>
                      <p className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>{new Date(ev.data).toLocaleDateString("pt-BR")}</p>
                    </div>
                    {ev.sub && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{ev.sub}</p>}
                    <span className="text-[10px] px-2 py-0.5 rounded-full mt-2 inline-block" style={{ background: ev.cor + "22", color: ev.cor }}>{ev.tipo}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {modalTermo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-3xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Assinar Termo</h2>
              <button onClick={() => setModalTermo(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <p className="text-sm mb-2" style={{ color: "var(--text-primary)" }}>Paciente: <strong>{dados?.paciente?.nome}</strong></p>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>Confirmar que o paciente assinou o termo de consentimento? Sera registrado data e hora.</p>
            <div className="flex gap-3">
              <button onClick={() => setModalTermo(false)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={assinarTermo} disabled={salvandoTermo} className="flex-1 py-3 rounded-2xl text-sm font-semibold transition hover:scale-105" style={{ background: "var(--success)", color: "white" }}>
                {salvandoTermo ? "Salvando..." : "Confirmar Assinatura"}
              </button>
            </div>
          </div>
        </div>
      )}


      {modalConsulta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Nova Consulta</h2>
              <button onClick={() => setModalConsulta(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Tipo</label>
                <div className="flex gap-2 flex-wrap">
                  {["consulta","procedimento","retorno","avaliacao"].map(t => (
                    <button key={t} onClick={() => setFormConsulta(f => ({ ...f, tipo: t }))}
                      className="px-3 py-1.5 rounded-xl text-xs capitalize"
                      style={{ background: formConsulta.tipo === t ? "var(--gold-bg)" : "var(--bg-input)", color: formConsulta.tipo === t ? "var(--gold)" : "var(--text-muted)" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Titulo</label>
                <input value={formConsulta.titulo} onChange={e => setFormConsulta(f => ({ ...f, titulo: e.target.value }))} className={inp} style={inpStyle} placeholder="Titulo..." />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Procedimento</label>
                <input value={formConsulta.procedimento_realizado} onChange={e => setFormConsulta(f => ({ ...f, procedimento_realizado: e.target.value }))} className={inp} style={inpStyle} placeholder="Ex: Botox..." />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Descricao</label>
                <textarea value={formConsulta.descricao} onChange={e => setFormConsulta(f => ({ ...f, descricao: e.target.value }))}
                  rows={4} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inpStyle} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalConsulta(false)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={() => salvarDados("consulta", formConsulta)} disabled={salvando} className="flex-1 py-3 rounded-2xl text-sm font-semibold" style={{ background: "var(--gold)", color: "#0a0707" }}>{salvando ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}

      {modalAnamnese && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-2xl rounded-3xl p-6 max-h-[92vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-1 sticky top-0 z-10 -mx-6 px-6 pb-3" style={{ background: "var(--bg-card)" }}>
              <h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Ficha de Anamnese</h2>
              <button onClick={() => setModalAnamnese(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>Marque Sim ou Não. A observação é opcional. Campos de alergia e contraindicação ficam destacados quando marcados.</p>

            {anamneseTemAlerta(formAnamnese.respostas) && (
              <div className="mb-4 rounded-2xl px-4 py-3 text-sm font-semibold"
                style={{ background: "rgba(232,122,122,0.12)", color: "#e87a7a", border: "1px solid #e87a7a" }}>
                ⚠ Atenção: paciente com alergia e/ou contraindicação marcada.
              </div>
            )}

            <div className="flex flex-col gap-6">
              {ANAMNESE_SECOES.map(secao => (
                <div key={secao.titulo}>
                  <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: "var(--gold)" }}>{secao.titulo}</p>
                  <div className="flex flex-col gap-2">
                    {secao.perguntas.map(p => {
                      const r = formAnamnese.respostas[p.key] ?? {};
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
                <textarea value={formAnamnese.observacoes_gerais}
                  onChange={e => setFormAnamnese(f => ({ ...f, observacoes_gerais: e.target.value }))}
                  rows={3} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inpStyle}
                  placeholder="Anote aqui qualquer observação adicional..." />
              </div>
            </div>

            <div className="flex gap-3 mt-6 sticky bottom-0 -mx-6 px-6 pt-3" style={{ background: "var(--bg-card)" }}>
              <button onClick={() => setModalAnamnese(false)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={() => salvarDados("anamnese", formAnamnese)} disabled={salvando} className="flex-1 py-3 rounded-2xl text-sm font-semibold" style={{ background: "var(--gold)", color: "#0a0707" }}>{salvando ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}

      {modalPrescricao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Nova Prescricao</h2>
              <button onClick={() => setModalPrescricao(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Medicamento</label>
                <input value={formPrescricao.medicamento} onChange={e => setFormPrescricao(f => ({ ...f, medicamento: e.target.value }))} className={inp} style={inpStyle} placeholder="Nome..." />
              </div>
              {[
                { label: "Dosagem", key: "dosagem", placeholder: "500mg" },
                { label: "Frequencia", key: "frequencia", placeholder: "2x dia" },
                { label: "Duracao", key: "duracao", placeholder: "7 dias" },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{field.label}</label>
                  <input value={(formPrescricao as any)[field.key]} onChange={e => setFormPrescricao(f => ({ ...f, [field.key]: e.target.value }))} className={inp} style={inpStyle} placeholder={field.placeholder} />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Observacoes</label>
                <textarea value={formPrescricao.observacoes} onChange={e => setFormPrescricao(f => ({ ...f, observacoes: e.target.value }))}
                  rows={3} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inpStyle} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalPrescricao(false)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={() => salvarDados("prescricao", formPrescricao)} disabled={salvando || !formPrescricao.medicamento}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                style={{ background: formPrescricao.medicamento ? "var(--gold)" : "var(--gold-bg)", color: "#0a0707" }}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalExame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Novo Exame</h2>
              <button onClick={() => setModalExame(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Tipo</label>
                <input value={formExame.tipo_exame} onChange={e => setFormExame(f => ({ ...f, tipo_exame: e.target.value }))} className={inp} style={inpStyle} placeholder="Ex: Hemograma..." />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Resultado</label>
                <textarea value={formExame.resultado} onChange={e => setFormExame(f => ({ ...f, resultado: e.target.value }))}
                  rows={4} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inpStyle} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Observacoes</label>
                <textarea value={formExame.observacoes} onChange={e => setFormExame(f => ({ ...f, observacoes: e.target.value }))}
                  rows={2} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inpStyle} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalExame(false)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={() => salvarDados("exame", formExame)} disabled={salvando || !formExame.tipo_exame}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                style={{ background: formExame.tipo_exame ? "var(--gold)" : "var(--gold-bg)", color: "#0a0707" }}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAnotacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Nova Anotacao</h2>
              <button onClick={() => setModalAnotacao(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {tiposAnotacao.map(t => (
                <button key={t.key} onClick={() => setFormAnotacao(f => ({ ...f, tipo: t.key }))}
                  className="px-3 py-1.5 rounded-xl text-xs"
                  style={{ background: formAnotacao.tipo === t.key ? "var(--gold-bg)" : "var(--bg-input)", color: t.cor }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <input type="text" placeholder="Titulo" value={formAnotacao.titulo}
                onChange={e => setFormAnotacao(f => ({ ...f, titulo: e.target.value }))} className={inp} style={inpStyle} />
              <textarea placeholder="Anotacao..." value={formAnotacao.conteudo}
                onChange={e => setFormAnotacao(f => ({ ...f, conteudo: e.target.value }))}
                rows={5} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inpStyle} />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalAnotacao(false)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={() => salvarDados("anotacao", formAnotacao)} disabled={salvando || !formAnotacao.conteudo.trim()}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                style={{ background: formAnotacao.conteudo.trim() ? "var(--gold)" : "var(--gold-bg)", color: "#0a0707" }}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAtestado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Emitir Atestado</h2>
              <button onClick={() => setModalAtestado(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="flex flex-col gap-4">
              <div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Paciente</label><p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{dados?.paciente?.nome}</p></div>
              <div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Finalidade</label><div className="flex gap-2 flex-wrap">{[{ key: "repouso", label: "Repouso" }, { key: "comparecimento", label: "Comparecimento" }, { key: "livre", label: "Texto Livre" }].map(f => (<button key={f.key} onClick={() => setFormAtestado(fa => ({ ...fa, finalidade: f.key }))} className="px-3 py-1.5 rounded-xl text-xs transition" style={{ background: formAtestado.finalidade === f.key ? "var(--gold)" : "var(--bg-input)", color: formAtestado.finalidade === f.key ? "#0a0707" : "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>{f.label}</button>))}</div></div>
              {formAtestado.finalidade === "repouso" && <div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Dias de Repouso</label><input type="number" min="1" value={formAtestado.dias} onChange={e => setFormAtestado(f => ({ ...f, dias: e.target.value }))} className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} /></div>}
              <div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>CID (opcional)</label><input type="text" value={formAtestado.cid} onChange={e => setFormAtestado(f => ({ ...f, cid: e.target.value }))} placeholder="Ex: Z41.1" className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{formAtestado.finalidade === "livre" ? "Texto do Atestado" : "Observacoes (opcional)"}</label><textarea value={formAtestado.observacoes} onChange={e => setFormAtestado(f => ({ ...f, observacoes: e.target.value }))} rows={4} placeholder={formAtestado.finalidade === "livre" ? "Digite o texto completo..." : "Informacoes adicionais..."} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalAtestado(false)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={gerarAtestado} className="flex-1 py-3 rounded-2xl text-sm font-semibold transition hover:scale-105" style={{ background: "var(--success)", color: "white" }}>Gerar e Imprimir</button>
            </div>
          </div>
        </div>
      )}
      {modalSaude && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--gold)" }}>Editar Saude</h2>
              <button onClick={() => setModalSaude(false)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 flex-wrap">
                {[{ label: "Fumante", key: "fumante" }, { label: "Gravida", key: "gravida" }, { label: "Amamentando", key: "amamentando" }].map(item => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formSaude[item.key] ?? false}
                      onChange={e => setFormSaude((f: any) => ({ ...f, [item.key]: e.target.checked }))}
                      className="w-4 h-4 rounded" />
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>{item.label}</span>
                  </label>
                ))}
              </div>
              {[
                { label: "Alergias", key: "alergias" },
                { label: "Contraindicacoes", key: "contraindicacoes" },
                { label: "Medicamentos", key: "medicamentos" },
                { label: "Historico Medico", key: "historico_medico" },
                { label: "Observacoes", key: "observacoes" },
              ].map(item => (
                <div key={item.key}>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{item.label}</label>
                  <textarea value={formSaude[item.key] ?? ""} onChange={e => setFormSaude((f: any) => ({ ...f, [item.key]: e.target.value }))}
                    rows={2} className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none" style={inpStyle} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalSaude(false)} className="flex-1 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>Cancelar</button>
              <button onClick={() => salvarDados("atualizar_paciente", formSaude)} disabled={salvando}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold" style={{ background: "var(--gold)", color: "#0a0707" }}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
 {modalVerAtendimento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setModalVerAtendimento(null)}>
          <div className="w-full max-w-lg rounded-3xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>
                  {modalVerAtendimento.tipo ?? "Atendimento"}
                </p>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {modalVerAtendimento.titulo ?? modalVerAtendimento.procedimento_realizado ?? "Detalhes"}
                </h2>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {new Date(modalVerAtendimento.criado_em).toLocaleDateString("pt-BR", {
                    day: "2-digit", month: "long", year: "numeric"
                  })} · {modalVerAtendimento.funcionarios?.nome ?? ""}
                </p>
              </div>
              <button onClick={() => setModalVerAtendimento(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto flex flex-col gap-4">
              {[
                { key: "descricao",              label: "Descrição" },
                { key: "procedimento_realizado", label: "Procedimento realizado" },
                { key: "evolucao",               label: "Evolução" },
                { key: "observacoes",            label: "Observações" },
                { key: "queixa_principal",       label: "Queixa principal" },
                { key: "historia_doenca",        label: "História da doença" },
                { key: "antecedentes",           label: "Antecedentes" },
                { key: "habitos",                label: "Hábitos" },
                { key: "medicamento",            label: "Medicamento" },
                { key: "dosagem",                label: "Dosagem" },
                { key: "frequencia",             label: "Frequência" },
                { key: "duracao",                label: "Duração" },
                { key: "tipo_exame",             label: "Tipo de exame" },
                { key: "resultado",              label: "Resultado" },
                { key: "conteudo",               label: "Conteúdo" },
              ]
                .filter(f => modalVerAtendimento[f.key])
                .map(f => (
                  <div key={f.key} className="rounded-2xl px-4 py-3"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                      {f.label}
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
                      {String(modalVerAtendimento[f.key])}
                    </p>
                  </div>
                ))}
            </div>
            <div className="px-6 py-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <button onClick={() => setModalVerAtendimento(null)}
                className="w-full py-3 rounded-2xl text-sm uppercase tracking-widest"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {modalVerAtendimento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setModalVerAtendimento(null)}>
          <div className="w-full max-w-lg rounded-3xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>
                  {modalVerAtendimento.tipo ?? "Atendimento"}
                </p>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {modalVerAtendimento.titulo ?? modalVerAtendimento.procedimento_realizado ?? "Detalhes"}
                </h2>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {new Date(modalVerAtendimento.criado_em).toLocaleDateString("pt-BR", {
                    day: "2-digit", month: "long", year: "numeric"
                  })} · {modalVerAtendimento.funcionarios?.nome ?? ""}
                </p>
              </div>
              <button onClick={() => setModalVerAtendimento(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>✕</button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto flex flex-col gap-4">
              {[
                { key: "descricao",              label: "Descrição" },
                { key: "procedimento_realizado", label: "Procedimento realizado" },
                { key: "evolucao",               label: "Evolução" },
                { key: "observacoes",            label: "Observações" },
                { key: "queixa_principal",       label: "Queixa principal" },
                { key: "historia_doenca",        label: "História da doença" },
                { key: "antecedentes",           label: "Antecedentes" },
                { key: "habitos",                label: "Hábitos" },
                { key: "medicamento",            label: "Medicamento" },
                { key: "dosagem",                label: "Dosagem" },
                { key: "frequencia",             label: "Frequência" },
                { key: "duracao",                label: "Duração" },
                { key: "tipo_exame",             label: "Tipo de exame" },
                { key: "resultado",              label: "Resultado" },
                { key: "conteudo",               label: "Conteúdo" },
              ]
                .filter(f => modalVerAtendimento[f.key])
                .map(f => (
                  <div key={f.key} className="rounded-2xl px-4 py-3"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                      {f.label}
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
                      {String(modalVerAtendimento[f.key])}
                    </p>
                  </div>
                ))}
            </div>
            <div className="px-6 py-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <button onClick={() => setModalVerAtendimento(null)}
                className="w-full py-3 rounded-2xl text-sm uppercase tracking-widest"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}