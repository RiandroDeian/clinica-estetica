const fs = require('fs');
const path = 'app/admin/crm/page.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Adicionar estados
c = c.replace(
  '  const [salvandoTarefa, setSalvandoTarefa] = useState(false);',
  '  const [salvandoTarefa, setSalvandoTarefa] = useState(false);\n  const [modalIntegracao, setModalIntegracao] = useState<Lead | null>(null);\n  const [salvandoIntegracao, setSalvandoIntegracao] = useState(false);\n  const [ordenacao, setOrdenacao] = useState<"recente"|"nome"|"interacao">("recente");\n  const [notaRapida, setNotaRapida] = useState<{ lead: Lead; texto: string } | null>(null);\n  const [salvandoNota, setSalvandoNota] = useState(false);'
);

// 2. Adicionar funcoes antes de handleDrop
c = c.replace(
  '  function handleDrop(',
  `  function exportarCSV() {
    const header = ["Nome","Telefone","Procedimento","Responsavel","Coluna","Etiquetas","Criado em"];
    const rows = leads.map(l => [l.nome, l.telefone ?? "", l.procedimento_interesse ?? "", l.funcionarios?.nome ?? "", colunas.find(col => col.id === l.coluna_id)?.nome ?? "", (l.etiquetas ?? []).join(";"), new Date(l.criado_em).toLocaleDateString("pt-BR")]);
    const csv = [header, ...rows].map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\\n");
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

  function handleDrop(`
);

// 3. Adicionar botoes no header
c = c.replace(
  '          <button onClick={() => { setNovaColuna(true); setModalColuna(null); setFormColuna({ nome: "", cor: "#c8a078" }); }}',
  '          <button onClick={exportarCSV} className="px-4 py-2.5 rounded-2xl text-xs uppercase tracking-widest transition hover:scale-105" style={{ border: "1px solid var(--border-color)", color: "var(--success)" }}>↓ CSV</button>\n          <button onClick={() => { setNovaColuna(true); setModalColuna(null); setFormColuna({ nome: "", cor: "#c8a078" }); }}'
);

// 4. Adicionar select ordenacao nos filtros
c = c.replace(
  '              {ETIQUETAS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}\n            </select>\n          </div>',
  '              {ETIQUETAS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}\n            </select>\n            <select value={ordenacao} onChange={e => setOrdenacao(e.target.value as any)} className="rounded-2xl px-4 py-2.5 text-sm outline-none" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>\n              <option value="recente">Mais recentes</option>\n              <option value="nome">Nome A-Z</option>\n              <option value="interacao">Ultima interacao</option>\n            </select>\n          </div>'
);

// 5. Usar leadsFiltradosOrdenados nas colunas
c = c.replace(
  'leads={leadsFiltrados.filter(l => l.coluna_id === coluna.id)}',
  'leads={leadsFiltradosOrdenados(leads).filter(l => l.coluna_id === coluna.id)}'
);

// 6. Adicionar onNotaRapida nas colunas
c = c.replace(
  '                    onEditColuna={c => { setModalColuna(c); setFormColuna({ nome: c.nome, cor: c.cor }); }}',
  '                    onNotaRapida={(lead) => setNotaRapida({ lead, texto: lead.observacoes ?? "" })}\n                    onEditColuna={c => { setModalColuna(c); setFormColuna({ nome: c.nome, cor: c.cor }); }}'
);

// 7. Adicionar botao + Paciente e nota rapida no modal lead
c = c.replace(
  '                  {modalLead.lead && (\n                    <button onClick={() => deletarLead(modalLead.lead!.id)}',
  '                  {modalLead.lead && (\n                    <>\n                    <button onClick={() => setModalIntegracao(modalLead.lead!)} className="px-4 py-3 rounded-2xl text-sm transition hover:scale-105" style={{ background: "rgba(122,232,160,0.1)", color: "var(--success)" }}>+ Paciente</button>\n                    <button onClick={() => deletarLead(modalLead.lead!.id)}'
);
c = c.replace(
  '                      Excluir\n                    </button>\n                  )}',
  '                      Excluir\n                    </button>\n                    </>\n                  )}'
);

// 8. Adicionar campo meta e modal integracao + nota rapida no final antes do style
c = c.replace(
  '      <style>{`select option { background: var(--bg-card); } input::placeholder, textarea::placeholder { color: var(--text-muted); }`}</style>',
  `      {modalIntegracao && (
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
      <style>{\`select option { background: var(--bg-card); } input::placeholder, textarea::placeholder { color: var(--text-muted); }\`}</style>`
);

fs.writeFileSync(path, c, 'utf8');
console.log('OK:', c.split('\\n').length, 'linhas');
