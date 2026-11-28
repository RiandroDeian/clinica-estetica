"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type PacienteHist = { paciente_id: string | null; nome: string; qtd: number; datas: string[]; ultima: string | null };
type ProcHist = { procedimento: string; cor: string; totalPacientes: number; totalAtendimentos: number; pacientes: PacienteHist[] };

const fmtData = (s: string) => new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

export default function HistoricoPage() {
  const router = useRouter();
  const [dados, setDados] = useState<ProcHist[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    fetch("/api/historico-procedimentos").then(r => r.json()).then(d => { setDados(Array.isArray(d) ? d : []); setCarregando(false); });
  }, []);

  const filtrado = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return dados;
    return dados
      .map(proc => {
        const procMatch = proc.procedimento.toLowerCase().includes(q);
        const pacientes = procMatch ? proc.pacientes : proc.pacientes.filter(p => p.nome.toLowerCase().includes(q));
        return { ...proc, pacientes };
      })
      .filter(proc => proc.pacientes.length > 0);
  }, [dados, busca]);

  const totalPacientesUnicos = useMemo(() => {
    const ids = new Set<string>();
    for (const p of dados) for (const pac of p.pacientes) ids.add(pac.paciente_id || pac.nome);
    return ids.size;
  }, [dados]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gold)" }}>Histórico por Procedimento</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Cada procedimento com os pacientes que já fizeram e as datas. Quem fez vários aparece em cada um.</p>
        </div>
        <div className="flex gap-4 text-sm" style={{ color: "var(--text-muted)" }}>
          <span><strong style={{ color: "var(--text-primary)" }}>{dados.length}</strong> procedimentos</span>
          <span><strong style={{ color: "var(--text-primary)" }}>{totalPacientesUnicos}</strong> pacientes</span>
        </div>
      </div>

      <input
        value={busca}
        onChange={e => setBusca(e.target.value)}
        placeholder="Buscar por paciente ou procedimento..."
        className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
        style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
      />

      {carregando ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(200,160,120,0.2)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : filtrado.length === 0 ? (
        <div className="text-center py-20 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <p className="text-4xl mb-3">🗂️</p>
          <p style={{ color: "var(--text-muted)" }}>Nenhum histórico encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          {filtrado.map(proc => (
            <div key={proc.procedimento} className="rounded-3xl overflow-hidden flex flex-col" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: proc.cor }} />
                <p className="font-bold flex-1 truncate" style={{ color: "var(--text-primary)" }}>{proc.procedimento}</p>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--gold-bg)", color: "var(--gold)" }}>{proc.totalPacientes}</span>
              </div>
              <div className="flex flex-col divide-y max-h-[22rem] overflow-y-auto" style={{ borderColor: "var(--border-subtle)" }}>
                {proc.pacientes.map((pac, i) => (
                  <button
                    key={(pac.paciente_id || pac.nome) + i}
                    onClick={() => pac.paciente_id && router.push(`/admin/prontuario?id=${pac.paciente_id}`)}
                    className="text-left px-4 py-2.5 transition hover:opacity-80"
                    style={{ cursor: pac.paciente_id ? "pointer" : "default" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{pac.nome}</p>
                      <span className="text-[11px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>{pac.qtd}x</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pac.datas.slice(0, 8).map((d, j) => (
                        <span key={j} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>{fmtData(d)}</span>
                      ))}
                      {pac.datas.length > 8 && <span className="text-[10px] px-1 py-0.5" style={{ color: "var(--text-muted)" }}>+{pac.datas.length - 8}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
