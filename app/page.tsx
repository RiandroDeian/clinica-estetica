"use client";

import { useState, useEffect, useRef } from "react";

// Hook para animação ao entrar na tela
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

// Componente de seção com fade ao entrar
function FadeSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const depoimentos = [
  {
    nome: "Ana Luiza",
    texto:
      "Fiz harmonização facial e o resultado foi incrível. Atendimento super cuidadoso e ambiente aconchegante. Recomendo demais!",
    procedimento: "Harmonização Facial",
    estrelas: 5,
  },
  {
    nome: "Camila Souza",
    texto:
      "A limpeza de pele mudou minha autoestima. Profissional atenciosa, explicou tudo direitinho. Já agendei a próxima sessão!",
    procedimento: "Limpeza de Pele",
    estrelas: 5,
  },
  {
    nome: "Fernanda Lima",
    texto:
      "Botox muito natural, exatamente o que eu queria. A clínica é sofisticada e o atendimento é impecável.",
    procedimento: "Botox",
    estrelas: 5,
  },
];

const procedimentos = [
  {
    nome: "Botox",
    descricao: "Suaviza linhas de expressão com resultado natural e duradouro.",
    img: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=75",
  },
  {
    nome: "Harmonização Facial",
    descricao: "Realce dos traços com preenchedores e técnicas modernas.",
    img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=75",
  },
  {
    nome: "Limpeza de Pele",
    descricao: "Pele renovada, limpa e radiante com protocolo premium.",
    img: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800&q=75",
  },
  {
    nome: "Peeling",
    descricao: "Renovação celular para uma pele mais jovem e uniforme.",
    img: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=75",
  },
  {
    nome: "Massagem Relaxante",
    descricao: "Alívio do estresse com técnicas terapêuticas especializadas.",
    img: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&q=75",
  },
  {
    nome: "Drenagem Linfática",
    descricao: "Reduz inchaço e melhora a circulação com resultado imediato.",
    img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=75",
  },
  {
    nome: "Harmonização de Glúteo",
    descricao: "Modelagem e volumização com técnicas seguras para contorno corporal perfeito.",
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=75",
  },
];

const stats = [
  { valor: "+500", label: "Clientes", icone: "👥" },
  { valor: "98%", label: "Satisfação", icone: "⭐" },
  { valor: "Premium", label: "Experiência", icone: "✦" },
  { valor: "IA", label: "Atendimento", icone: "🤖" },
];

