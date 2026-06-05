"use client";

import { useEffect, useState, useCallback } from "react";

type Paciente = {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
  sexo?: string;
  data_nascimento?: string;
  alergias?: string;
  contraindicacoes?: string;
  observacoes?: string;
  assinou_termo: boolean;
  criado_em: string;
};

const filtrosOpcoes = [
  { key: "todos", label: "Todos" },
  { key: "sem_termo", label: "Sem Termo" },
  { key: "aniversario", label: "🎂 Aniversário Hoje" },
];

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [editando, setEditando] = useState<Paciente | null>(null);
  const [painelPaciente, setPainelPaciente] = useState<Paciente | null>(null);

  const [form, setForm] = useState({
    nome: "", telefone: "", email: "", cpf: "", sexo: "",
    data_nascimento: "", alergias: "", contraindicacoes: "",
    observacoes: "", assinou_termo: false,
  });

  const buscarPacientes = useCallback(async () => {
    setCarregando(true);
    const res = await fetch(`/api/pacientes?busca=${encodeURIComponent(busca)}`);
    const data = await res.json();
    setPacientes(Array.isArray(data) ? data : []);
    setCarregando(false);
  }, [busca]);

  useEffect(() => {
    const timer = setTimeout(buscarPacientes, 300);
    return () => clearTimeout(timer);
  }, [buscarPacientes]);

  function calcularIdade(data?: string) {
    if (!data) return null;
    const hoje = new Date();
    const nasc = new Date(data + "T12:00:00");
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  }

  function ehAniversario(data?: string) {
    if (!data) return false;
    const hoje = new Date();
    const nasc = new Date(data + "T12:00:00");
    return hoje.getMonth() === nasc.getMonth() && hoje.getDate() === nasc.getDate();
  }

  const pacientesFiltrados = pacientes.filter(p => {
    if (filtro === "sem_termo") return !p.assinou_termo;
    if (filtro === "aniversario") return ehAniversario(p.data_nascimento);
    return true;
  });

  // KPIs
  const total = pacientes.length;
  const semTermo = pacientes.filter(p => !p.assinou_termo).length;
  const aniversariantes = pacientes.filter(p => ehAniversario(p.data_nascimento)).length;

  function abrirNovo() {
    setEditando(null);
    setForm({ nome:"", telefone:"", email:"", cpf:"", sexo:"", data_nascimento:"", alergias:"", contraindicacoes:"", observacoes:"", assinou_termo: false });
    setModalAberto(true);
  }

  function abrirEdicao(p: Paciente, e: React.MouseEvent) {
    e.stopPropagation();
    setEditando(p);
    setForm({
      nome: p.nome, telefone: p.telefone, email: p.email ?? "",
      cpf: p.cpf ?? "", sexo: p.sexo ?? "", data_nascimento: p.data_nascimento ?? "",
      alergias: p.alergias ?? "", contraindicacoes: p.contraindicacoes ?? "",
      observacoes: p.observacoes ?? "", assinou_termo: p.assinou_termo,
    });
    setModalAberto(true);
  }

  async function salvarPaciente() {
    setSalvando(true);
    const method = editando ? "PATCH" : "POST";
    const url = editando ? `/api/pacientes/${editando.id}` : "/api/pacientes";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setModalAberto(false);
      setEditando(null);
      buscarPacientes();
    }
    setSalvando(false);
  }

  async function excluirPaciente(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita.")) return;
    setExcluindo(true);
    await fetch(`/api/pacientes/${id}`, { method: "DELETE" });
    setExcluindo(false);
    if (painelPaciente?.id === id) setPainelPaciente(null);
    buscarPacientes();
  }

  const inp = "w-full rounded-2xl px-4 py-3 text-sm outline-none";
  const inpStyle = { background: "#0e0a0a", border: "1px solid rgba(200,160,120,0.15)", color: "#f5e8dc" };

  return (
    <div className="flex gap-6 h-full">
      {/* COLUNA PRINCIPAL */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>Gestão</p>
            <h1 className="text-3xl font-bold" style={{ color: "#f5e8dc" }}>Pacientes</h1>
          </div>
          <button onClick={abrirNovo}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold uppercase tracking-widest transition hover:scale-105"
            style={{ background: "#c8a078", color: "#0f0b0b" }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
            Novo Paciente
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total", valor: total, cor: "#c8a078" },
            { label: "Sem Termo", valor: semTermo, cor: "#e87a7a" },
            { label: "Aniversário Hoje", valor: aniversariantes, cor: "#e8c97a" },
          ].map(k => (
            <div key={k.label} className="rounded-2xl px-5 py-4 cursor-pointer transition hover:scale-[1.02]"
              style={{ background: "#161111", border: "1px solid rgba(200,160,120,0.1)" }}
              onClick={() => setFiltro(k.label === "Total" ? "todos" : k.label === "Sem Termo" ? "sem_termo" : "aniversario")}>
              <p className="text-2xl font-bold" style={{ color: k.cor }}>{k.valor}</p>
              <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "#6b5a4e" }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* BUSCA + FILTROS */}
        <div className="mb-5 flex flex-col gap-3">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" stroke="currentColor" strokeWidth={1.5} style={{ color: "#6b5a4e" }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
            </svg>
            <input type="text" placeholder="Buscar por nome, telefone ou CPF..." value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-2xl pl-11 pr-5 py-4 text-sm outline-none"
              style={{ background: "#161111", border: "1px solid rgba(200,160,120,0.15)", color: "#f5e8dc" }} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filtrosOpcoes.map(f => (
              <button key={f.key} onClick={() => setFiltro(f.key)}
                className="px-4 py-1.5 rounded-full text-xs transition"
                style={{ background: filtro === f.key ? "rgba(200,160,120,0.15)" : "transparent", color: filtro === f.key ? "#c8a078" : "#6b5a4e", border: `1px solid ${filtro === f.key ? "rgba(200,160,120,0.3)" : "rgba(200,160,120,0.1)"}` }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "#c8a078" }} />
          </div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="text-center py-20 rounded-3xl" style={{ background: "#161111", border: "1px solid rgba(200,160,120,0.1)" }}>
            <p className="text-4xl mb-4">🌸</p>
            <p className="text-lg font-semibold mb-2" style={{ color: "#c8a078" }}>Nenhum paciente encontrado</p>
            <p className="text-sm" style={{ color: "#6b5a4e" }}>Cadastre o primeiro paciente clicando em Novo Paciente</p>
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden" style={{ background: "#161111", border: "1px solid rgba(200,160,120,0.12)" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(200,160,120,0.1)" }}>
                    {["Nome", "Telefone", "Idade", "Termo", "Cadastro", ""].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pacientesFiltrados.map((p, i) => {
                    const idade = calcularIdade(p.data_nascimento);
                    const aniv = ehAniversario(p.data_nascimento);
                    return (
                      <tr key={p.id}
                        className="transition hover:bg-[rgba(200,160,120,0.04)] cursor-pointer"
                        style={{ borderBottom: i < pacientesFiltrados.length - 1 ? "1px solid rgba(200,160,120,0.06)" : "none" }}
                        onClick={() => setPainelPaciente(p)}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: "rgba(200,160,120,0.12)", color: "#c8a078" }}>
                              {p.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium" style={{ color: "#f5e8dc" }}>{p.nome}</span>
                                {aniv && <span className="text-xs">🎂</span>}
                                {!p.assinou_termo && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(232,122,122,0.1)", color: "#e87a7a" }}>⚠ Termo</span>}
                              </div>
                              {p.email && <p className="text-xs mt-0.5" style={{ color: "#6b5a4e" }}>{p.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm" style={{ color: "#a89080" }}>{p.telefone}</td>
                        <td className="px-5 py-4 text-sm font-medium" style={{ color: "#c8a078" }}>
                          {idade !== null ? `${idade} anos` : "-"}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs px-2 py-1 rounded-full"
                            style={{ background: p.assinou_termo ? "rgba(122,232,160,0.1)" : "rgba(232,122,122,0.1)", color: p.assinou_termo ? "#7ae8a0" : "#e87a7a" }}>
                            {p.assinou_termo ? "✓ Sim" : "Não"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm" style={{ color: "#6b5a4e" }}>
                          {new Date(p.criado_em).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={(e) => abrirEdicao(p, e)}
                              className="p-1.5 rounded-lg transition hover:opacity-70"
                              style={{ background: "rgba(200,160,120,0.1)" }} title="Editar">
                              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#c8a078" strokeWidth={1.5}>
                                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <button onClick={(e) => excluirPaciente(p.id, e)} disabled={excluindo}
                              className="p-1.5 rounded-lg transition hover:opacity-70"
                              style={{ background: "rgba(232,122,122,0.1)" }} title="Excluir">
                              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#e87a7a" strokeWidth={1.5}>
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* PAINEL LATERAL */}
      {painelPaciente && (
        <div className="w-80 flex-shrink-0 rounded-3xl overflow-hidden flex flex-col"
          style={{ background: "#161111", border: "1px solid rgba(200,160,120,0.2)" }}>
          <div className="px-6 py-5 flex items-center gap-4" style={{ borderBottom: "1px solid rgba(200,160,120,0.1)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{ background: "rgba(200,160,120,0.12)", color: "#c8a078" }}>
              {painelPaciente.nome.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate" style={{ color: "#f5e8dc" }}>{painelPaciente.nome}</p>
              <p className="text-xs mt-0.5" style={{ color: "#6b5a4e" }}>
                {calcularIdade(painelPaciente.data_nascimento) !== null ? `${calcularIdade(painelPaciente.data_nascimento)} anos` : "Idade não informada"}
              </p>
            </div>
            <button onClick={() => setPainelPaciente(null)} style={{ color: "#6b5a4e" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {[
              { label: "Telefone", valor: painelPaciente.telefone },
              { label: "Email", valor: painelPaciente.email || "-" },
              { label: "CPF", valor: painelPaciente.cpf || "-" },
              { label: "Sexo", valor: painelPaciente.sexo || "-" },
              { label: "Nascimento", valor: painelPaciente.data_nascimento ? new Date(painelPaciente.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "-" },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2"
                style={{ borderBottom: "1px solid rgba(200,160,120,0.06)" }}>
                <span className="text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>{item.label}</span>
                <span className="text-sm" style={{ color: "#e8d5c0" }}>{item.valor}</span>
              </div>
            ))}

            {painelPaciente.alergias && (
              <div className="px-4 py-3 rounded-2xl"
                style={{ background: "rgba(232,122,122,0.08)", border: "1px solid rgba(232,122,122,0.2)" }}>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#e87a7a" }}>⚠ Alergias</p>
                <p className="text-sm" style={{ color: "#e8d5c0" }}>{painelPaciente.alergias}</p>
              </div>
            )}

            {painelPaciente.contraindicacoes && (
              <div className="px-4 py-3 rounded-2xl"
                style={{ background: "rgba(232,201,122,0.08)", border: "1px solid rgba(232,201,122,0.2)" }}>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#e8c97a" }}>⚠ Contraindicações</p>
                <p className="text-sm" style={{ color: "#e8d5c0" }}>{painelPaciente.contraindicacoes}</p>
              </div>
            )}

            {painelPaciente.observacoes && (
              <div className="px-4 py-3 rounded-2xl"
                style={{ background: "rgba(200,160,120,0.06)", border: "1px solid rgba(200,160,120,0.15)" }}>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#c8a078" }}>Observações</p>
                <p className="text-sm" style={{ color: "#a89080" }}>{painelPaciente.observacoes}</p>
              </div>
            )}

            <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(200,160,120,0.06)" }}>
              <span className="text-xs uppercase tracking-widest" style={{ color: "#6b5a4e" }}>Termo</span>
              <span className="text-xs px-2 py-1 rounded-full"
                style={{ background: painelPaciente.assinou_termo ? "rgba(122,232,160,0.1)" : "rgba(232,122,122,0.1)", color: painelPaciente.assinou_termo ? "#7ae8a0" : "#e87a7a" }}>
                {painelPaciente.assinou_termo ? "✓ Assinado" : "Pendente"}
              </span>
            </div>
          </div>

          {/* Ações */}
          <div className="p-4 flex flex-col gap-2" style={{ borderTop: "1px solid rgba(200,160,120,0.1)" }}>
            <a href={`https://wa.me/55${painelPaciente.telefone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
              className="w-full py-2.5 rounded-2xl text-sm font-medium text-center transition hover:scale-105"
              style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>
              💬 WhatsApp
            </a>
            <button onClick={(e) => { setPainelPaciente(null); abrirEdicao(painelPaciente, e as any); }}
              className="w-full py-2.5 rounded-2xl text-sm font-medium transition hover:scale-105"
              style={{ background: "rgba(200,160,120,0.1)", color: "#c8a078", border: "1px solid rgba(200,160,120,0.2)" }}>
              ✏️ Editar
            </button>
            <button onClick={(e) => excluirPaciente(painelPaciente.id, e as any)}
              className="w-full py-2.5 rounded-2xl text-sm font-medium transition hover:scale-105"
              style={{ background: "rgba(232,122,122,0.08)", color: "#e87a7a", border: "1px solid rgba(232,122,122,0.2)" }}>
              🗑 Excluir
            </button>
          </div>
        </div>
      )}

      {/* MODAL NOVO/EDITAR */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
            style={{ background: "#161111", border: "1px solid rgba(200,160,120,0.2)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: "#c8a078" }}>{editando ? "Editar Paciente" : "Novo Paciente"}</h2>
              <button onClick={() => setModalAberto(false)} style={{ color: "#6b5a4e" }} className="transition hover:opacity-70">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Nome completo*", key: "nome", type: "text", col: 2 },
                { label: "Telefone*", key: "telefone", type: "tel", col: 1 },
                { label: "Email", key: "email", type: "email", col: 1 },
                { label: "CPF", key: "cpf", type: "text", col: 1 },
                { label: "Data de nascimento", key: "data_nascimento", type: "date", col: 1 },
                { label: "Alergias", key: "alergias", type: "text", col: 2 },
                { label: "Contraindicações", key: "contraindicacoes", type: "text", col: 2 },
                { label: "Observações", key: "observacoes", type: "text", col: 2 },
              ].map(field => (
                <div key={field.key} className={field.col === 2 ? "sm:col-span-2" : ""}>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>{field.label}</label>
                  <input type={field.type} value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className={inp} style={{ ...inpStyle, colorScheme: field.type === "date" ? "dark" : undefined }} />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "#a89080" }}>Sexo</label>
                <div className="flex gap-2">
                  {["Feminino","Masculino","Outro"].map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, sexo: s }))}
                      className="px-4 py-2 rounded-xl text-sm transition"
                      style={{ background: form.sexo === s ? "rgba(200,160,120,0.15)" : "transparent", color: form.sexo === s ? "#c8a078" : "#6b5a4e", border: `1px solid ${form.sexo === s ? "rgba(200,160,120,0.3)" : "rgba(200,160,120,0.1)"}` }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2 flex items-center gap-3">
                <button type="button" onClick={() => setForm(f => ({ ...f, assinou_termo: !f.assinou_termo }))}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition"
                  style={{ background: form.assinou_termo ? "#c8a078" : "transparent", border: "1px solid rgba(200,160,120,0.4)" }}>
                  {form.assinou_termo && <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#0f0b0b" strokeWidth={2.5}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
                <span className="text-sm" style={{ color: "#a89080" }}>Assinou o termo de consentimento</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest transition hover:opacity-70"
                style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#6b5a4e" }}>Cancelar</button>
              <button onClick={salvarPaciente} disabled={salvando || !form.nome || !form.telefone}
                className="flex-1 py-3 rounded-2xl text-sm uppercase tracking-widest font-semibold transition hover:scale-105"
                style={{ background: salvando || !form.nome || !form.telefone ? "rgba(200,160,120,0.4)" : "#c8a078", color: "#0f0b0b" }}>
                {salvando ? "Salvando..." : editando ? "Salvar Alterações" : "Salvar Paciente"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`input::placeholder { color: #3a2e28; } select option { background: #161111; }`}</style>
    </div>
  );
}
