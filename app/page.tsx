# app/page.tsx

```tsx
"use client";

import { useState, useEffect, useRef } from "react";

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
        transform: inView ? "translateY(0)" : "translateY(30px)",
        transition: `all 0.8s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const procedimentos = [
  {
    nome: "Botox",
    descricao: "Suaviza linhas de expressão com resultado natural.",
    img: "/imagem-clinica.jpg",
  },
  {
    nome: "Harmonização Facial",
    descricao: "Realce dos traços faciais com técnicas modernas.",
    img: "/imagem-clinica-2.jpg",
  },
  {
    nome: "Limpeza de Pele",
    descricao: "Pele renovada, hidratada e saudável.",
    img: "/imagem-clinica-3.jpg",
  },
  {
    nome: "Peeling",
    descricao: "Renovação celular e uniformização da pele.",
    img: "/imagem-clinica.jpg",
  },
  {
    nome: "Massagem Relaxante",
    descricao: "Relaxamento corporal e bem-estar completo.",
    img: "/imagem-clinica-2.jpg",
  },
  {
    nome: "Drenagem Linfática",
    descricao: "Redução de inchaço e melhora da circulação.",
    img: "/imagem-clinica-3.jpg",
  },
];

export default function Home() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
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
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(200,160,120,0.1)",
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

          <div
            className="hidden md:flex items-center gap-7 uppercase text-xs tracking-[0.18em]"
            style={{ color: "#c8a078" }}
          >
            <a href="#inicio">Início</a>
            <a href="#procedimentos">Procedimentos</a>
            <a href="#antes">Antes e Depois</a>
            <a href="#sobre">Sobre</a>
            <a href="#contato">Contato</a>

            <a
              href="/agendar"
              className="px-6 py-3 rounded-full font-semibold transition hover:scale-105"
              style={{ background: "#c8a078", color: "#0a0707" }}
            >
              Agendar
            </a>
          </div>

          <button
            className="md:hidden flex flex-col gap-1.5"
            onClick={() => setMenuAberto(!menuAberto)}
          >
            <span className="w-6 h-0.5 bg-[#c8a078]" />
            <span className="w-6 h-0.5 bg-[#c8a078]" />
            <span className="w-6 h-0.5 bg-[#c8a078]" />
          </button>
        </div>

        {menuAberto && (
          <div
            className="md:hidden mt-5 rounded-2xl p-5 flex flex-col gap-5 uppercase text-xs tracking-[0.18em]"
            style={{
              background: "#120d0d",
              color: "#c8a078",
              border: "1px solid rgba(200,160,120,0.1)",
            }}
          >
            <a href="#inicio">Início</a>
            <a href="#procedimentos">Procedimentos</a>
            <a href="#antes">Antes e Depois</a>
            <a href="#sobre">Sobre</a>
            <a href="#contato">Contato</a>

            <a
              href="/agendar"
              className="text-center py-3 rounded-full font-semibold"
              style={{ background: "#c8a078", color: "#0a0707" }}
            >
              Agendar Agora
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
          <video
            src="/video-clinica.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-25"
          />

          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(10,7,7,0.6), rgba(10,7,7,0.96))",
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl">
          <p
            className="uppercase tracking-[0.35em] text-xs mb-5"
            style={{ color: "#c8a078" }}
          >
            Clínica Premium
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-6">
            Beleza com
            <span style={{ color: "#c8a078" }}> sofisticação</span>
          </h1>

          <p
            className="text-base md:text-xl max-w-2xl mx-auto leading-8 mb-10"
            style={{ color: "#a89080" }}
          >
            Atendimento inteligente e personalizado para oferecer
            uma experiência sofisticada e acolhedora.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/agendar"
              className="px-10 py-5 rounded-full font-semibold uppercase tracking-widest text-sm transition hover:scale-105 text-center"
              style={{ background: "#c8a078", color: "#0a0707" }}
            >
              Agendar Horário
            </a>

            <a
              href="#antes"
              className="px-10 py-5 rounded-full font-semibold uppercase tracking-widest text-sm transition hover:scale-105 text-center"
              style={{
                border: "1px solid rgba(200,160,120,0.3)",
                color: "#c8a078",
              }}
            >
              Antes e Depois
            </a>
          </div>
        </div>
      </section>

      {/* PROCEDIMENTOS */}
      <section id="procedimentos" className="py-28 px-5 bg-[#0d0909]">
        <div className="max-w-7xl mx-auto">
          <FadeSection className="text-center mb-16">
            <p
              className="uppercase tracking-[0.3em] text-xs mb-4"
              style={{ color: "#c8a078" }}
            >
              Procedimentos
            </p>

            <h2 className="text-4xl md:text-5xl font-bold mb-5">
              Tratamentos Exclusivos
            </h2>
          </FadeSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {procedimentos.map((item, i) => (
              <FadeSection key={i} delay={i * 60}>
                <div
                  className="rounded-3xl overflow-hidden h-full"
                  style={{
                    background: "#120d0d",
                    border: "1px solid rgba(200,160,120,0.1)",
                  }}
                >
                  <img
                    src={item.img}
                    alt={item.nome}
                    className="w-full h-64 object-cover"
                  />

                  <div className="p-6">
                    <h3
                      className="text-2xl mb-3"
                      style={{ color: "#c8a078" }}
                    >
                      {item.nome}
                    </h3>

                    <p
                      className="leading-7 text-sm mb-6"
                      style={{ color: "#a89080" }}
                    >
                      {item.descricao}
                    </p>

                    <a
                      href="/agendar"
                      className="inline-block px-6 py-3 rounded-full text-sm uppercase tracking-widest font-semibold"
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

      {/* ANTES E DEPOIS */}
      <section id="antes" className="py-28 px-5 bg-[#0a0707]">
        <div className="max-w-7xl mx-auto">
          <FadeSection className="text-center mb-16">
            <p
              className="uppercase tracking-[0.3em] text-xs mb-4"
              style={{ color: "#c8a078" }}
            >
              Resultados Reais
            </p>

            <h2 className="text-4xl md:text-5xl font-bold mb-5">
              Antes e Depois
            </h2>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <img
              src="/antes1.jpg"
              alt="Antes e Depois"
              className="rounded-3xl h-[520px] w-full object-cover"
            />

            <img
              src="/antes2.jpg"
              alt="Antes e Depois"
              className="rounded-3xl h-[520px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="py-28 px-5 bg-[#0d0909]">
        <div className="max-w-7xl mx-auto">
          <FadeSection className="text-center mb-16">
            <p
              className="uppercase tracking-[0.3em] text-xs mb-4"
              style={{ color: "#c8a078" }}
            >
              Moncié Esthétique
            </p>

            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Sofisticação, tecnologia e beleza
            </h2>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <img
              src="/imagem-clinica.jpg"
              alt="Clínica"
              className="rounded-3xl h-[500px] w-full object-cover"
            />

            <video
              src="/video-clinica.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="rounded-3xl h-[500px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="py-28 px-5 bg-black text-center">
        <div className="max-w-4xl mx-auto">
          <FadeSection>
            <p
              className="uppercase tracking-[0.3em] text-xs mb-4"
              style={{ color: "#c8a078" }}
            >
              Localização
            </p>

            <div
              className="text-sm leading-8 mb-10"
              style={{ color: "#a89080" }}
            >
              <p>Avenida Independência, Centro Clínico CDC</p>
              <p>Clínica Moncié — 3º andar, sala 300</p>
              <p>Brasília - DF</p>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Agende sua avaliação
            </h2>

            <p
              className="text-lg leading-8 mb-10"
              style={{ color: "#a89080" }}
            >
              Nossa equipe responde rapidamente para tirar dúvidas
              e realizar seu atendimento personalizado.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/agendar"
                className="px-10 py-5 rounded-full uppercase tracking-widest text-sm font-semibold"
                style={{ background: "#c8a078", color: "#0a0707" }}
              >
                Solicitar Horário
              </a>

              <a
                href="https://wa.me/556193578458"
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-5 rounded-full uppercase tracking-widest text-sm font-semibold"
                style={{
                  border: "1px solid rgba(200,160,120,0.3)",
                  color: "#c8a078",
                }}
              >
                WhatsApp
              </a>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* WHATSAPP FIXO */}
      <a
        href="https://wa.me/556193578458"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-5 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-2xl transition hover:scale-110 z-50"
        style={{ background: "#25D366" }}
      >
        💬
      </a>
    </main>
  );
}