export default function Home() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main
      className="min-h-svh bg-[#0a0707] text-white overflow-x-hidden"
      style={{ fontFamily: "Georgia, serif" }}
    >
      {/* ── NAVBAR ── */}
      <nav
        className="fixed top-0 z-50 w-full px-5 md:px-10 py-4 transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(10,7,7,0.97)"
            : "rgba(10,7,7,0.75)",
          backdropFilter: "blur(12px)",
          borderBottom: scrolled
            ? "1px solid rgba(200,160,120,0.18)"
            : "1px solid transparent",
        }}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/logo-moncie-print.jpg"
              alt="Moncie"
              className="w-12 h-12 rounded-xl object-cover"
            />
            <div>
              <h1 className="text-lg font-bold leading-tight" style={{ color: "#c8a078" }}>
                Moncie
              </h1>
              <p className="text-[10px] text-neutral-400 leading-tight">Clínica de Estética</p>
            </div>
          </div>

          {/* Menu desktop */}
          <div className="hidden md:flex items-center gap-7 uppercase text-xs tracking-[0.18em]" style={{ color: "#c8a078" }}>
            <a href="#inicio" className="hover:text-white transition">Início</a>
            <a href="#procedimentos" className="hover:text-white transition">Procedimentos</a>
            <a href="#sobre" className="hover:text-white transition">Sobre</a>
            <a href="#contato" className="hover:text-white transition">Contato</a>
            {/* Botão destacado */}
            <a
              href="/agendar"
              className="px-6 py-2.5 rounded-full font-semibold transition hover:scale-105"
              style={{ background: "#c8a078", color: "#0a0707" }}
            >
              Agendar
            </a>
          </div>

          {/* Botão hamburguer mobile */}
          <button
            className="md:hidden flex flex-col gap-[5px] p-2"
            onClick={() => setMenuAberto(!menuAberto)}
            aria-label="Abrir menu"
          >
            <span
              className="w-6 h-0.5 transition-all duration-300"
              style={{
                background: "#c8a078",
                transform: menuAberto ? "rotate(45deg) translate(5px, 5px)" : "none",
              }}
            />
            <span
              className="w-6 h-0.5 transition-all duration-300"
              style={{
                background: "#c8a078",
                opacity: menuAberto ? 0 : 1,
              }}
            />
            <span
              className="w-6 h-0.5 transition-all duration-300"
              style={{
                background: "#c8a078",
                transform: menuAberto ? "rotate(-45deg) translate(5px, -5px)" : "none",
              }}
            />
          </button>
        </div>

        {/* Menu mobile com animação */}
        <div
          className="md:hidden overflow-hidden transition-all duration-300"
          style={{ maxHeight: menuAberto ? "400px" : "0px", opacity: menuAberto ? 1 : 0 }}
        >
          <div
            className="flex flex-col gap-4 pt-6 pb-6 mt-4 rounded-2xl px-5 uppercase text-xs tracking-[0.18em]"
            style={{
              color: "#c8a078",
              background: "#120d0d",
              border: "1px solid rgba(200,160,120,0.1)",
            }}
          >
            {["inicio", "procedimentos", "sobre", "contato"].map((item) => (
              <a
                key={item}
                href={`#${item}`}
                onClick={() => setMenuAberto(false)}
                className="hover:text-white transition capitalize"
              >
                {item === "inicio" ? "Início" : item.charAt(0).toUpperCase() + item.slice(1)}
              </a>
            ))}
            <a
              href="/agendar"
              onClick={() => setMenuAberto(false)}
              className="mt-2 text-center py-3 rounded-full font-semibold transition hover:scale-105"
              style={{ background: "#c8a078", color: "#0a0707" }}
            >
              Agendar Agora
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        id="inicio"
        className="relative min-h-[100svh] flex items-center justify-center text-center px-5"
      >
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&q=75"
            alt="background"
            className="w-full h-full object-cover opacity-20"
            loading="eager"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(10,7,7,0.5), rgba(10,7,7,0.97))" }}
          />
        </div>

        <div
          className="absolute w-[280px] h-[280px] md:w-[420px] md:h-[420px] rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(200,160,120,0.07)", top: "8%", left: "3%" }}
        />

        <div className="relative z-10 max-w-5xl w-full">
          <p
            className="uppercase tracking-[0.35em] text-xs mb-5"
            style={{ color: "#c8a078", animationDelay: "0ms" }}
          >
            Clínica Premium
          </p>

          <h1
            className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-6"
            style={{ animation: "fadeUp 0.8s ease both" }}
          >
            Beleza com
            <span style={{ color: "#c8a078" }}> sofisticação</span>
          </h1>

          <p
            className="text-base md:text-xl max-w-xl md:max-w-2xl mx-auto leading-8 mb-12"
            style={{ color: "#a89080", animation: "fadeUp 0.8s ease 0.15s both" }}
          >
            Tratamentos modernos, atendimento premium e resultados naturais para elevar sua autoestima.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            style={{ animation: "fadeUp 0.8s ease 0.3s both" }}
          >
            <a
              href="/agendar"
              className="w-full sm:w-auto px-10 py-5 rounded-full font-semibold uppercase tracking-widest text-sm transition hover:scale-105 active:scale-95 text-center"
              style={{ background: "#c8a078", color: "#0a0707" }}
            >
              Agendar Horário
            </a>

            <a
              href="https://www.instagram.com/moncieclinica/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-10 py-5 rounded-full font-semibold uppercase tracking-widest text-sm transition hover:scale-105 active:scale-95 text-center"
              style={{ border: "1px solid rgba(200,160,120,0.3)", color: "#c8a078" }}
            >
              Instagram
            </a>
          </div>
        </div>
      </section>

      {/* ── AUTORIDADE ── */}
      <section className="py-20 bg-[#0d0909]">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((item, i) => (
              <FadeSection key={i} delay={i * 80}>
                <div
                  className="rounded-3xl p-6 md:p-8 text-center transition hover:scale-[1.03] duration-300"
                  style={{
                    background: "#120d0d",
                    border: "1px solid rgba(200,160,120,0.1)",
                  }}
                >
                  <div className="text-2xl mb-3">{item.icone}</div>
                  <h3 className="text-3xl md:text-4xl mb-2 font-bold" style={{ color: "#c8a078" }}>
                    {item.valor}
                  </h3>
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
          <FadeSection className="text-center mb-16">
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: "#c8a078" }}>
              Procedimentos
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-5">Tratamentos Exclusivos</h2>
            <p className="max-w-2xl mx-auto" style={{ color: "#a89080" }}>
              Procedimentos modernos para realçar sua beleza natural com segurança e sofisticação.
            </p>
          </FadeSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {procedimentos.map((item, i) => (
              <FadeSection key={i} delay={i * 60}>
                <div
                  className="rounded-3xl overflow-hidden h-full flex flex-col transition hover:scale-[1.02] duration-300"
                  style={{
                    background: "#120d0d",
                    border: "1px solid rgba(200,160,120,0.1)",
                  }}
                >
                  <img
                    src={item.img}
                    alt={item.nome}
                    className="w-full h-56 sm:h-64 object-cover"
                    loading="lazy"
                  />
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl mb-2 font-semibold" style={{ color: "#c8a078" }}>
                      {item.nome}
                    </h3>
                    <p className="text-sm leading-6 mb-5 flex-1" style={{ color: "#a89080" }}>
                      {item.descricao}
                    </p>
                    <a
                      href="/agendar"
                      className="inline-block px-6 py-3 rounded-full text-sm uppercase tracking-widest transition hover:scale-105 active:scale-95 text-center font-semibold"
                      style={{ background: "#c8a078", color: "#0a0707" }}
                    >
                      Agendar
                    </a>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section className="py-28 px-5 bg-[#0d0909]">
        <div className="max-w-6xl mx-auto">
          <FadeSection className="text-center mb-16">
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: "#c8a078" }}>
              Depoimentos
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-5">O que dizem nossas clientes</h2>
            <p className="max-w-xl mx-auto" style={{ color: "#a89080" }}>
              Resultados reais e experiências transformadoras.
            </p>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {depoimentos.map((item, i) => (
              <FadeSection key={i} delay={i * 80}>
                <div
                  className="rounded-3xl p-7 h-full flex flex-col gap-4 transition hover:scale-[1.02] duration-300"
                  style={{
                    background: "#120d0d",
                    border: "1px solid rgba(200,160,120,0.1)",
                  }}
                >
                  {/* Estrelas */}
                  <div className="flex gap-1">
                    {Array.from({ length: item.estrelas }).map((_, s) => (
                      <span key={s} style={{ color: "#c8a078" }}>★</span>
                    ))}
                  </div>

                  <p className="leading-7 flex-1 text-sm" style={{ color: "#a89080" }}>
                    "{item.texto}"
                  </p>

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
      <section id="sobre" className="py-28 px-5 bg-[#0a0707]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <FadeSection>
            <img
              src="https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=900&q=75"
              alt="Clínica Moncie"
              className="rounded-3xl h-72 md:h-[560px] w-full object-cover"
              loading="lazy"
            />
          </FadeSection>

          <FadeSection delay={150}>
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: "#c8a078" }}>
              Sobre a Moncie
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
              Tecnologia, estética e excelência
            </h2>
            <p className="leading-8 text-lg mb-6" style={{ color: "#a89080" }}>
              A Moncie nasceu para oferecer tratamentos sofisticados, modernos e personalizados.
            </p>
            <p className="leading-8 text-lg mb-10" style={{ color: "#a89080" }}>
              Nossa missão é elevar a autoestima através de atendimento premium e resultados naturais.
            </p>
            <a
              href="https://wa.me/556193578458"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-5 rounded-full uppercase tracking-widest text-sm font-semibold transition hover:scale-105 active:scale-95 inline-block"
              style={{ background: "#c8a078", color: "#0a0707" }}
            >
              Entrar em Contato
            </a>
          </FadeSection>
        </div>
      </section>

      {/* ── CTA / CONTATO ── */}
      <section id="contato" className="py-28 px-5 text-center bg-black">
        <div className="max-w-4xl mx-auto">
          <FadeSection>
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: "#c8a078" }}>
              Localização
            </p>

            <div className="mt-6 text-sm leading-8" style={{ color: "#a89080" }}>
              <p>Avenida Independência, Centro Clínico CDC</p>
              <p>Clínica Moncie — 3º andar, sala 300</p>
              <p>QD51 LT16A — CEP 73330-003</p>
              <p>Setor Tradicional (Planaltina) — Brasília - DF</p>
            </div>

            <div className="mt-8 rounded-3xl overflow-hidden border border-[#c8a07820]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3836.1!2d-47.65!3d-15.6!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTXCsDM2JzAwLjAiUyA0N8KwMzknMDAuMCJX!5e0!3m2!1spt-BR!2sbr!4v1"
                width="100%"
                height="300"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
              />
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6 mt-16">
              Agende pelo WhatsApp
            </h2>

            <p className="text-lg leading-8 mb-10" style={{ color: "#a89080" }}>
              Nossa assistente virtual responde dúvidas e faz pré-agendamentos automaticamente.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/agendar"
                className="inline-block px-10 py-5 rounded-full uppercase tracking-widest text-sm font-semibold transition hover:scale-105 active:scale-95"
                style={{ background: "#c8a078", color: "#0a0707" }}
              >
                Agendar Online
              </a>

              <a
                href="https://wa.me/556193578458"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-10 py-5 rounded-full uppercase tracking-widest text-sm font-semibold transition hover:scale-105 active:scale-95"
                style={{ border: "1px solid rgba(200,160,120,0.3)", color: "#c8a078" }}
              >
                Falar no WhatsApp
              </a>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="px-5 py-10"
        style={{
          background: "#080505",
          borderTop: "1px solid rgba(200,160,120,0.1)",
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2" style={{ color: "#c8a078" }}>
              Moncie Estética
            </h3>
            <p className="text-sm" style={{ color: "#a89080" }}>Beleza, autoestima e tecnologia.</p>
          </div>

          <div className="flex flex-wrap gap-6 items-center">
            <a
              href="https://www.instagram.com/moncieclinica/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm transition hover:text-white"
              style={{ color: "#a89080" }}
            >
              Instagram
            </a>
            <a
              href="https://wa.me/556193578458"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm transition hover:text-white"
              style={{ color: "#a89080" }}
            >
              WhatsApp
            </a>
            <a
              href="/agendar"
              className="text-sm transition hover:text-white"
              style={{ color: "#a89080" }}
            >
              Agendar
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-6 text-center text-xs" style={{
          color: "#4a3a32",
          borderTop: "1px solid rgba(200,160,120,0.06)"
        }}>
          © {new Date().getFullYear()} Moncie Estética. Todos os direitos reservados.
        </div>
      </footer>

      {/* ── WHATSAPP FIXO ── */}
      <a
        href="https://wa.me/556193578458"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed bottom-6 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition hover:scale-110 active:scale-95 z-50"
        style={{ background: "#25D366" }}
      >
        {/* Ícone SVG oficial do WhatsApp */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="white"
          className="w-7 h-7"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      {/* Animações globais */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}