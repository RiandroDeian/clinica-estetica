"use client";

import { useEffect, useRef, useState } from "react";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

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
        transform: inView
          ? "translateY(0)"
          : "translateY(30px)",
        transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const procedimentos = [
  {
    nome: "Botox",
    descricao:
      "Suaviza linhas de expressão com resultado natural e sofisticado.",
    img: "/imagem-clinica (1).jpeg",
  },
  {
    nome: "Harmonização Facial",
    descricao:
      "Equilíbrio facial com técnicas modernas e resultados naturais.",
    img: "/imagem-clinica (2).jpeg",
  },
  {
    nome: "Limpeza de Pele",
    descricao:
      "Renovação profunda para uma pele mais saudável e iluminada.",
    img: "/imagem-clinica (3).jpeg",
  },
  {
    nome: "Peeling",
    descricao:
      "Tratamento avançado para renovação celular e rejuvenescimento.",
    img: "/imagem-clinica (4).jpeg",
  },
  {
    nome: "Drenagem Linfática",
    descricao:
      "Redução de inchaço e melhora da circulação corporal.",
    img: "/imagem-clinica (5).jpeg",
  },
];

export default function Home() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main
      className="min-h-screen bg-[#0a0707] text-white overflow-x-hidden"
      style={{ fontFamily: "Georgia, serif" }}
    >
      {/* NAVBAR */}
      <nav
        className="fixed top-0 z-50 w-full px-5 md:px-10 py-4 transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(10,7,7,0.96)"
            : "rgba(10,7,7,0.75)",
          backdropFilter: "blur(10px)",
          borderBottom: scrolled
            ? "1px solid rgba(200,160,120,0.12)"
            : "1px solid transparent",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-moncie-print.jpg"
              alt="Moncié"
              className="w-12 h-12 rounded-xl object-cover"
            />

            <div>
              <h1
                className="text-lg font-bold"
                style={{ color: "#c8a078" }}
              >
                Moncié
              </h1>

              <p className="text-xs text-neutral-400">
                Clínica de Estética
              </p>
            </div>
          </div>

          {/* DESKTOP */}
          <div
            className="hidden md:flex items-center gap-8 uppercase text-xs tracking-[0.2em]"
            style={{ color: "#c8a078" }}
          >
            <a href="#inicio" className="hover:text-white transition">
              Início
            </a>

            <a
              href="#procedimentos"
              className="hover:text-white transition"
            >
              Procedimentos
            </a>

            <a href="#sobre" className="hover:text-white transition">
              Sobre
            </a>

            <a href="#contato" className="hover:text-white transition">
              Contato
            </a>

            <a
              href="/agendar"
              className="px-6 py-3 rounded-full font-semibold transition hover:scale-105"
              style={{
                background: "#c8a078",
                color: "#0a0707",
              }}
            >
              Agendar
            </a>
          </div>

          {/* MOBILE BUTTON */}
          <button
            className="md:hidden flex flex-col gap-1.5"
            onClick={() => setMenuAberto(!menuAberto)}
          >
            <span
              className="w-6 h-0.5"
              style={{ background: "#c8a078" }}
            />
            <span
              className="w-6 h-0.5"
              style={{ background: "#c8a078" }}
            />
            <span
              className="w-6 h-0.5"
              style={{ background: "#c8a078" }}
            />
          </button>
        </div>

        {/* MOBILE MENU */}
        {menuAberto && (
          <div
            className="md:hidden flex flex-col gap-5 pt-6 pb-4 uppercase text-xs tracking-[0.2em]"
            style={{ color: "#c8a078" }}
          >
            <a href="#inicio">Início</a>
            <a href="#procedimentos">Procedimentos</a>
            <a href="#sobre">Sobre</a>
            <a href="#contato">Contato</a>

            <a
              href="/agendar"
              className="text-center py-3 rounded-full font-semibold"
              style={{
                background: "#c8a078",
                color: "#0a0707",
              }}
            >
              Agendar
            </a>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section
        id="inicio"
        className="relative min-h-screen flex items-center justify-center text-center px-5"
      >
        <div className="absolute inset-0">
          <img
            src="/imagem-clinica (1).jpeg"
            alt="Clínica"
            className="w-full h-full object-cover opacity-20"
          />

          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(10,7,7,0.55), rgba(10,7,7,0.96))",
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl">
          <p
            className="uppercase tracking-[0.4em] text-xs mb-5"
            style={{ color: "#c8a078" }}
          >
            Clínica Premium
          </p>

          <h1 className="text-4xl md:text-7xl font-bold leading-tight mb-8">
            Beleza com
            <span style={{ color: "#c8a078" }}>
              {" "}
              sofisticação
            </span>
          </h1>

          <p
            className="text-base md:text-xl max-w-2xl mx-auto leading-8"
            style={{ color: "#a89080" }}
          >
            Tratamentos modernos, atendimento personalizado e
            resultados naturais para elevar sua autoestima.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center mt-12">
            <a
              href="/agendar"
              className="px-10 py-5 rounded-full font-semibold uppercase tracking-widest text-sm transition hover:scale-105"
              style={{
                background: "#c8a078",
                color: "#0a0707",
              }}
            >
              Agendar Horário
            </a>

            <a
              href="#antesedepois"
              className="px-10 py-5 rounded-full font-semibold uppercase tracking-widest text-sm transition hover:scale-105"
              style={{
                border:
                  "1px solid rgba(200,160,120,0.3)",
                color: "#c8a078",
              }}
            >
              Antes e Depois
            </a>
          </div>
        </div>
      </section>

      {/* VIDEO */}
      <section className="py-24 px-5 bg-[#0d0909]">
        <div className="max-w-5xl mx-auto">
          <FadeSection>
            <div className="text-center mb-12">
              <p
                className="uppercase tracking-[0.3em] text-xs mb-4"
                style={{ color: "#c8a078" }}
              >
                Conheça a Clínica
              </p>

              <h2 className="text-4xl md:text-5xl font-bold">
                Estrutura Premium
              </h2>
            </div>

            <div className="rounded-3xl overflow-hidden border border-[#c8a07820]">
              <video
                src="/video-clinica.mp4"
                controls
                autoPlay
                muted
                loop
                className="w-full"
              />
            </div>
          </FadeSection>
        </div>
      </section>

      {/* PROCEDIMENTOS */}
      <section
        id="procedimentos"
        className="py-28 px-5 bg-[#0a0707]"
      >
        <div className="max-w-7xl mx-auto">
          <FadeSection className="text-center mb-16">
            <p
              className="uppercase tracking-[0.3em] text-xs mb-4"
              style={{ color: "#c8a078" }}
            >
              Procedimentos
            </p>

            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Tratamentos Exclusivos
            </h2>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {procedimentos.map((item, i) => (
              <FadeSection key={i} delay={i * 80}>
                <div
                  className="rounded-3xl overflow-hidden h-full"
                  style={{
                    background: "#120d0d",
                    border:
                      "1px solid rgba(200,160,120,0.1)",
                  }}
                >
                  <img
                    src={item.img}
                    alt={item.nome}
                    className="w-full h-72 object-cover"
                  />

                  <div className="p-6">
                    <h3
                      className="text-2xl mb-4"
                      style={{ color: "#c8a078" }}
                    >
                      {item.nome}
                    </h3>

                    <p
                      className="leading-7 mb-6"
                      style={{ color: "#a89080" }}
                    >
                      {item.descricao}
                    </p>

                    <a
                      href="/agendar"
                      className="inline-block px-6 py-3 rounded-full text-sm uppercase tracking-widest transition hover:scale-105"
                      style={{
                        background: "#c8a078",
                        color: "#0a0707",
                      }}
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

      {/* ANTES E DEPOIS */}
      <section
        id="antesedepois"
        className="py-28 px-5 bg-[#0d0909]"
      >
        <div className="max-w-6xl mx-auto">
          <FadeSection className="text-center mb-16">
            <p
              className="uppercase tracking-[0.3em] text-xs mb-4"
              style={{ color: "#c8a078" }}
            >
              Resultados Reais
            </p>

            <h2 className="text-4xl md:text-5xl font-bold">
              Antes e Depois
            </h2>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <img
              src="/imagem-clinica (2).jpeg"
              className="rounded-3xl h-[420px] object-cover w-full"
            />

            <img
              src="/imagem-clinica (3).jpeg"
              className="rounded-3xl h-[420px] object-cover w-full"
            />
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section
        id="sobre"
        className="py-28 px-5 bg-[#0a0707]"
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <FadeSection>
            <img
              src="/imagem-clinica (4).jpeg"
              className="rounded-3xl h-[600px] object-cover w-full"
            />
          </FadeSection>

          <FadeSection delay={150}>
            <p
              className="uppercase tracking-[0.3em] text-xs mb-4"
              style={{ color: "#c8a078" }}
            >
              Sobre a Moncié
            </p>

            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              Tecnologia, estética e excelência
            </h2>

            <p
              className="leading-8 text-lg mb-6"
              style={{ color: "#a89080" }}
            >
              A Moncié nasceu para oferecer tratamentos
              sofisticados, modernos e personalizados.
            </p>

            <p
              className="leading-8 text-lg mb-10"
              style={{ color: "#a89080" }}
            >
              Nossa equipe oferece atendimento humanizado,
              suporte personalizado e experiências premium.
            </p>

            <a
              href="https://wa.me/556193578458"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-5 rounded-full uppercase tracking-widest text-sm font-semibold transition hover:scale-105 inline-block"
              style={{
                background: "#c8a078",
                color: "#0a0707",
              }}
            >
              Entrar em Contato
            </a>
          </FadeSection>
        </div>
      </section>

      {/* CONTATO */}
      <section
        id="contato"
        className="py-28 px-5 text-center bg-black"
      >
        <div className="max-w-4xl mx-auto">
          <FadeSection>
            <p
              className="uppercase tracking-[0.3em] text-xs mb-4"
              style={{ color: "#c8a078" }}
            >
              Atendimento
            </p>

            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              Agende pelo WhatsApp
            </h2>

            <p
              className="text-lg leading-8 mb-10"
              style={{ color: "#a89080" }}
            >
              Nossa equipe responde dúvidas, realiza
              atendimentos personalizados e auxilia no seu
              agendamento.
            </p>

            <a
              href="https://wa.me/556193578458"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-10 py-5 rounded-full uppercase tracking-widest text-sm font-semibold transition hover:scale-105"
              style={{
                background: "#c8a078",
                color: "#0a0707",
              }}
            >
              Falar no WhatsApp
            </a>
          </FadeSection>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="px-5 py-10"
        style={{
          background: "#080505",
          borderTop:
            "1px solid rgba(200,160,120,0.1)",
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h3
              className="text-2xl font-bold mb-3"
              style={{ color: "#c8a078" }}
            >
              Moncié Estética
            </h3>

            <p style={{ color: "#a89080" }}>
              Beleza, autoestima e tecnologia.
            </p>
          </div>

          <div className="flex gap-6">
            <a
              href="https://www.instagram.com/moncieclinica/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#a89080" }}
            >
              Instagram
            </a>

            <a
              href="https://wa.me/556193578458"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#a89080" }}
            >
              WhatsApp
            </a>
          </div>
        </div>
      </footer>

      {/* WHATSAPP FIXO */}
      <a
        href="https://wa.me/556193578458"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-2xl transition hover:scale-110 z-50"
        style={{ background: "#25D366" }}
      >
        💬
      </a>
    </main>
  );
}