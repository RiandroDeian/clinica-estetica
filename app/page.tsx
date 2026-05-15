"use client";

import { useState, useEffect, useRef } from "react";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, inView };
}

function FadeSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={className} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(32px)", transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

function BeforeAfterSlider({ before, after, label }: { before: string; after: string; label: string }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const updatePos = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSliderPos((Math.max(0, Math.min(clientX - rect.left, rect.width)) / rect.width) * 100);
  };
  return (
    <div ref={containerRef} className="relative w-full rounded-3xl overflow-hidden select-none" style={{ aspectRatio: "4/3", cursor: "col-resize", touchAction: "none" }}
      onMouseDown={() => { dragging.current = true; }}
      onMouseMove={(e) => { if (dragging.current) updatePos(e.clientX); }}
      onMouseUp={() => { dragging.current = false; }}
      onMouseLeave={() => { dragging.current = false; }}
      onTouchMove={(e) => updatePos(e.touches[0].clientX)}
    >
      <img src={after} alt={`Depois - ${label}`} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
        <img src={before} alt={`Antes - ${label}`} className="absolute inset-0 h-full object-cover" style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: "none" }} draggable={false} />
      </div>
      <div className="absolute top-0 bottom-0 w-[2px] z-10" style={{ left: `${sliderPos}%`, background: "rgba(200,160,120,0.9)", transform: "translateX(-50%)" }}>
        <div className="absolute top-1/2 left-1/2 w-10 h-10 rounded-full flex items-center justify-center" style={{ transform: "translate(-50%,-50%)", background: "#c8a078" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M5 8L2 5M2 8h12M11 8l3-3M2 8l3 3M14 8l-3 3" stroke="#0a0707" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      <span className="absolute bottom-4 left-4 text-xs uppercase tracking-widest px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(10,7,7,0.75)", color: "#c8a078", backdropFilter: "blur(8px)" }}>Antes</span>
      <span className="absolute bottom-4 right-4 text-xs uppercase tracking-widest px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(10,7,7,0.75)", color: "#c8a078", backdropFilter: "blur(8px)" }}>Depois</span>
    </div>
  );
}

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [etapa, setEtapa] = useState<"inicio" | "equipe" | "chat">("inicio");
  const [msgs, setMsgs] = useState<{ de: "user" | "bot"; texto: string }[]>([]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && etapa === "inicio" && msgs.length === 0) {
      setMsgs([{ de: "bot", texto: "Olá! Seja muito bem-vinda à Moncié Esthetique 🌸\n\nFicamos felizes em ter você aqui. Como posso te ajudar hoje?" }]);
    }
  }, [open]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, carregando]);

  const escolherEquipe = () => {
    setEtapa("equipe");
    setMsgs(m => [...m,
      { de: "user", texto: "Quero falar com a equipe" },
      { de: "bot", texto: "Perfeito! Logo alguém da nossa equipe irá te atender com toda a atenção que você merece 💛\n\nClique abaixo para continuar pelo WhatsApp:" }
    ]);
  };

  const escolherChat = () => {
    setEtapa("chat");
    setMsgs(m => [...m,
      { de: "user", texto: "Continuar por aqui" },
      { de: "bot", texto: "Ótimo! Estou aqui para te ajudar com informações sobre nossos tratamentos, localização e agendamentos. O que você gostaria de saber? 😊" }
    ]);
  };

  const enviarMensagem = async () => {
    if (!input.trim() || carregando) return;
    const pergunta = input.trim();
    setInput("");
    setMsgs(m => [...m, { de: "user", texto: pergunta }]);
    setCarregando(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: `Você é Sofia, atendente da Moncié Esthetique, clínica de estética premium em Planaltina, Brasília/DF. Seja calorosa, feminina e acolhedora. Responda sempre em português brasileiro de forma concisa.

REGRAS ABSOLUTAS:
- JAMAIS mencione valores, preços ou condições de pagamento. Se perguntarem, diga: "Para informações sobre valores, nossa equipe terá o prazer de te atender pelo WhatsApp 💛"
- JAMAIS diga que é uma IA, robô ou assistente virtual. Você é a Sofia, atendente humana.
- Não fale sobre temas fora da clínica.
- Não invente informações que não estão listadas abaixo.

SOBRE A MONCIÉ ESTHETIQUE:
Endereço: Av. Independência, Centro Clínico CDC, 3º andar sala 300, QD51 LT16A, Setor Tradicional (Planaltina), Brasília/DF. CEP 73330-003.
Horário: Segunda a Sexta 8h–19h | Sábado 8h–18h | Domingo fechado.
WhatsApp: (61) 9357-8458
Instagram: @moncieclinica

PROCEDIMENTOS:
Harmonização Facial (Rejuvenescimento): Botox Terço Superior, Botox Full Face, Botox Pescoço, Bioestimulador de Colágeno.
Harmonização Facial (Preenchimento): Preenchimento Labial, Rinomodelação, Bigode Chinês, Preenchimento de Olheiras, Perfiloplastia (nariz, boca e queixo).
Depilação a Laser: Pacotes femininos e masculinos com 6 sessões inclusas. Fechando qualquer pacote, ganha 1 área pequena de brinde.
Técnicas Fisioterapêuticas: Dry Needling, Quiropraxia, Liberação Miofascial, Ventosaterapia.
Protocolos Faciais: Limpeza de Pele, Protocolo Pele Perfeita (6 sessões), Protocolo Capilar (6 sessões).
Protocolos Corporais: Protocolo PEIM (vasinhos, 4 sessões), Lipo de Papada Enzimática (5 sessões), Lipo Corporal Enzimática (8 sessões), Protocolo Celulite (5 sessões), Protocolo de Estrias (6 sessões), Protocolo Emagrecimento Plus (programa completo com personal trainer e nutricionista).
Todos os procedimentos podem ser parcelados em até 12x com juros da máquina.`,
          messages: [{ role: "user", content: pergunta }],
        }),
      });
      const data = await res.json();
      const resposta = data.content?.[0]?.text ?? "Ops, não consegui processar. Tente novamente!";
      setMsgs(m => [...m, { de: "bot", texto: resposta }]);
    } catch {
      setMsgs(m => [...m, { de: "bot", texto: "Ops, tive um problema de conexão. Pode tentar de novo? 😊" }]);
    }
    setCarregando(false);
  };

  return (
    <>
      <button onClick={() => setOpen(o => !o)} className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition hover:scale-110 active:scale-95 z-50" style={{ background: "#c8a078" }} aria-label="Abrir chat">
        {open
          ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-6 h-6"><path d="M18 6L6 18M6 6l12 12"/></svg>
          : <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-6 h-6"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        }
      </button>

      {open && (
        <div className="fixed bottom-44 right-5 w-[340px] rounded-3xl z-50 flex flex-col overflow-hidden" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.2)", maxHeight: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          <div className="flex items-center gap-3 px-5 py-4" style={{ background: "#1a1010", borderBottom: "1px solid rgba(200,160,120,0.1)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "#c8a078", color: "#0a0707" }}>S</div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#c8a078" }}>Sofia — Moncié</p>
              <p className="text-xs" style={{ color: "#6b5a4e" }}>● Online agora</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ minHeight: 0 }}>
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.de === "user" ? "justify-end" : "justify-start"}`}>
                <div className="rounded-2xl px-4 py-3 text-sm leading-6 max-w-[85%] whitespace-pre-line"
                  style={m.de === "bot"
                    ? { background: "#1e1212", color: "#d4b896", borderBottomLeftRadius: 4 }
                    : { background: "#c8a078", color: "#0a0707", borderBottomRightRadius: 4 }
                  }>
                  {m.texto}
                </div>
              </div>
            ))}

            {carregando && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3" style={{ background: "#1e1212", borderBottomLeftRadius: 4 }}>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full" style={{ background: "#c8a078", animation: `bounce 1s ease ${i*0.2}s infinite` }}/>)}
                  </div>
                </div>
              </div>
            )}

            {etapa === "inicio" && msgs.length === 1 && (
              <div className="flex flex-col gap-2 mt-1">
                <button onClick={escolherEquipe} className="w-full py-2.5 rounded-xl text-sm font-semibold transition hover:scale-[1.02]" style={{ background: "#c8a078", color: "#0a0707" }}>Falar com a equipe</button>
                <button onClick={escolherChat} className="w-full py-2.5 rounded-xl text-sm font-semibold transition hover:scale-[1.02]" style={{ border: "1px solid rgba(200,160,120,0.35)", color: "#c8a078" }}>Tirar dúvidas por aqui</button>
              </div>
            )}

            {etapa === "equipe" && (
              <a href="https://wa.me/556193578458" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition hover:scale-[1.02]" style={{ background: "#25D366", color: "white" }}>
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Abrir WhatsApp
              </a>
            )}
            <div ref={fimRef} />
          </div>

          {etapa === "chat" && (
            <div className="px-3 py-3 flex gap-2" style={{ borderTop: "1px solid rgba(200,160,120,0.1)" }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && enviarMensagem()} placeholder="Digite sua mensagem..." className="flex-1 rounded-full px-4 py-2 text-sm outline-none" style={{ background: "#1e1212", color: "#d4b896", border: "1px solid rgba(200,160,120,0.15)" }} />
              <button onClick={enviarMensagem} className="w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-110" style={{ background: "#c8a078" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0a0707" strokeWidth={2} className="w-4 h-4"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── DADOS ──
const categoriasProcedimentos = [
  {
    categoria: "Harmonização — Rejuvenescimento",
    items: [
      { nome: "Botox Terço Superior", descricao: "Suaviza rugas da testa, glabela e olhos. Relaxa a musculatura e deixa a pele mais lisa.", img: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=80" },
      { nome: "Botox Full Face", descricao: "Trata o rosto de forma global e harmoniosa. Suaviza rugas e melhora o contorno, equilibrando as expressões.", img: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800&q=80" },
      { nome: "Botox Pescoço", descricao: "Suaviza as bandas musculares e linhas horizontais, proporcionando aspecto mais firme e rejuvenescido.", img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80" },
      { nome: "Bioestimulador de Colágeno", descricao: "Estimula a produção natural de colágeno, melhorando firmeza e qualidade da pele com resultados graduais e duradouros.", img: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=80" },
    ],
  },
  {
    categoria: "Harmonização — Preenchimento",
    items: [
      { nome: "Preenchimento Labial", descricao: "Realça o volume e define o contorno dos lábios com naturalidade. Corrige assimetrias e hidrata.", img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80" },
      { nome: "Rinomodelação", descricao: "Modela o nariz sem cirurgia, corrigindo imperfeições e alinhando o perfil com resultado imediato.", img: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&q=80" },
      { nome: "Bigode Chinês", descricao: "Suaviza os sulcos ao redor da boca, devolvendo um aspecto mais jovem e descansado ao rosto.", img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&q=80" },
      { nome: "Preenchimento de Olheiras", descricao: "Suaviza o aspecto cansado, devolve volume perdido e ilumina o olhar de forma rejuvenescida.", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80" },
      { nome: "Perfiloplastia", descricao: "Harmonização do perfil do rosto, equilibrando nariz, queixo e lábios para resultado mais proporcional. (1ml)", img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80" },
    ],
  },
  {
    categoria: "Depilação a Laser",
    items: [
      { nome: "Pacotes Femininos", descricao: "5 combos com 6 sessões inclusas. Áreas: virilha, axila, perna completa, buço, rosto e braço. Fechando qualquer pacote, ganhe 1 área pequena de brinde!", img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80" },
      { nome: "Pacotes Masculinos", descricao: "5 combos com 6 sessões inclusas. Áreas: barba, peitoral, nuca, axila, abdômen, costas e perna. Fechando qualquer pacote, ganhe 1 área pequena de brinde!", img: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&q=80" },
    ],
  },
  {
    categoria: "Técnicas Fisioterapêuticas",
    items: [
      { nome: "Dry Needling", descricao: "Técnica com agulhas finas para liberação de pontos de tensão muscular, aliviando dores e melhorando a mobilidade.", img: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80" },
      { nome: "Quiropraxia", descricao: "Ajustes manuais para alinhamento da coluna e articulações, promovendo alívio de dores e bem-estar.", img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80" },
      { nome: "Liberação Miofascial", descricao: "Técnica manual que libera tensões na fáscia muscular, reduzindo dores crônicas e melhorando a postura.", img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80" },
      { nome: "Ventosaterapia", descricao: "Uso de ventosas para estimular a circulação, reduzir tensões musculares e promover relaxamento profundo.", img: "https://images.unsplash.com/photo-1552693673-1bf958298935?w=800&q=80" },
      { nome: "Pacotes Fisioterapêuticos", descricao: "4 sessões por R$520 ou 8 sessões por R$920. Pacotes combinados: duplo (2 técnicas), triplo (3 técnicas) e completo (4 técnicas no mesmo dia).", img: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80" },
    ],
  },
  {
    categoria: "Protocolos Faciais & Capilar",
    items: [
      { nome: "Limpeza de Pele", descricao: "Cuidado essencial para remover impurezas, controlar a oleosidade e renovar a saúde da sua pele.", img: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80" },
      { nome: "Protocolo Pele Perfeita", descricao: "Tratamento completo e personalizado para melasma, acne, rosácea e muito mais. 6 sessões inclusas.", img: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80" },
      { nome: "Protocolo Capilar", descricao: "Tratamento para queda de cabelo e estimulação do fortalecimento dos fios. 6 sessões inclusas.", img: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&q=80" },
    ],
  },
  {
    categoria: "Protocolos Corporais",
    items: [
      { nome: "Protocolo PEIM", descricao: "Tratamento para eliminar vasinhos aparentes nas pernas, melhorando seu aspecto. 4 sessões.", img: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800&q=80" },
      { nome: "Lipo de Papada Enzimática", descricao: "Reduz a gordura localizada na papada e redefine o contorno do rosto. 5 sessões.", img: "https://images.unsplash.com/photo-1498515816213-e7ba8b73ef01?w=800&q=80" },
      { nome: "Lipo Corporal Enzimática", descricao: "Redução de gordura localizada em abdômen, flancos, culote e braços sem cirurgia. 8 sessões.", img: "https://images.unsplash.com/photo-1523264653568-d3d4032d1476?w=800&q=80" },
      { nome: "Protocolo Celulite", descricao: "Melhora a circulação e devolve firmeza à pele, reduzindo o aspecto da celulite. 5 sessões.", img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80" },
      { nome: "Protocolo de Estrias", descricao: "Suaviza a aparência das estrias e melhora a textura da pele. 6 sessões.", img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80" },
      { nome: "Protocolo Emagrecimento Plus", descricao: "Programa completo: 5x Lipo Papada + 8x Lipo Corporal + 1 mês mentoria com personal trainer e nutricionista.", img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80" },
    ],
  },
];

const antesDepois = [
  { id: "botox", label: "Botox", antes: "https://images.unsplash.com/photo-1523264653568-d3d4032d1476?w=800&q=80", depois: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&q=80", descricao: "Suavização natural das linhas de expressão da testa e ao redor dos olhos, com resultado harmonioso e duradouro." },
  { id: "labial", label: "Preenchimento Labial", antes: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80", depois: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80", descricao: "Volume e definição natural nos lábios, corrigindo assimetrias e realçando a beleza com resultado imediato." },
  { id: "pele", label: "Protocolo Pele Perfeita", antes: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&q=80", depois: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80", descricao: "Tratamento completo para manchas, acne e oleosidade. Pele renovada, uniforme e radiante após as sessões." },
  { id: "corporal", label: "Lipo Corporal", antes: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80", depois: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80", descricao: "Redução de gordura localizada em abdômen, flancos e culote com enzimas de última geração, sem cirurgia." },
  { id: "laser", label: "Depilação a Laser", antes: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&q=80", depois: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80", descricao: "Pele lisa e sem pelos indesejados de forma definitiva, com tecnologia laser de alta performance." },
];

const depoimentos = [
  { nome: "Ana Luiza", texto: "Fiz harmonização facial e o resultado foi incrível. Atendimento super cuidadoso e ambiente aconchegante. Recomendo demais!", procedimento: "Harmonização Facial", estrelas: 5 },
  { nome: "Camila Souza", texto: "A limpeza de pele mudou minha autoestima. Profissional atenciosa, explicou tudo direitinho. Já agendei a próxima sessão!", procedimento: "Limpeza de Pele", estrelas: 5 },
  { nome: "Fernanda Lima", texto: "Botox muito natural, exatamente o que eu queria. A clínica é sofisticada e o atendimento é impecável.", procedimento: "Botox", estrelas: 5 },
];

const stats = [
  { valor: "+500", label: "Clientes", icone: "👥" },
  { valor: "98%", label: "Satisfação", icone: "⭐" },
  { valor: "Premium", label: "Experiência", icone: "✦" },
  { valor: "Personalizado", label: "Atendimento", icone: "🌸" },
];

const infoContato = [
  { icone: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}><path d="M12 21c-4.418 0-8-4.03-8-9a8 8 0 1116 0c0 4.97-3.582 9-8 9z"/><circle cx="12" cy="12" r="3"/></svg>, titulo: "Endereço", linhas: ["Av. Independência, Centro Clínico CDC", "3º andar, sala 300 — QD51 LT16A", "Setor Tradicional (Planaltina) — Brasília/DF", "CEP: 73330-003"] },
  { icone: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>, titulo: "WhatsApp", linhas: ["(61) 9357-8458", "Fale com nossa equipe", "Agendamentos e dúvidas"] },
  { icone: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, titulo: "Horário", linhas: ["Segunda a Sexta: 8h – 19h", "Sábado: 8h – 18h", "Domingo: Fechado"] },
];

export default function Home() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [antesDepoisAtivo, setAntesDepoisAtivo] = useState("botox");
  const [categoriaAtiva, setCategoriaAtiva] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const itemAtivo = antesDepois.find((a) => a.id === antesDepoisAtivo) ?? antesDepois[0];

  return (
    <main className="min-h-svh bg-[#0a0707] text-white overflow-x-hidden" style={{ fontFamily: "Georgia, serif" }}>

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 z-50 w-full px-5 md:px-10 py-4 transition-all duration-300" style={{ background: scrolled ? "rgba(10,7,7,0.97)" : "rgba(10,7,7,0.75)", backdropFilter: "blur(12px)", borderBottom: scrolled ? "1px solid rgba(200,160,120,0.18)" : "1px solid transparent" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-moncie-print.jpg" alt="Moncié" className="w-12 h-12 rounded-xl object-cover" />
            <div>
              <h1 className="text-lg font-bold leading-tight" style={{ color: "#c8a078" }}>Moncié</h1>
              <p className="text-[10px] text-neutral-400 leading-tight">Esthetique</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 uppercase text-xs tracking-[0.18em]" style={{ color: "#c8a078" }}>
            <a href="#inicio" className="hover:text-white transition">Início</a>
            <a href="#procedimentos" className="hover:text-white transition">Procedimentos</a>
            <a href="#antes-depois" className="hover:text-white transition">Antes & Depois</a>
            <a href="#sobre" className="hover:text-white transition">Sobre</a>
            <a href="#contato" className="hover:text-white transition">Localização</a>
            <a href="/agendar" className="px-6 py-2.5 rounded-full font-semibold transition hover:scale-105" style={{ background: "#c8a078", color: "#0a0707" }}>Agendar</a>
          </div>
          <button className="md:hidden flex flex-col gap-[5px] p-2" onClick={() => setMenuAberto(!menuAberto)} aria-label="Abrir menu">
            <span className="w-6 h-0.5 transition-all duration-300" style={{ background: "#c8a078", transform: menuAberto ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
            <span className="w-6 h-0.5 transition-all duration-300" style={{ background: "#c8a078", opacity: menuAberto ? 0 : 1 }} />
            <span className="w-6 h-0.5 transition-all duration-300" style={{ background: "#c8a078", transform: menuAberto ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
          </button>
        </div>
        <div className="md:hidden overflow-hidden transition-all duration-300" style={{ maxHeight: menuAberto ? "500px" : "0px", opacity: menuAberto ? 1 : 0 }}>
          <div className="flex flex-col gap-4 pt-6 pb-6 mt-4 rounded-2xl px-5 uppercase text-xs tracking-[0.18em]" style={{ color: "#c8a078", background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
            {[{ href: "inicio", label: "Início" }, { href: "procedimentos", label: "Procedimentos" }, { href: "antes-depois", label: "Antes & Depois" }, { href: "sobre", label: "Sobre" }, { href: "contato", label: "Localização" }].map((item) => (
              <a key={item.href} href={`#${item.href}`} onClick={() => setMenuAberto(false)} className="hover:text-white transition">{item.label}</a>
            ))}
            <a href="/agendar" onClick={() => setMenuAberto(false)} className="mt-2 text-center py-3 rounded-full font-semibold transition hover:scale-105" style={{ background: "#c8a078", color: "#0a0707" }}>Agendar Agora</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="inicio" className="relative min-h-[100svh] flex items-center justify-center text-center px-5">
        <div className="absolute inset-0">
          <video src="/video-clinica.mp4" autoPlay muted loop playsInline className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,7,7,0.5), rgba(10,7,7,0.97))" }} />
        </div>
        <div className="absolute w-[280px] h-[280px] md:w-[420px] md:h-[420px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(200,160,120,0.07)", top: "8%", left: "3%" }} />
        <div className="relative z-10 max-w-5xl w-full">
          <p className="uppercase tracking-[0.35em] text-xs mb-5" style={{ color: "#c8a078" }}>Clínica Premium — Planaltina, Brasília</p>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-6" style={{ animation: "fadeUp 0.8s ease both" }}>
            Beleza com<span style={{ color: "#c8a078" }}> sofisticação</span>
          </h1>
          <p className="text-base md:text-xl max-w-2xl mx-auto leading-8 mb-12" style={{ color: "#a89080", animation: "fadeUp 0.8s ease 0.15s both" }}>
            Tratamentos modernos, atendimento personalizado e resultados naturais para elevar sua autoestima.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap" style={{ animation: "fadeUp 0.8s ease 0.3s both" }}>
            <a href="/agendar" className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold uppercase tracking-widest text-sm transition hover:scale-105 active:scale-95 text-center" style={{ background: "#c8a078", color: "#0a0707" }}>Agendar Horário</a>
            <a href="#antes-depois" className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold uppercase tracking-widest text-sm transition hover:scale-105 active:scale-95 text-center" style={{ border: "1px solid rgba(200,160,120,0.4)", color: "#c8a078" }}>Antes & Depois</a>
            <a href="#contato" className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold uppercase tracking-widest text-sm transition hover:scale-105 active:scale-95 text-center" style={{ border: "1px solid rgba(200,160,120,0.2)", color: "#a89080" }}>Localização</a>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-20 bg-[#0d0909]">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((item, i) => (
              <FadeSection key={i} delay={i * 80}>
                <div className="rounded-3xl p-6 md:p-8 text-center transition hover:scale-[1.03] duration-300" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
                  <div className="text-2xl mb-3">{item.icone}</div>
                  <h3 className="text-2xl md:text-3xl mb-2 font-bold" style={{ color: "#c8a078" }}>{item.valor}</h3>
                  <p className="text-sm" style={{ color: "#a89080" }}>{item.label}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCEDIMENTOS ── */}
      <section id="procedimentos" className="py-28 px-5 bg-[#0a0707]">
        <div className="max-w-7xl mx-auto">
          <FadeSection className="text-center mb-12">
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: "#c8a078" }}>Procedimentos</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-5">Tratamentos Exclusivos</h2>
            <p className="max-w-2xl mx-auto" style={{ color: "#a89080" }}>Procedimentos modernos para realçar sua beleza natural com segurança e sofisticação. Parcelamento em até 12x.</p>
          </FadeSection>
          <FadeSection delay={100}>
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {categoriasProcedimentos.map((cat, i) => (
                <button key={i} onClick={() => setCategoriaAtiva(i)} className="px-4 py-2 rounded-full text-xs uppercase tracking-wider font-semibold transition-all duration-300"
                  style={categoriaAtiva === i ? { background: "#c8a078", color: "#0a0707" } : { background: "transparent", color: "#c8a078", border: "1px solid rgba(200,160,120,0.25)" }}>
                  {cat.categoria}
                </button>
              ))}
            </div>
          </FadeSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoriasProcedimentos[categoriaAtiva].items.map((item, i) => (
              <FadeSection key={`${categoriaAtiva}-${i}`} delay={i * 60}>
                <div className="rounded-3xl overflow-hidden h-full flex flex-col transition hover:scale-[1.02] duration-300" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
                  <img src={item.img} alt={item.nome} className="w-full h-52 object-cover" loading="lazy" />
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg mb-2 font-semibold" style={{ color: "#c8a078" }}>{item.nome}</h3>
                    <p className="text-sm leading-6 mb-5 flex-1" style={{ color: "#a89080" }}>{item.descricao}</p>
                    <a href="/agendar" className="inline-block px-6 py-3 rounded-full text-sm uppercase tracking-widest transition hover:scale-105 active:scale-95 text-center font-semibold" style={{ background: "#c8a078", color: "#0a0707" }}>Agendar</a>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANTES E DEPOIS ── */}
      <section id="antes-depois" className="py-28 px-5 bg-[#0d0909]">
        <div className="max-w-6xl mx-auto">
          <FadeSection className="text-center mb-16">
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: "#c8a078" }}>Resultados Reais</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-5">Antes & Depois</h2>
            <p className="max-w-xl mx-auto" style={{ color: "#a89080" }}>Deslize para comparar os resultados dos nossos tratamentos. Beleza transformada com segurança e técnica.</p>
          </FadeSection>
          <FadeSection delay={100}>
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {antesDepois.map((item) => (
                <button key={item.id} onClick={() => setAntesDepoisAtivo(item.id)} className="px-5 py-2.5 rounded-full text-sm uppercase tracking-widest font-semibold transition-all duration-300"
                  style={antesDepoisAtivo === item.id ? { background: "#c8a078", color: "#0a0707", transform: "scale(1.05)" } : { background: "transparent", color: "#c8a078", border: "1px solid rgba(200,160,120,0.3)" }}>
                  {item.label}
                </button>
              ))}
            </div>
          </FadeSection>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <FadeSection delay={150}>
              <BeforeAfterSlider key={itemAtivo.id} before={itemAtivo.antes} after={itemAtivo.depois} label={itemAtivo.label} />
            </FadeSection>
            <FadeSection delay={250}>
              <div className="flex flex-col justify-center">
                <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: "#c8a078" }}>{itemAtivo.label}</p>
                <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Resultados que falam por si</h3>
                <p className="text-lg leading-8 mb-8" style={{ color: "#a89080" }}>{itemAtivo.descricao}</p>
                <div className="flex gap-2 mb-10">
                  {antesDepois.map((item) => (
                    <button key={item.id} onClick={() => setAntesDepoisAtivo(item.id)} className="w-2 h-2 rounded-full transition-all duration-300" style={{ background: antesDepoisAtivo === item.id ? "#c8a078" : "rgba(200,160,120,0.25)", transform: antesDepoisAtivo === item.id ? "scale(1.4)" : "scale(1)" }} aria-label={item.label} />
                  ))}
                </div>
                <a href="/agendar" className="inline-block w-fit px-10 py-5 rounded-full uppercase tracking-widest text-sm font-semibold transition hover:scale-105 active:scale-95" style={{ background: "#c8a078", color: "#0a0707" }}>Quero esse resultado</a>
              </div>
            </FadeSection>
          </div>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-4">
            {antesDepois.map((item, i) => (
              <FadeSection key={item.id} delay={i * 60}>
                <button onClick={() => setAntesDepoisAtivo(item.id)} className="w-full rounded-2xl overflow-hidden transition-all duration-300 relative group" style={{ border: antesDepoisAtivo === item.id ? "2px solid #c8a078" : "1px solid rgba(200,160,120,0.15)", opacity: antesDepoisAtivo === item.id ? 1 : 0.65 }}>
                  <img src={item.depois} alt={item.label} className="w-full h-28 object-cover transition group-hover:scale-105 duration-500" loading="lazy" />
                  <div className="absolute inset-0 flex items-end p-2" style={{ background: "linear-gradient(to top, rgba(10,7,7,0.85), transparent)" }}>
                    <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#c8a078" }}>{item.label}</span>
                  </div>
                </button>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section className="py-28 px-5 bg-[#0a0707]">
        <div className="max-w-6xl mx-auto">
          <FadeSection className="text-center mb-16">
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: "#c8a078" }}>Depoimentos</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-5">O que dizem nossas clientes</h2>
            <p className="max-w-xl mx-auto" style={{ color: "#a89080" }}>Resultados reais e experiências transformadoras.</p>
          </FadeSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {depoimentos.map((item, i) => (
              <FadeSection key={i} delay={i * 80}>
                <div className="rounded-3xl p-7 h-full flex flex-col gap-4 transition hover:scale-[1.02] duration-300" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
                  <div className="flex gap-1">{Array.from({ length: item.estrelas }).map((_, s) => <span key={s} style={{ color: "#c8a078" }}>★</span>)}</div>
                  <p className="leading-7 flex-1 text-sm" style={{ color: "#a89080" }}>"{item.texto}"</p>
                  <div>
                    <p className="font-semibold" style={{ color: "#c8a078" }}>{item.nome}</p>
                    <p className="text-xs mt-1" style={{ color: "#6b5a4e" }}>{item.procedimento}</p>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOBRE ── */}
      <section id="sobre" className="py-28 px-5 bg-[#0d0909]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <FadeSection>
            <img src="/imagem-clinica (5).jpg" alt="Clínica Moncié" className="rounded-3xl h-72 md:h-[560px] w-full object-cover" loading="lazy" />
          </FadeSection>
          <FadeSection delay={150}>
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: "#c8a078" }}>Sobre a Moncié</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">Tecnologia, estética e excelência</h2>
            <p className="leading-8 text-lg mb-6" style={{ color: "#a89080" }}>A Moncié Esthetique nasceu para oferecer tratamentos sofisticados, modernos e completamente personalizados para cada cliente.</p>
            <p className="leading-8 text-lg mb-10" style={{ color: "#a89080" }}>Nossa missão é elevar a autoestima através de atendimento premium, técnicas de ponta e resultados naturais que transformam.</p>
            <a href="https://wa.me/556193578458" target="_blank" rel="noopener noreferrer" className="px-10 py-5 rounded-full uppercase tracking-widest text-sm font-semibold transition hover:scale-105 active:scale-95 inline-block" style={{ background: "#c8a078", color: "#0a0707" }}>Entrar em Contato</a>
          </FadeSection>
        </div>
      </section>

      {/* ── LOCALIZAÇÃO ── */}
      <section id="contato" className="py-28 px-5 bg-[#0a0707]">
        <div className="max-w-6xl mx-auto">
          <FadeSection className="text-center mb-16">
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: "#c8a078" }}>Onde Estamos</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-5">Localização & Contato</h2>
            <p className="max-w-xl mx-auto" style={{ color: "#a89080" }}>Venha nos visitar ou entre em contato. Estamos prontas para atendê-la com toda a atenção que você merece.</p>
          </FadeSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {infoContato.map((info, i) => (
              <FadeSection key={i} delay={i * 80}>
                <div className="rounded-3xl p-7 h-full transition hover:scale-[1.02] duration-300" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.1)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-5" style={{ background: "rgba(200,160,120,0.12)", color: "#c8a078" }}>{info.icone}</div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: "#c8a078" }}>{info.titulo}</h3>
                  <div className="flex flex-col gap-1">{info.linhas.map((linha, j) => <p key={j} className="text-sm leading-7" style={{ color: "#a89080" }}>{linha}</p>)}</div>
                </div>
              </FadeSection>
            ))}
          </div>
          <FadeSection delay={200}>
            <div className="rounded-3xl overflow-hidden mb-16" style={{ border: "1px solid rgba(200,160,120,0.15)" }}>
              <div className="flex items-center gap-3 px-5 py-4" style={{ background: "#120d0d", borderBottom: "1px solid rgba(200,160,120,0.1)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(200,160,120,0.12)", color: "#c8a078" }}>
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}><path d="M12 21c-4.418 0-8-4.03-8-9a8 8 0 1116 0c0 4.97-3.582 9-8 9z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#c8a078" }}>Moncié Esthetique</p>
                  <p className="text-xs" style={{ color: "#6b5a4e" }}>Centro Clínico CDC — Planaltina, Brasília/DF</p>
                </div>
                <a href="https://maps.google.com/?q=Centro+Clínico+CDC+QD51+LT16A+Planaltina+Brasília+DF" target="_blank" rel="noopener noreferrer" className="ml-auto text-xs uppercase tracking-widest px-4 py-2 rounded-full transition hover:scale-105" style={{ border: "1px solid rgba(200,160,120,0.3)", color: "#c8a078" }}>Abrir no Maps</a>
              </div>
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3836.1!2d-47.65!3d-15.6!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTXCsDM2JzAwLjAiUyA0N8KwMzknMDAuMCJX!5e0!3m2!1spt-BR!2sbr!4v1" width="100%" height="360" style={{ border: 0, display: "block", filter: "grayscale(30%) contrast(1.1)" }} loading="lazy" allowFullScreen />
            </div>
          </FadeSection>
          <FadeSection delay={100} className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Agende pelo WhatsApp</h2>
            <p className="text-lg leading-8 mb-10" style={{ color: "#a89080" }}>Fale com nossa equipe para esclarecer dúvidas e garantir seu horário.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/agendar" className="inline-block px-10 py-5 rounded-full uppercase tracking-widest text-sm font-semibold transition hover:scale-105 active:scale-95" style={{ background: "#c8a078", color: "#0a0707" }}>Agendar Online</a>
              <a href="https://wa.me/556193578458" target="_blank" rel="noopener noreferrer" className="inline-block px-10 py-5 rounded-full uppercase tracking-widest text-sm font-semibold transition hover:scale-105 active:scale-95" style={{ border: "1px solid rgba(200,160,120,0.3)", color: "#c8a078" }}>Falar no WhatsApp</a>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-5 py-10" style={{ background: "#080505", borderTop: "1px solid rgba(200,160,120,0.1)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2" style={{ color: "#c8a078" }}>Moncié Esthetique</h3>
            <p className="text-sm" style={{ color: "#a89080" }}>Beleza, autoestima e sofisticação.</p>
          </div>
          <div className="flex flex-wrap gap-6 items-center">
            <a href="https://www.instagram.com/moncieclinica/" target="_blank" rel="noopener noreferrer" className="text-sm transition hover:text-white" style={{ color: "#a89080" }}>Instagram</a>
            <a href="https://wa.me/556193578458" target="_blank" rel="noopener noreferrer" className="text-sm transition hover:text-white" style={{ color: "#a89080" }}>WhatsApp</a>
            <a href="#antes-depois" className="text-sm transition hover:text-white" style={{ color: "#a89080" }}>Antes & Depois</a>
            <a href="#contato" className="text-sm transition hover:text-white" style={{ color: "#a89080" }}>Localização</a>
            <a href="/agendar" className="text-sm transition hover:text-white" style={{ color: "#a89080" }}>Agendar</a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 text-center text-xs" style={{ color: "#4a3a32", borderTop: "1px solid rgba(200,160,120,0.06)" }}>
          © {new Date().getFullYear()} Moncié Esthetique. Todos os direitos reservados.
        </div>
      </footer>

      {/* ── WHATSAPP FIXO ── */}
      <a href="https://wa.me/556193578458" target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp" className="fixed bottom-6 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition hover:scale-110 active:scale-95 z-50" style={{ background: "#25D366" }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-7 h-7">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* ── CHAT ── */}
      <ChatWidget />

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      `}</style>
    </main>
  );
}