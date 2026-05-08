import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">

      {/* NAVBAR */}
      <nav className="w-full flex items-center justify-between px-6 py-6 absolute top-0 z-50">

        <Image
          src="/logo-moncie-print.jpg"
          alt="Logo da Clínica"
          width={120}
          height={120}
        />

        <div className="flex gap-6 text-sm">
          <a href="#" className="hover:text-pink-400 transition">
            Início
          </a>

          <a href="#" className="hover:text-pink-400 transition">
            Procedimentos
          </a>

          <a href="#" className="hover:text-pink-400 transition">
            Contato
          </a>
        </div>

      </nav>

      {/* HERO SECTION */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 min-h-screen overflow-hidden">

        <div className="absolute w-72 h-72 bg-white/10 blur-3xl rounded-full top-20 left-10"></div>

        <div className="absolute w-72 h-72 bg-pink-400/20 blur-3xl rounded-full bottom-10 right-10"></div>

        <Image
          src="/logo-moncie-print.jpg"
          alt="Logo"
          width={180}
          height={180}
          className="mb-6 rounded-2xl"
        />

        <p className="uppercase tracking-[0.3em] text-zinc-400 mb-4">
          Clínica de Estética
        </p>

        <h1 className="text-5xl md:text-7xl font-bold max-w-4xl leading-tight">
          Realçando sua beleza com elegância e cuidado
        </h1>

        <p className="text-zinc-400 mt-6 max-w-xl text-lg">
          Agendamentos rápidos, atendimento premium e tecnologia para cuidar da sua autoestima.
        </p>

        <div className="flex gap-4 mt-10 flex-col sm:flex-row">

          <button className="bg-white text-black px-8 py-4 rounded-full font-semibold hover:scale-105 transition duration-300">
            Agendar Horário
          </button>

          <button className="border border-white px-8 py-4 rounded-full hover:bg-white hover:text-black transition duration-300">
            Falar no WhatsApp
          </button>

        </div>

      </section>

      {/* PROCEDIMENTOS */}
      <section className="px-6 py-24 bg-zinc-950">

        <div className="max-w-6xl mx-auto">

          <h2 className="text-4xl font-bold mb-4">
            Procedimentos
          </h2>

          <p className="text-zinc-400 mb-12">
            Conheça alguns dos tratamentos disponíveis na clínica.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 hover:-translate-y-2 hover:border-pink-500/40 hover:bg-zinc-800 transition duration-300">

              <h3 className="text-2xl font-semibold mb-3">
                Limpeza de Pele
              </h3>

              <p className="text-zinc-400 mb-6">
                Procedimento estético para renovação e hidratação da pele.
              </p>

              <button className="bg-white text-black px-5 py-2 rounded-full font-medium hover:scale-105 transition duration-300">
                Agendar
              </button>

            </div>

            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 hover:-translate-y-2 hover:border-pink-500/40 hover:bg-zinc-800 transition duration-300">

              <h3 className="text-2xl font-semibold mb-3">
                Botox
              </h3>

              <p className="text-zinc-400 mb-6">
                Suavização de linhas de expressão com resultado natural.
              </p>

              <button className="bg-white text-black px-5 py-2 rounded-full font-medium hover:scale-105 transition duration-300">
                Agendar
              </button>

            </div>

            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 hover:-translate-y-2 hover:border-pink-500/40 hover:bg-zinc-800 transition duration-300">

              <h3 className="text-2xl font-semibold mb-3">
                Harmonização Facial
              </h3>

              <p className="text-zinc-400 mb-6">
                Equilíbrio estético e valorização dos traços faciais.
              </p>

              <button className="bg-white text-black px-5 py-2 rounded-full font-medium hover:scale-105 transition duration-300">
                Agendar
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* SOBRE */}
      <section className="px-6 py-24">

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          <div>
            <Image
              src="/logo-moncie-print.jpg"
              alt="Clínica"
              width={600}
              height={400}
              className="rounded-3xl object-cover h-[400px] w-full border border-zinc-800"
            />
          </div>

          <div>

            <p className="uppercase tracking-[0.3em] text-zinc-500 mb-4">
              Sobre
            </p>

            <h2 className="text-4xl font-bold mb-6">
              Cuidado estético com tecnologia e excelência
            </h2>

            <p className="text-zinc-400 leading-8 mb-6">
              Nossa clínica oferece tratamentos modernos e personalizados para realçar sua beleza natural com segurança, conforto e qualidade profissional.
            </p>

            <button className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:scale-105 transition duration-300">
              Entrar em Contato
            </button>

          </div>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 px-6 py-10">

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

          <div>

            <h3 className="text-2xl font-bold mb-2">
              Moncie Estética
            </h3>

            <p className="text-zinc-500">
              Beleza, autoestima e tecnologia em um só lugar.
            </p>

          </div>

          <div className="flex gap-6 text-zinc-400">

            <a href="#" className="hover:text-pink-400 transition">
              Instagram
            </a>

            <a href="#" className="hover:text-pink-400 transition">
              WhatsApp
            </a>

            <a href="#" className="hover:text-pink-400 transition">
              Localização
            </a>

          </div>

        </div>

      </footer>

      {/* WHATSAPP */}
      <a
        href="https://wa.me/556193578458"
        target="_blank"
        className="fixed bottom-6 right-6 bg-green-500 hover:scale-110 transition duration-300 p-4 rounded-full shadow-2xl"
      >
        <span className="text-white text-2xl">
          💬
        </span>
      </a>

    </main>
  );
}