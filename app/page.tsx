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

    if (ref.current) observer.observe(ref.current);

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
        transform: inView ? "translateY(0)" : "translateY(30px)",
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
    img: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=900&q=80",
  },
  {
    nome: "Harmonização Facial",
    descricao:
      "Equilíbrio facial com técnicas modernas e resultados naturais.",
    img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80",
  },
  {
    nome: "Limpeza de Pele",
    descricao:
      "Renovação profunda para uma pele mais saudável e iluminada.",
    img: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=900&q=80",
  },
  {
    nome: "Peeling",
    descricao:
      "Tratamento avançado para rejuvenescimento facial.",
    img: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=900&q=80",
  },
  {
    nome: "Drenagem Linfática",
    descricao:
      "Redução de inchaço e melhora da circulação corporal.",
    img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&q=80",
  },
  {
    nome: "Preenchimento Labial",
    descricao:
      "Volume e definição com resultado sofisticado.",
    img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&q=80",
  },
];

export default function Home() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
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
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <img
              src="/logo-moncie-print.jpg"
              alt="Moncié"
              className="w-11 h-11 md:w-12 md:h-12 rounded-xl object-cover"
            />

            <div>
              <h1
                className="text-lg font-bold"
                style={{ color: "#c8a078" }}
              >
                Moncié
              </h1>

              <p className="text-[10px] md:text-xs text-neutral-400">
                Clínica de Estética
              </p>
            </div>
          </div>

          {/* MENU DESKTOP */}
          <div
            className="hidden lg:flex items-center gap-8 uppercase text-xs tracking-[0.2em]"
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

            <a
              href="#antesedepois"
              className="hover:text-white transition"
            >
              Antes e Depois
            </a>

            <a href="#contato" className="hover:text-white transition">
              Localização
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

          {/* MENU MOBILE */}
          <button
            className="lg:hidden flex flex-col gap-1.5"
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

        {menuAberto && (
          <div
            className="lg:hidden mt-5 rounded-3xl p-6 flex flex-col gap-5 uppercase text-xs tracking-[0.2em]"
            style={{
              background: "#120d0d",
              color: "#c8a078",
              border: "1px solid rgba(200,160,120,0.08)",
            }}
          >
            <a href="#inicio">Início</a>
            <a href="#procedimentos">Procedimentos</a>
            <a href="#sobre">Sobre</a>
            <a href="#antesedepois">Antes e Depois</a>
            <a href="#contato">Localização</a>

            <a
              href="/agendar"
              className="text-center py-4 rounded-full font-semibold"
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
        className="relative min-h-screen flex items-center justify-center text-center px-5 pt-28"
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
                "linear-gradient(to bottom, rgba(10,7,7,0.45), rgba(10,7,7,0.96))",
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl">
          <p
            className="uppercase tracking-[0.4em] text-[10px] md:text-xs mb-5"
            style={{ color: "#c8a078" }}
          >
            Clínica Premium
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-8">
            Beleza com
            <span style={{ color: "#c8a078" }}>
              {" "}
              sofisticação
            </span>
          </h1>

          <p
            className="text-sm sm:text-base md:text-xl max-w-2xl mx-auto leading-7 md:leading-8"
            style={{ color: "#a89080" }}
          >
            Tratamentos modernos, atendimento personalizado e
            resultados naturais para elevar sua autoestima.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center mt-12">
            <a
              href="/agendar"
              className="w-full md:w-auto px-8 py-5 rounded-full font-semibold uppercase tracking-widest text-sm transition hover:scale-105 text-center"
              style={{
                background: "#c8a078",
                color: "#0a0707",
              }}
            >
              Agendar Horário
            </a>

            <a
              href="#antesedepois"
              className="w-full md:w-auto px-8 py-5 rounded-full font-semibold uppercase tracking-widest text-sm transition hover:scale-105 text-center"
              style={{
                border: "1px solid rgba(200,160,120,0.3)",
                color: "#c8a078",
              }}
            >
              Antes e Depois
            </a>

            <a
              href="#contato"
              className="w-full md:w-auto px-8 py-5 rounded-full font-semibold uppercase tracking-widest text-sm transition hover:scale-105 text-center"
              style={{
                border: "1px solid rgba(200,160,120,0.3)",
                color: "#c8a078",
              }}
            >
              Localização
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

              <h2 className="text-3xl md:text-5xl font-bold">
                Estrutura Premium
              </h2>
            </div>

            <div className="max-w-3xl mx-auto rounded-3xl overflow-hidden border border-[#c8a07820]">
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
        className="py-24 md:py-28 px-5 bg-[#0a0707]"
      >
        <div className="max-w-7xl mx-auto">
          <FadeSection className="text-center mb-16">
            <p
              className="uppercase tracking-[0.3em] text-xs mb-4"
              style={{ color: "#c8a078" }}
            >
              Procedimentos
            </p>

            <h2 className="text-3xl md:text-5xl font-bold mb-6">
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
        className="py-24 md:py-28 px-5 bg-[#0d0909]"
      >
        <div className="max-w-6xl mx-auto">
          <FadeSection className="text-center mb-16">
            <p
              className="uppercase tracking-[0.3em] text-xs mb-4"
              style={{ color: "#c8a078" }}
            >
              Resultados Reais
            </p>

            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Antes e Depois
            </h2>

            <p
              className="max-w-2xl mx-auto"
              style={{ color: "#a89080" }}
            >
              Resultados naturais e sofisticados realizados
              na Moncié.
            </p>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FadeSection>
              <div
                className="rounded-3xl overflow-hidden"
                style={{
                  background: "#120d0d",
                  border:
                    "1px solid rgba(200,160,120,0.1)",
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=900&q=80"
                  alt="Antes e depois"
                  className="w-full h-[420px] object-cover"
                />

                <div className="p-6">
                  <h3
                    className="text-2xl mb-3"
                    style={{ color: "#c8a078" }}
                  >
                    Harmonização Facial
                  </h3>

                  <p style={{ color: "#a89080" }}>
                    Resultados naturais com técnicas modernas.
                  </p>
                </div>
              </div>
            </FadeSection>

            <FadeSection delay={120}>
              <div
                className="rounded-3xl overflow-hidden"
                style={{
                  background: "#120d0d",
                  border:
                    "1px solid rgba(200,160,120,0.1)",
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&q=80"
                  alt="Resultado paciente"
                  className="w-full h-[420px] object-cover"
                />

                <div className="p-6">
                  <h3
                    className="text-2xl mb-3"
                    style={{ color: "#c8a078" }}
                  >
                    Botox Premium
                  </h3>

                  <p style={{ color: "#a89080" }}>
                    Rejuvenescimento elegante e sofisticado.
                  </p>
                </div>
              </div>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section
        id="sobre"
        className="py-24 md:py-28 px-5 bg-[#0a0707]"
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
          <FadeSection>
            <img
              src="/imagem-clinica (4).jpeg"
              alt="Moncié"
              className="rounded-3xl h-[350px] md:h-[600px] object-cover w-full"
            />
          </FadeSection>

          <FadeSection delay={150}>
            <p
              className="uppercase tracking-[0.3em] text-xs mb-4"
              style={{ color: "#c8a078" }}
            >
              Sobre a Moncié
            </p>

            <h2 className="text-3xl md:text-5xl font-bold mb-8">
              Tecnologia, estética e excelência
            </h2>

            <p
              className="leading-8 text-base md:text-lg mb-6"
              style={{ color: "#a89080" }}
            >
              A Moncié nasceu para oferecer tratamentos
              sofisticados, modernos e personalizados.
            </p>

            <p
              className="leading-8 text-base md:text-lg mb-10"
              style={{ color: "#a89080" }}
            >
              Nossa equipe oferece atendimento humanizado,
              suporte personalizado e experiências premium.
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
              Entrar em Contato
            </a>
          </FadeSection>
        </div>
      </section>

      {/* CONTATO */}
      <section
        id="contato"
        className="py-24 md:py-28 px-5 bg-black text-center"
      >
        <div className="max-w-4xl mx-auto">
          <FadeSection>
            <p
              className="uppercase tracking-[0.3em] text-xs mb-4"
              style={{ color: "#c8a078" }}
            >
              Localização
            </p>

            <h2 className="text-3xl md:text-5xl font-bold mb-10">
              Visite a Moncié
            </h2>

            <div
              className="rounded-3xl overflow-hidden border border-[#c8a07820]"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3836.1!2d-47.65!3d-15.6!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTXCsDM2JzAwLjAiUyA0N8KwMzknMDAuMCJX!5e0!3m2!1spt-BR!2sbr!4v1"
                width="100%"
                height="350"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>

            <div className="mt-10">
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
            </div>
          </FadeSection>
        </div>
      </section>
    </main>
  );
}