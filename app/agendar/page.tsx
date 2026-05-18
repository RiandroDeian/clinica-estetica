"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const procedimentos = [
  "Botox Terço Superior",
  "Botox Full Face",
  "Botox Pescoço",
  "Bioestimulador de Colágeno",
  "Preenchimento Labial",
  "Rinomodelação",
  "Bigode Chinês",
  "Preenchimento de Olheiras",
  "Perfiloplastia",
  "Depilação a Laser",
  "Dry Needling",
  "Quiropraxia",
  "Liberação Miofascial",
  "Ventosaterapia",
  "Limpeza de Pele",
  "Protocolo Pele Perfeita",
  "Protocolo Capilar",
  "Protocolo PEIM",
  "Lipo de Papada Enzimática",
  "Lipo Corporal Enzimática",
  "Protocolo Celulite",
  "Protocolo de Estrias",
  "Protocolo Emagrecimento Plus",
];

const horarios = [
  "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
];

type Etapa = "form" | "sucesso";

export default function Agendar() {
  const [etapa, setEtapa] = useState<Etapa>("form");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [procedimento, setProcedimento] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);

  function formatarTelefone(valor: string) {
    const nums = valor.replace(/\D/g, "").slice(0, 11);
    if (nums.length <= 2) return nums;
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  }

  // Data mínima = hoje
  const hoje = new Date().toISOString().split("T")[0];

  // Formatar data em português: "12 de junho de 2025"
  function formatarData(dataISO: string) {
    return new Date(dataISO + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  async function buscarHorariosOcupados(dataSelecionada: string) {
    const { data } = await supabase
      .from("agendamentos")
      .select("horario")
      .eq("data", dataSelecionada)
      .neq("status", "cancelado");
    if (data) setHorariosOcupados(data.map((item) => item.horario));
  }

  async function handleSubmit() {
    setErro("");
    if (!nome || !telefone || !procedimento || !data || !horario) {
      setErro("Por favor, preencha todos os campos.");
      return;
    }
    setLoading(true);

    const { data: existente } = await supabase
      .from("agendamentos")
      .select("id")
      .eq("data", data)
      .eq("horario", horario)
      .neq("status", "cancelado")
      .limit(1);

    if (existente && existente.length > 0) {
      setErro("Este horário já está reservado. Escolha outro.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("agendamentos").insert([{
      nome, telefone, procedimento, data, horario, status: "pendente",
    }]);

    setLoading(false);
    if (error) { setErro("Erro ao realizar agendamento. Tente novamente."); return; }
    setEtapa("sucesso");
  }

  // ── TELA DE SUCESSO ──
  if (etapa === "sucesso") {
    const dataFormatada = formatarData(data);

    const mensagemWpp = encodeURIComponent(
      `Olá, Moncié! 🌸 Gostaria de confirmar meu agendamento:\n\n` +
      `👤 Nome: ${nome}\n` +
      `💆 Procedimento: ${procedimento}\n` +
      `📅 Data: ${dataFormatada}\n` +
      `⏰ Horário: ${horario}\n\n` +
      `Aguardo confirmação! 😊`
    );

    return (
      <main
        className="min-h-screen bg-[#0a0707] text-white flex items-center justify-center p-6"
        style={{ fontFamily: "Georgia, serif" }}
      >
        <div className="text-center max-w-lg w-full">

          {/* Ícone ✓ */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8"
            style={{ background: "rgba(200,160,120,0.12)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#c8a078" strokeWidth={2.5} className="w-10 h-10">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <p className="uppercase tracking-[0.4em] text-xs mb-3" style={{ color: "#c8a078" }}>
            Agendamento Realizado
          </p>
          <h1 className="text-4xl font-bold mb-8">Tudo certo!</h1>

          {/* Resumo */}
          <div
            className="rounded-3xl p-6 mb-6 text-left"
            style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.12)" }}
          >
            {[
              { label: "Nome", valor: nome },
              { label: "Procedimento", valor: procedimento },
              { label: "Data", valor: dataFormatada },
              { label: "Horário", valor: horario },
            ].map((item) => (
              <div
                key={item.label}
                className="flex justify-between items-center py-3"
                style={{ borderBottom: "1px solid rgba(200,160,120,0.07)" }}
              >
                <span className="text-sm" style={{ color: "#6b5a4e" }}>{item.label}</span>
                <span className="text-sm font-semibold" style={{ color: "#c8a078" }}>{item.valor}</span>
              </div>
            ))}
          </div>

          <p className="text-sm mb-8 leading-7" style={{ color: "#a89080" }}>
            Nossa equipe entrará em contato em breve para confirmar. Você também pode confirmar agora pelo WhatsApp.
          </p>

          {/* Botões */}
          <div className="flex flex-col gap-3">

            {/* WhatsApp */}
            <a
              href={`https://wa.me/5561995039925?text=${mensagemWpp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-full font-semibold flex items-center justify-center gap-2 transition hover:scale-105 active:scale-95"
              style={{ background: "#25D366", color: "white" }}
            >
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Confirmar pelo WhatsApp
            </a>

            {/* Novo agendamento */}
            <button
              onClick={() => {
                setNome(""); setTelefone(""); setProcedimento("");
                setData(""); setHorario(""); setErro("");
                setHorariosOcupados([]); setEtapa("form");
              }}
              className="w-full py-4 rounded-full font-semibold transition hover:scale-105 active:scale-95"
              style={{ border: "1px solid rgba(200,160,120,0.3)", color: "#c8a078" }}
            >
              Fazer outro agendamento
            </button>

            {/* Voltar ao início */}
            <a
              href="/"
              className="w-full py-4 rounded-full font-semibold transition hover:scale-105 active:scale-95 block"
              style={{ border: "1px solid rgba(200,160,120,0.1)", color: "#6b5a4e" }}
            >
              Voltar para o início
            </a>

          </div>
        </div>
      </main>
    );
  }

  // ── FORMULÁRIO ──
  return (
    <main
      className="min-h-screen bg-[#0a0707] text-white px-6 py-16"
      style={{ fontFamily: "Georgia, serif" }}
    >
      <div className="max-w-2xl mx-auto">

        <a href="/" className="inline-flex items-center gap-2 mb-10 text-sm transition hover:opacity-70" style={{ color: "#6b5a4e" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Voltar ao início
        </a>

        <p className="uppercase tracking-[0.3em] text-xs mb-3" style={{ color: "#c8a078" }}>Moncié Esthetique</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Agendar Procedimento</h1>
        <p className="mb-10" style={{ color: "#a89080" }}>Preencha os dados abaixo e nossa equipe confirmará em breve.</p>

        <div className="flex flex-col gap-5">

          <input
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl outline-none text-white placeholder:text-[#4a3a32]"
            style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)" }}
          />

          <input
            type="tel"
            placeholder="WhatsApp (com DDD)"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            className="w-full px-5 py-4 rounded-2xl outline-none text-white placeholder:text-[#4a3a32]"
            style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)" }}
          />

          <select
            value={procedimento}
            onChange={(e) => setProcedimento(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl outline-none"
            style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)", color: procedimento ? "white" : "#4a3a32" }}
          >
            <option value="" style={{ color: "#4a3a32" }}>Escolha um procedimento</option>
            {procedimentos.map((p) => (
              <option key={p} value={p} style={{ color: "white" }}>{p}</option>
            ))}
          </select>

          {/* Campo de data com label */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#6b5a4e" }}>Data</label>
            <input
              type="date"
              value={data}
              min={hoje}
              onChange={(e) => {
                setData(e.target.value);
                buscarHorariosOcupados(e.target.value);
              }}
              className="w-full px-5 py-4 rounded-2xl outline-none text-white"
              style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)", colorScheme: "dark" }}
            />
            {/* Mostrar data formatada em português */}
            {data && (
              <p className="mt-2 text-sm" style={{ color: "#c8a078" }}>
                📅 {formatarData(data)}
              </p>
            )}
          </div>

          {/* Horários */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-3" style={{ color: "#6b5a4e" }}>Horário</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {horarios.map((h) => {
                const ocupado = horariosOcupados.includes(h);
                return (
                  <button
                    key={h}
                    type="button"
                    disabled={ocupado}
                    onClick={() => setHorario(h)}
                    className="py-3 rounded-2xl text-sm transition hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: ocupado ? "#2a2222" : horario === h ? "#c8a078" : "#120d0d",
                      color: ocupado ? "#666" : horario === h ? "#0a0707" : "#a89080",
                      border: horario === h ? "1px solid #c8a078" : "1px solid rgba(200,160,120,0.15)",
                    }}
                  >
                    {ocupado ? "Ocupado" : h}
                  </button>
                );
              })}
            </div>
          </div>

          {erro && (
            <div className="p-4 rounded-2xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
              {erro}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-5 rounded-full font-bold transition hover:scale-105 active:scale-95 mt-2"
            style={{ background: "#c8a078", color: "#0a0707" }}
          >
            {loading ? "Agendando..." : "Confirmar Agendamento"}
          </button>

        </div>
      </div>
    </main>
  );
}