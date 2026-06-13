const fs = require('fs');
const path = 'app/admin/prontuario/page.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Adicionar aba linha do tempo e estados
c = c.replace(
  '  const [uploadando, setUploadando] = useState(false);',
  `  const [uploadando, setUploadando] = useState(false);
  const [modalTermo, setModalTermo] = useState(false);
  const [salvandoTermo, setSalvandoTermo] = useState(false);`
);

// 2. Adicionar aba linha do tempo
c = c.replace(
  '    { key: "fotos", label: "Fotos (" + fotos.length + ")" },',
  `    { key: "fotos", label: "Fotos (" + fotos.length + ")" },
    { key: "timeline", label: "Linha do Tempo" },`
);

// 3. Adicionar funcao assinar termo e gerar PDF antes do if (!paciente_id)
c = c.replace(
  '  if (!paciente_id) {',
  `  async function assinarTermo() {
    setSalvandoTermo(true);
    await fetch("/api/prontuario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "atualizar_paciente", paciente_id, assinou_termo: true }) });
    setSalvandoTermo(false);
    setModalTermo(false);
    buscarProntuario();
  }

  function gerarPDF() {
    const p2: any = dados?.paciente ?? {};
    const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const secsHtml = [
      consultas.length > 0 ? '<h3 style="color:#c8a078;font-size:13px;letter-spacing:4px;text-transform:uppercase;margin:20px 0 8px">Consultas</h3>' + consultas.map((c: any) => '<div style="border-left:3px solid #c8a078;padding:8px 12px;margin-bottom:8px;background:#f9f9f9"><p style="margin:0;font-size:13px;font-weight:bold">' + c.tipo + (c.titulo ? ' — ' + c.titulo : '') + '</p>' + (c.procedimento_realizado ? '<p style="margin:4px 0 0;font-size:12px;color:#666">Procedimento: ' + c.procedimento_realizado + '</p>' : '') + (c.descricao ? '<p style="margin:4px 0 0;font-size:12px;color:#555">' + c.descricao + '</p>' : '') + '<p style="margin:4px 0 0;font-size:11px;color:#999">' + new Date(c.criado_em).toLocaleDateString("pt-BR") + '</p></div>').join('') : '',
      anamneses.length > 0 ? '<h3 style="color:#c8a078;font-size:13px;letter-spacing:4px;text-transform:uppercase;margin:20px 0 8px">Anamneses</h3>' + anamneses.map((a: any) => '<div style="border-left:3px solid #7aa6e8;padding:8px 12px;margin-bottom:8px;background:#f9f9f9">' + (a.queixa_principal ? '<p style="margin:0;font-size:12px"><b>Queixa:</b> ' + a.queixa_principal + '</p>' : '') + (a.antecedentes ? '<p style="margin:4px 0 0;font-size:12px"><b>Antecedentes:</b> ' + a.antecedentes + '</p>' : '') + '<p style="margin:4px 0 0;font-size:11px;color:#999">' + new Date(a.criado_em).toLocaleDateString("pt-BR") + '</p></div>').join('') : '',
      prescricoes.length > 0 ? '<h3 style="color:#c8a078;font-size:13px;letter-spacing:4px;text-transform:uppercase;margin:20px 0 8px">Prescricoes</h3>' + prescricoes.map((pr: any) => '<div style="border-left:3px solid #7ae8a0;padding:8px 12px;margin-bottom:8px;background:#f9f9f9"><p style="margin:0;font-size:13px;font-weight:bold">' + pr.medicamento + '</p><p style="margin:4px 0 0;font-size:12px;color:#666">' + [pr.dosagem && 'Dose: ' + pr.dosagem, pr.frequencia && 'Freq: ' + pr.frequencia, pr.duracao && 'Dur: ' + pr.duracao].filter(Boolean).join(' · ') + '</p></div>').join('') : '',
    ].filter(Boolean).join('');
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Prontuario - ' + p2.nome + '</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;color:#1a1a1a}.logo{text-align:center;margin-bottom:30px}.logo h1{font-size:22px;letter-spacing:8px;color:#c8a078;margin:0}.logo p{font-size:10px;letter-spacing:4px;color:#888;margin:4px 0 0}h2{font-size:14px;letter-spacing:6px;text-transform:uppercase;border-top:1px solid #ddd;border-bottom:1px solid #ddd;padding:8px 0;margin:20px 0}table{width:100%;border-collapse:collapse;margin:12px 0}td{padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}td:first-child{color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;width:35%}.alerta{background:rgba(232,122,122,0.08);border:1px solid rgba(232,122,122,0.3);padding:10px 14px;border-radius:8px;margin:12px 0;font-size:12px;color:#c0392b}.cidade{text-align:right;font-size:11px;color:#888;margin-top:30px}</style></head><body>' +
      '<div class="logo"><h1>MONCIE</h1><p>ESTHETIQUE</p></div>' +
      '<h2>Prontuario do Paciente</h2>' +
      '<table><tr><td>Nome</td><td><strong>' + p2.nome + '</strong></td></tr>' +
      (p2.data_nascimento ? '<tr><td>Nascimento</td><td>' + new Date(p2.data_nascimento + 'T12:00:00').toLocaleDateString("pt-BR") + '</td></tr>' : '') +
      (p2.telefone ? '<tr><td>Telefone</td><td>' + p2.telefone + '</td></tr>' : '') +
      (p2.tipo_sanguineo && p2.tipo_sanguineo !== 'Nao informado' ? '<tr><td>Tipo Sanguineo</td><td>' + p2.tipo_sanguineo + '</td></tr>' : '') +
      '</table>' +
      (p2.alergias ? '<div class="alerta">⚠ Alergias: ' + p2.alergias + '</div>' : '') +
      (p2.contraindicacoes ? '<div class="alerta">⚠ Contraindicacoes: ' + p2.contraindicacoes + '</div>' : '') +
      (p2.medicamentos ? '<div class="alerta">💊 Medicamentos em uso: ' + p2.medicamentos + '</div>' : '') +
      secsHtml +
      '<div class="cidade">Planaltina, Brasilia — ' + hoje + '</div>' +
      '</body></html>';
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  }

  if (!paciente_id) {`
);

// 4. Adicionar botoes PDF e Termo no header do prontuario
c = c.replace(
  '      <button onClick={() => router.push("/admin/prontuario")}',
  `      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={() => router.push("/admin/prontuario")}`
);
c = c.replace(
  '        style={{ color: "var(--text-muted)" }}>\\n        ← Prontuarios\\n      </button>',
  `        style={{ color: "var(--text-muted)" }}>
          ← Prontuarios
        </button>
        {dados?.paciente && (
          <>
            <button onClick={gerarPDF} className="text-xs px-3 py-1.5 rounded-xl transition hover:scale-105" style={{ background: "var(--gold-bg)", color: "var(--gold)", border: "1px solid var(--border-color)" }}>📄 Exportar PDF</button>
            {!dados?.paciente?.assinou_termo && <button onClick={() => setModalTermo(true)} className="text-xs px-3 py-1.5 rounded-xl transition hover:scale-105" style={{ background: "rgba(122,232,160,0.1)", color: "var(--success)", border: "1px solid rgba(122,232,160,0.2)" }}>✍ Assinar Termo</button>}
            {dados?.paciente?.assinou_termo && <span className="text-xs px-3 py-1.5 rounded-xl" style={{ background: "rgba(122,232,160,0.1)", color: "var(--success)" }}>✓ Termo assinado</span>}
          </>
        )}
      </div>`
);

fs.writeFileSync(path, c, 'utf8');
console.log('OK:', c.split('\\n').length, 'linhas');
