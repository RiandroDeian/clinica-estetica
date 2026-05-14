"use client";

import { useState } from "react";

export default function Home() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <main
      className="min-h-screen bg-[#0a0707] text-white overflow-x-hidden"
      style={{ fontFamily: "Georgia, serif" }}
    >
      {/* NAVBAR */}
      <nav
        className="fixed top-0 z-50 w-full px-6 md:px-10 py-5"
        style={{
          background: "rgba(10,7,7,0.85)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(200,160,120,0.12)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/logo-moncie-print.jpg"
              alt="Moncie"
              className="w-14 h-14 rounded-xl object-cover"
            />

            <div>
              <h1 className="text-xl font-bold" style={{ color: "#c8a078" }}>
                Moncie
              </h1>
              <p className="text-xs text-neutral-400">Clinica de Estetica</p>
            </div>
          </div>

          {/* MENU DESKTOP */}
          <div
            className="hidden md:flex gap-8 uppercase text-xs tracking-[0.2em]"
            style={{ color: "#c8a078" }}
          >
            <a href="#inicio" className="hover:text-white transition">
              Inicio
            </a>
            <a href="#procedimentos" className="hover:text-white transition">
              Procedimentos
            </a>
            <a href="#sobre" className="hover:text-white transition">
              Sobre
            </a>
            <a href="#contato" className="hover:text-white transition">
              Contato
            </a>
            <a href="/agendar" className="hover:text-white transition">
              Agendar
            </a>
          </div>

          {/* BOTAO MOBILE */}
          <button
            className="md:hidden flex flex-col gap-1.5"
            onClick={() => setMenuAberto(!menuAberto)}
          >
            <span className="w-6 h-0.5" style={{ background: "#c8a078" }} />
            <span className="w-6 h-0.5" style={{ background: "#c8a078" }} />
            <span className="w-6 h-0.5" style={{ background: "#c8a078" }} />
          </button>
        </div>

        {/* MENU MOBILE */}
        {menuAberto && (
          <div
            className="md:hidden flex flex-col gap-5 pt-6 pb-6 mt-4 rounded-2xl px-4 uppercase text-xs tracking-[0.2em]"
            style={{
              color: "#c8a078",
              background: "#120d0d",
              border: "1px solid rgba(200,160,120,0.1)",
            }}
          >
            <a
              href="#inicio"
              onClick={() => setMenuAberto(false)}
              className="hover:text-white transition"
            >
              Inicio
            </a>

            <a
              href="#procedimentos"
              onClick={() => setMenuAberto(false)}
              className="hover:text-white transition"
            >
              Procedimentos
            </a>

            <a
              href="#sobre"
              onClick={() => setMenuAberto(false)}
              className="hover:text-white transition"
            >
              Sobre
            </a>

            <a
              href="#contato"
              onClick={() => setMenuAberto(false)}
              className="hover:text-white transition"
            >
              Contato
            </a>

            <a
              href="/agendar"
              onClick={() => setMenuAberto(false)}
              className="hover:text-white transition"
            >
              Agendar
            </a>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section
        id="inicio"
        className="relative min-h-[100svh] flex items-center justify-center text-center px-6"
      >
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1600&q=80"
            alt="background"
            className="w-full h-full object-cover opacity-20"
          />

          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(10,7,7,0.6), rgba(10,7,7,0.95))",
            }}
          />
        </div>

        <div
          className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full blur-3xl"
          style={{
            background: "rgba(200,160,120,0.08)",
            top: "10%",
            left: "5%",
          }}
        />

        <div className="relative z-10 max-w-5xl">
          <p
            className="uppercase tracking-[0.4em] text-xs mb-5"
            style={{ color: "#c8a078" }}
          >
            Clinica Premium
          </p>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold leading-tight mb-8">
            Beleza com
            <span style={{ color: "#c8a078" }}> sofisticacao </span>
          </h1>

          <p
            className="text-base md:text-xl max-w-xl md:max-w-2xl mx-auto leading-8"
            style={{ color: "#a89080" }}
          >
            Tratamentos modernos, atendimento premium e resultados naturais para elevar sua autoestima.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center mt-12">
            <a
              href="https://wa.me/556193578458"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-10 py-5 rounded-full font-semibold uppercase tracking-widest text-sm transition hover:scale-105 text-center"
              style={{ background: "#c8a078", color: "#0a0707" }}
            >
              Agendar Horario
            </a>

            <a
              href="https://www.instagram.com/moncieclinica/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-10 py-5 rounded-full font-semibold uppercase tracking-widest text-sm transition hover:scale-105 text-center"
              style={{
                border: "1px solid rgba(200,160,120,0.3)",
                color: "#c8a078",
              }}
            >
              Instagram
            </a>
          </div>
        </div>
      </section>

      {/* AUTORIDADE */}
      <section className="py-24 bg-[#0d0909]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["+500", "Clientes"],
              ["98%", "Satisfacao"],
              ["Premium", "Experiencia"],
              ["IA", "Atendimento"],
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-3xl p-6 md:p-8 text-center"
                style={{
                  background: "#120d0d",
                  border: "1px solid rgba(200,160,120,0.1)",
                }}
              >
                <h3
                  className="text-3xl md:text-4xl mb-3"
                  style={{ color: "#c8a078" }}
                >
                  {item[0]}
                </h3>

                <p style={{ color: "#a89080" }}>{item[1]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCEDIMENTOS */}
      <section id="procedimentos" className="py-28 px-6 bg-[#0a0707]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p
              className="uppercase tracking-[0.3em] text-xs mb-4"
              style={{ color: "#c8a078" }}
            >
              Procedimentos
            </p>

            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Tratamentos Exclusivos
            </h2>

            <p className="max-w-2xl mx-auto" style={{ color: "#a89080" }}>
              Procedimentos modernos para realcar sua beleza natural com seguranca e sofisticacao.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                nome: "Botox",
                img: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=80",
              },
              {
                nome: "Harmonizacao Facial",
                img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
              },
              {
                nome: "Limpeza de Pele",
                img: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800&q=80",
              },
              {
                nome: "Peeling",
                img: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=80",
              },
              {
                nome: "Massagem Relaxante",
                img: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&q=80",
              },
              {
                nome: "Drenagem Linfatica",
                img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-3xl overflow-hidden"
                style={{
                  background: "#120d0d",
                  border: "1px solid rgba(200,160,120,0.1)",
                }}
              >
                <img
                  src={item.img}
                  alt={item.nome}
                  className="w-full h-64 sm:h-72 object-cover"
                />

                <div className="p-6">
                  <h3
                    className="text-2xl mb-4"
                    style={{ color: "#c8a078" }}
                  >
                    {item.nome}
                  </h3>

                  <a
                    href="https://wa.me/556193578458"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 rounded-full text-sm uppercase tracking-widest transition hover:scale-105"
                    style={{ background: "#c8a078", color: "#0a0707" }}
                  >
                    Agendar
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ANTES E DEPOIS */}
      <section className="py-28 px-6 bg-[#0d0909]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p
              className="uppercase tracking-[0.3em] text-xs mb-4"
              style={{ color: "#c8a078" }}
            >
              Resultados
            </p>

            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Antes e Depois
            </h2>

            <p className="max-w-2xl mx-auto" style={{ color: "#a89080" }}>
              Resultados reais com procedimentos modernos e atendimento premium.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="rounded-3xl overflow-hidden"
                style={{
                  background: "#120d0d",
                  border: "1px solid rgba(200,160,120,0.1)",
                }}
              >
                <div className="grid grid-cols-2">
                  <div>
                    <img
                      src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80"
                      alt="Antes"
                      className="w-full h-72 object-cover"
                    />

                    <div className="p-4 text-center">
                      <p style={{ color: "#a89080" }}>Antes</p>
                    </div>
                  </div>

                  <div>
                    <img
                      src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80"
                      alt="Depois"
                      className="w-full h-72 object-cover"
                    />

                    <div className="p-4 text-center">
                      <p style={{ color: "#c8a078" }}>Depois</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="py-28 px-6 bg-[#0a0707]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <img
            src="https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=1000&q=80"
            alt="Clinica"
            className="rounded-3xl h-72 md:h-[600px] w-full object-cover"
          />

          <div>
            <p
              className="uppercase tracking-[0.3em] text-xs mb-4"
              style={{ color: "#c8a078" }}
            >
              Sobre a Moncie
            </p>

            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
              Tecnologia, estetica e excelencia
            </h2>

            <p className="leading-8 text-lg mb-6" style={{ color: "#a89080" }}>
              A Moncie nasceu para oferecer tratamentos sofisticados, modernos e personalizados.
            </p>

            <p className="leading-8 text-lg mb-10" style={{ color: "#a89080" }}>
              Nossa missao e elevar autoestima atraves de atendimento premium e resultados naturais.
            </p>

            <a
              href="https://wa.me/556193578458"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-5 rounded-full uppercase tracking-widest text-sm font-semibold transition hover:scale-105 inline-block"
              style={{ background: "#c8a078", color: "#0a0707" }}
            >
              Entrar em Contato
            </a>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section id="contato" className="py-28 px-6 text-center bg-black">
        <div className="max-w-4xl mx-auto">
          <p
            className="uppercase tracking-[0.3em] text-xs mb-4"
            style={{ color: "#c8a078" }}
          >
            Atendimento Inteligente
          </p>

          <div className="mt-10 text-sm leading-7" style={{ color: "#a89080" }}>
            <p>AVENIDA INDEPENDENCIA, Centro Clinico CDC</p>
            <p>Clinica Moncie - 3 andar, sala 300</p>
            <p>QD51 LT16A</p>
            <p>CEP 73330-003</p>
            <p>SETOR TRADICIONAL (PLANALTINA)</p>
            <p>BRASILIA - DF</p>
          </div>

          <div className="mt-8 rounded-3xl overflow-hidden border border-[#c8a07820]">
            <iframe
              src="https://www.google.com/maps?q=AVENIDA+INDEPENDENCIA+Centro+Clinico+CDC+Brasilia&output=embed"
              width="100%"
              height="320"
              style={{ border: 0 }}
              loading="lazy"
            ></iframe>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-8 mt-10">
            Agende diretamente pelo WhatsApp
          </h2>

          <p className="text-lg leading-8 mb-10" style={{ color: "#a89080" }}>
            Nossa assistente virtual realiza atendimentos, responde duvidas e faz pre-agendamentos automaticamente.
          </p>

          <a
            href="https://wa.me/556193578458"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-10 py-5 rounded-full uppercase tracking-widest text-sm font-semibold transition hover:scale-105"
            style={{ background: "#c8a078", color: "#0a0707" }}
          >
            Falar no WhatsApp
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="px-6 py-10"
        style={{
          background: "#080505",
          borderTop: "1px solid rgba(200,160,120,0.1)",
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h3
              className="text-2xl font-bold mb-3"
              style={{ color: "#c8a078" }}
            >
              Moncie Estetica
            </h3>

            <p style={{ color: "#a89080" }}>
              Beleza, autoestima e tecnologia.
            </p>
          </div>

          <div className="flex flex-wrap gap-6">
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
        className="fixed bottom-6 right-6 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl shadow-2xl transition hover:scale-110 z-50"
        style={{ background: "#25D366" }}
      >
        💬
      </a>
    </main>
  );
}
