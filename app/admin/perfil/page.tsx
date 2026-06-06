"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

type Funcionario = {
  id: string;
  nome: string;
  email: string;
  cargo?: string;
  cor?: string;
  telefone?: string;
  criado_em?: string;
};

const cores = ["#c8a078","#7ae8a0","#7ab8e8","#e87a7a","#e8c97a","#c87ae8","#e8a07a","#7ae8d8"];

export default function PerfilPage() {
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [abaAtiva, setAbaAtiva] = useState<"perfil"|"senha">("perfil");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { setFuncionario(d); setCarregando(false); });
  }, []);

  async function salvarPerfil() {
    if (!funcionario) return;
    setSalvando(true);
    const res = await fetch("/api/funcionarios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: funcionario.id, nome: funcionario.nome, telefone: funcionario.telefone, cor: funcionario.cor }),
    });
    if (res.ok) toast.success("Perfil atualizado!");
    else toast.error("Erro ao salvar");
    setSalvando(false);
  }

  async function trocarSenha() {
    if (novaSenha !== confirmarSenha) { toast.error("As senhas não coincidem"); return; }
    if (novaSenha.length < 6) { toast.error("Nova senha deve ter pelo menos 6 caracteres"); return; }
    setSalvando(true);
    const res = await fetch("/api/auth/senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senhaAtual, novaSenha }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Senha alterada com sucesso!");
      setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("");
    } else {
      toast.error(data.erro ?? "Erro ao trocar senha");
    }
    setSalvando(false);
  }

  if (carregando) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--gold)" }} />
    </div>
  );

  const iniciais = funcionario?.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() ?? "?";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Conta</p>
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Meu Perfil</h1>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-8 p-6 rounded-3xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: `${funcionario?.cor ?? "var(--gold)"}22`, color: funcionario?.cor ?? "var(--gold)" }}>
          {iniciais}
        </div>
        <div>
          <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{funcionario?.nome}</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{funcionario?.cargo ?? "Funcionário"}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{funcionario?.email}</p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-6 rounded-2xl p-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        {(["perfil","senha"] as const).map(aba => (
          <button key={aba} onClick={() => setAbaAtiva(aba)}
            className="flex-1 py-2.5 rounded-xl text-xs uppercase tracking-widest transition"
            style={{ background: abaAtiva === aba ? "var(--gold-bg)" : "transparent", color: abaAtiva === aba ? "var(--gold)" : "var(--text-muted)" }}>
            {aba === "perfil" ? "Dados Pessoais" : "Trocar Senha"}
          </button>
        ))}
      </div>

      {/* ABA PERFIL */}
      {abaAtiva === "perfil" && funcionario && (
        <div className="rounded-3xl p-6 flex flex-col gap-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Nome completo</label>
            <input type="text" value={funcionario.nome} onChange={e => setFuncionario(f => f ? { ...f, nome: e.target.value } : f)}
              className="w-full px-4 py-3 rounded-2xl outline-none text-sm"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Email</label>
            <input type="email" value={funcionario.email} disabled
              className="w-full px-4 py-3 rounded-2xl outline-none text-sm opacity-50"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Telefone</label>
            <input type="tel" value={funcionario.telefone ?? ""} onChange={e => setFuncionario(f => f ? { ...f, telefone: e.target.value } : f)}
              placeholder="(61) 99999-9999"
              className="w-full px-4 py-3 rounded-2xl outline-none text-sm"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Cor na agenda</label>
            <div className="flex gap-2 flex-wrap">
              {cores.map(cor => (
                <button key={cor} onClick={() => setFuncionario(f => f ? { ...f, cor } : f)}
                  className="w-9 h-9 rounded-full transition hover:scale-110"
                  style={{ background: cor, border: funcionario.cor === cor ? "3px solid white" : "2px solid transparent" }} />
              ))}
            </div>
          </div>
          <button onClick={salvarPerfil} disabled={salvando}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition hover:scale-105"
            style={{ background: "var(--gold)", color: "#0a0707" }}>
            {salvando ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      )}

      {/* ABA SENHA */}
      {abaAtiva === "senha" && (
        <div className="rounded-3xl p-6 flex flex-col gap-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: "var(--gold-bg)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
            A senha deve ter pelo menos 6 caracteres.
          </div>
          {[
            { label: "Senha atual", value: senhaAtual, onChange: setSenhaAtual },
            { label: "Nova senha",  value: novaSenha,  onChange: setNovaSenha  },
            { label: "Confirmar nova senha", value: confirmarSenha, onChange: setConfirmarSenha },
          ].map(campo => (
            <div key={campo.label}>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{campo.label}</label>
              <input type="password" value={campo.value} onChange={e => campo.onChange(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl outline-none text-sm"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
            </div>
          ))}
          <button onClick={trocarSenha} disabled={salvando || !senhaAtual || !novaSenha || !confirmarSenha}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition hover:scale-105"
            style={{ background: "var(--gold)", color: "#0a0707", opacity: !senhaAtual || !novaSenha || !confirmarSenha ? 0.5 : 1 }}>
            {salvando ? "Salvando..." : "Trocar Senha"}
          </button>
        </div>
      )}
    </div>
  );
}
