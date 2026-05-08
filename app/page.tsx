import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0707] text-white overflow-x-hidden" style={{ fontFamily: "'Georgia', serif" }}>

      {/* NAVBAR */}
      <nav className="w-full flex items-center justify-between px-8 py-5 fixed top-0 z-50" style={{ background: "rgba(10,7,7,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(200,160,120,0.15)" }}>
        <Image
          src="/logo-moncie-print.jpg"
          alt="Logo da Clínica"
          width={90}
          height={90}
          className="rounded-xl"
        />
        <div className="flex gap-8 text-sm tracking-widest uppercase" style={{ color: "#c8a078", letterSpacing: "0.18em" }}>
          <a href="#inicio" className="hover:text-white transition duration-300">Início</a>
          <a href="#procedimentos" className="hover:text-white transition duration-300">Procedimentos</a>
          <a href="#sobre" className="hover:text-white transition duration-300">Sobre</a>
          <a href="#contato" className="hover:text-white transition duration-300">Contato</a>
        </div>
      </nav>

      {/* HERO */}
      <section id="inicio" className="relative flex flex-col items-center justify-center text-center px-6 min-h-screen overflow-hidden">

        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1600&q=80"
            alt="Clínica"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,7,7,0.5) 0%, rgba(10,7,7,0.85) 100%)" }}></div>
        </div>

        {/* Glow */}
        <div className="absolute w-96 h-96 rounded-full blur-3xl z-0" style={{ background: "rgba(200,160,120,0.08)", top: "20%", left: "10%" }}></div>
        <div className="absolute w-80 h-80 rounded-full blur-3xl z-0" style={{ background: "rgba(200,100,120,0.07)", bottom: "15%", right: "10%" }}></div>

        <div className="relative z-10 flex flex-col items-center">
          <Image
            src="/logo-moncie-print.jpg"
            alt="Logo Moncie"
            width={140}
            height={140}
            className="rounded-2xl mb-8 shadow-2xl"
            style={{ border: "1px solid rgba(200,160,120,0.3)" }}
          />

          <p className="uppercase tracking-[0.35em] mb-5 text-xs" style={{ color: "#c8a078" }}>
            Clínica de Estética Premium
          </p>

          <h1 className="text-5xl md:text-7xl font-bold max-w-4xl leading-tight mb-6" style={{ fontFamily: "'Georgia', serif", lineHeight: "1.15" }}>
            Realçando sua beleza com <span style={{ color: "#c8a078" }}>elegância</span> e cuidado
          </h1>

          <p className="mt-2 max-w-lg text-lg leading-relaxed" style={{ color: "#a89080" }}>
            Agendamentos rápidos, atendimento premium e tecnologia para cuidar da sua autoestima.
          </p>

          <div className="flex gap-4 mt-10 flex-col sm:flex-row">
            <a
              href="https://wa.me/556193578458"
              target="_blank"
              className="px-10 py-4 rounded-full font-semibold text-sm tracking-widest uppercase transition duration-300 hover:scale-105"
              style={{ background: "#c8a078", color: "#0a0707" }}
            >
              Agendar Horário
            </a>
            <a
              href="https://wa.me/556193578458"
              target="_blank"
              className="px-10 py-4 rounded-full font-semibold text-sm tracking-widest uppercase transition duration-300 hover:scale-105"
              style={{ border: "1px solid rgba(200,160,120,0.5)", color: "#c8a078" }}
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* DIVISOR */}
      <div className="w-full flex items-center justify-center py-4">
        <div className="h-px w-24" style={{ background: "linear-gradient(to right, transparent, #c8a078, transparent)" }}></div>
        <span className="mx-4 text-xs tracking-widest uppercase" style={{ color: "#c8a078" }}>✦</span>
        <div className="h-px w-24" style={{ background: "linear-gradient(to left, transparent, #c8a078, transparent)" }}></div>
      </div>

      {/* PROCEDIMENTOS */}
      <section id="procedimentos" className="px-6 py-24" style={{ background: "#0d0909" }}>
        <div className="max-w-6xl mx-auto">

          <p className="uppercase tracking-[0.3em] text-xs mb-3" style={{ color: "#c8a078" }}>Tratamentos</p>
          <h2 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Georgia', serif" }}>Procedimentos</h2>
          <p className="mb-14" style={{ color: "#a89080" }}>Conheça alguns dos tratamentos disponíveis na clínica.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1 */}
            <div className="rounded-3xl overflow-hidden group transition duration-500 hover:-translate-y-2" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)" }}>
              <div className="h-52 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80"
                  alt="Limpeza de Pele"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "'Georgia', serif" }}>Limpeza de Pele</h3>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: "#a89080" }}>Procedimento estético para renovação e hidratação profunda da pele.</p>
                <a href="https://wa.me/556193578458" target="_blank" className="text-xs tracking-widest uppercase px-5 py-2 rounded-full transition hover:scale-105 inline-block" style={{ background: "#c8a078", color: "#0a0707" }}>
                  Agendar
                </a>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-3xl overflow-hidden group transition duration-500 hover:-translate-y-2" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)" }}>
              <div className="h-52 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80"
                  alt="Botox"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "'Georgia', serif" }}>Botox</h3>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: "#a89080" }}>Suavização de linhas de expressão com resultado natural e duradouro.</p>
                <a href="https://wa.me/556193578458" target="_blank" className="text-xs tracking-widest uppercase px-5 py-2 rounded-full transition hover:scale-105 inline-block" style={{ background: "#c8a078", color: "#0a0707" }}>
                  Agendar
                </a>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-3xl overflow-hidden group transition duration-500 hover:-translate-y-2" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)" }}>
              <div className="h-52 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80"
                  alt="Harmonização Facial"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "'Georgia', serif" }}>Harmonização Facial</h3>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: "#a89080" }}>Equilíbrio estético e valorização dos traços faciais com precisão.</p>
                <a href="https://wa.me/556193578458" target="_blank" className="text-xs tracking-widest uppercase px-5 py-2 rounded-full transition hover:scale-105 inline-block" style={{ background: "#c8a078", color: "#0a0707" }}>
                  Agendar
                </a>
              </div>
            </div>

            {/* Card 4 */}
            <div className="rounded-3xl overflow-hidden group transition duration-500 hover:-translate-y-2" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)" }}>
              <div className="h-52 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80"
                  alt="Peeling"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "'Georgia', serif" }}>Peeling Facial</h3>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: "#a89080" }}>Renovação celular para uma pele mais luminosa, uniforme e jovem.</p>
                <a href="https://wa.me/556193578458" target="_blank" className="text-xs tracking-widest uppercase px-5 py-2 rounded-full transition hover:scale-105 inline-block" style={{ background: "#c8a078", color: "#0a0707" }}>
                  Agendar
                </a>
              </div>
            </div>

            {/* Card 5 */}
            <div className="rounded-3xl overflow-hidden group transition duration-500 hover:-translate-y-2" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)" }}>
              <div className="h-52 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=80"
                  alt="Massagem"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "'Georgia', serif" }}>Massagem Relaxante</h3>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: "#a89080" }}>Alívio do estresse e tensão muscular com técnicas profissionais.</p>
                <a href="https://wa.me/556193578458" target="_blank" className="text-xs tracking-widest uppercase px-5 py-2 rounded-full transition hover:scale-105 inline-block" style={{ background: "#c8a078", color: "#0a0707" }}>
                  Agendar
                </a>
              </div>
            </div>

            {/* Card 6 */}
            <div className="rounded-3xl overflow-hidden group transition duration-500 hover:-translate-y-2" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)" }}>
              <div className="h-52 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80"
                  alt="Drenagem"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "'Georgia', serif" }}>Drenagem Linfática</h3>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: "#a89080" }}>Redução de inchaço e melhora da circulação com técnica especializada.</p>
                <a href="https://wa.me/556193578458" target="_blank" className="text-xs tracking-widest uppercase px-5 py-2 rounded-full transition hover:scale-105 inline-block" style={{ background: "#c8a078", color: "#0a0707" }}>
                  Agendar
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="px-6 py-24" style={{ background: "#0a0707" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&q=80"
              alt="Clínica Moncie"
              className="rounded-3xl object-cover w-full opacity-90"
              style={{ height: "460px", border: "1px solid rgba(200,160,120,0.2)" }}
            />
            <div className="absolute -bottom-5 -right-5 px-6 py-4 rounded-2xl" style={{ background: "#c8a078", color: "#0a0707" }}>
              <p className="text-2xl font-bold" style={{ fontFamily: "'Georgia', serif" }}>+500</p>
              <p className="text-xs uppercase tracking-widest">Clientes satisfeitas</p>
            </div>
          </div>

          <div>
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: "#c8a078" }}>Sobre</p>
            <h2 className="text-4xl font-bold mb-6" style={{ fontFamily: "'Georgia', serif", lineHeight: "1.2" }}>
              Cuidado estético com tecnologia e excelência
            </h2>
            <p className="leading-8 mb-4" style={{ color: "#a89080" }}>
              A Moncie Clínica foi criada com o propósito de oferecer tratamentos modernos e personalizados, pensados para realçar sua beleza natural com segurança e conforto.
            </p>
            <p className="leading-8 mb-8" style={{ color: "#a89080" }}>
              Nossa equipe é especializada e comprometida com resultados reais, sempre utilizando produtos e equipamentos de alta qualidade.
            </p>
            <a
              href="https://wa.me/556193578458"
              target="_blank"
              className="px-8 py-3 rounded-full font-semibold text-sm tracking-widest uppercase transition hover:scale-105 inline-block"
              style={{ background: "#c8a078", color: "#0a0707" }}
            >
              Entrar em Contato
            </a>
          </div>

        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="px-6 py-24" style={{ background: "#0d0909" }}>
        <div className="max-w-6xl mx-auto">
          <p className="uppercase tracking-[0.3em] text-xs mb-3 text-center" style={{ color: "#c8a078" }}>Depoimentos</p>
          <h2 className="text-4xl font-bold mb-14 text-center" style={{ fontFamily: "'Georgia', serif" }}>O que nossas clientes dizem</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {[
              { nome: "Ana Luiza", texto: "Atendimento incrível! Minha pele ficou completamente renovada após a limpeza de pele. Super recomendo a Moncie!", estrelas: 5 },
              { nome: "Fernanda Costa", texto: "Fiz harmonização facial e o resultado foi perfeito, natural e elegante. Profissionais excelentes!", estrelas: 5 },
              { nome: "Juliana Melo", texto: "Ambiente aconchegante e equipe atenciosa. Voltei várias vezes e sempre saio satisfeita!", estrelas: 5 },
            ].map((dep, i) => (
              <div key={i} className="p-6 rounded-3xl" style={{ background: "#120d0d", border: "1px solid rgba(200,160,120,0.15)" }}>
                <p className="mb-1" style={{ color: "#c8a078" }}>{"★".repeat(dep.estrelas)}</p>
                <p className="leading-7 mb-4 text-sm" style={{ color: "#a89080" }}>"{dep.texto}"</p>
                <p className="font-semibold text-sm">{dep.nome}</p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* CONTATO / CTA */}
      <section id="contato" className="px-6 py-24 text-center relative overflow-hidden" style={{ background: "#0a0707" }}>
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1600&q=80"
            alt="bg"
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: "#c8a078" }}>Agende já</p>
          <h2 className="text-4xl font-bold mb-6" style={{ fontFamily: "'Georgia', serif" }}>Pronta para se cuidar?</h2>
          <p className="mb-10 leading-8" style={{ color: "#a89080" }}>Entre em contato agora mesmo e agende seu horário. Nossa equipe está esperando por você!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/556193578458"
              target="_blank"
              className="px-10 py-4 rounded-full font-semibold text-sm tracking-widest uppercase transition hover:scale-105"
              style={{ background: "#c8a078", color: "#0a0707" }}
            >
              Agendar pelo WhatsApp
            </a>
            <a
              href="https://www.instagram.com/moncieclinica/"
              target="_blank"
              className="px-10 py-4 rounded-full font-semibold text-sm tracking-widest uppercase transition hover:scale-105"
              style={{ border: "1px solid rgba(200,160,120,0.5)", color: "#c8a078" }}
            >
              Ver no Instagram
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(200,160,120,0.15)", background: "#080505" }} className="px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Georgia', serif" }}>Moncie Estética</h3>
            <p className="text-sm" style={{ color: "#a89080" }}>Beleza, autoestima e tecnologia em um só lugar.</p>
          </div>
          <div className="flex gap-6 text-sm" style={{ color: "#a89080" }}>
            <a href="https://www.instagram.com/moncieclinica/" target="_blank" className="hover:text-white transition">Instagram</a>
            <a href="https://wa.me/556193578458" target="_blank" className="hover:text-white transition">WhatsApp</a>
          </div>
          <p className="text-xs" style={{ color: "#5a4a40" }}>© 2025 Moncie Estética. Todos os direitos reservados.</p>
        </div>
        <div className="max-w-6xl mx-auto mt-6 pt-6 text-center w-full" style={{ borderTop: "1px solid rgba(200,160,120,0.08)" }}>
          <p className="text-xs w-full" style={{ color: "#5a4a40" }}>
            Desenvolvido por{" "}
            <a
              href="https://riandrodev.netlify.app/"
              target="_blank"
              className="transition hover:text-white"
              style={{ color: "#c8a078" }}
            >
              Riandro Deian
            </a>
          </p>
        </div>
      </footer>

      {/* WHATSAPP FIXO */}
      <a
        href="https://wa.me/556193578458"
        target="_blank"
        className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition duration-300 z-50"
        style={{ background: "#25d366" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-7 h-7">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>

    </main>
  );
}