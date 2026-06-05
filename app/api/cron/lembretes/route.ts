import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Segurança: só Vercel Cron pode chamar
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  }

  const agora = new Date();
  const resultados = { lembrete_dia: 0, lembrete_hora: 0, erros: 0 };

  try {
    // ── LEMBRETE 1 DIA ANTES (roda às 18h) ──
    if (agora.getHours() === 18) {
      const amanha = new Date(agora);
      amanha.setDate(amanha.getDate() + 1);
      amanha.setHours(0, 0, 0, 0);
      const fimAmanha = new Date(amanha);
      fimAmanha.setHours(23, 59, 59, 999);

      const { data: agendamentos } = await supabaseAdmin
        .from("agendamentos")
        .select("*, pacientes(nome, telefone), procedimentos(nome)")
        .gte("inicio", amanha.toISOString())
        .lte("inicio", fimAmanha.toISOString())
        .neq("status", "cancelado");

      for (const ag of agendamentos ?? []) {
        const telefone = ag.pacientes?.telefone?.replace(/\D/g, "");
        if (!telefone) continue;

        const nome = ag.pacientes?.nome?.split(" ")[0] ?? "Paciente";
        const hora = new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        const proc = ag.procedimentos?.nome ?? "procedimento";

        const mensagem = `Olá ${nome}! 📅 Lembrando que amanhã você tem *${proc}* às *${hora}*. Até amanhã! — Moncié Esthetique`;

        // Registrar no histórico
        await supabaseAdmin.from("whatsapp_logs").insert({
          paciente_id: ag.paciente_id,
          agendamento_id: ag.id,
          tipo: "lembrete_dia",
          mensagem,
          status: "enviado",
        }).catch(() => {});

        resultados.lembrete_dia++;
      }
    }

    // ── LEMBRETE 1 HORA ANTES ──
    const em1hora = new Date(agora.getTime() + 60 * 60000);
    const janela = new Date(agora.getTime() + 50 * 60000); // 10min de janela

    const { data: agendamentosHora } = await supabaseAdmin
      .from("agendamentos")
      .select("*, pacientes(nome, telefone), procedimentos(nome)")
      .gte("inicio", janela.toISOString())
      .lte("inicio", em1hora.toISOString())
      .neq("status", "cancelado");

    for (const ag of agendamentosHora ?? []) {
      const telefone = ag.pacientes?.telefone?.replace(/\D/g, "");
      if (!telefone) continue;

      const nome = ag.pacientes?.nome?.split(" ")[0] ?? "Paciente";
      const hora = new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

      const mensagem = `Olá ${nome}! ⏰ Seu atendimento começa em 1 hora, às *${hora}*. Estamos te esperando! — Moncié Esthetique`;

      await supabaseAdmin.from("whatsapp_logs").insert({
        paciente_id: ag.paciente_id,
        agendamento_id: ag.id,
        tipo: "lembrete_hora",
        mensagem,
        status: "enviado",
      }).catch(() => {});

      resultados.lembrete_hora++;
    }

    return NextResponse.json({ ok: true, ...resultados, hora: agora.toISOString() });

  } catch (err: any) {
    return NextResponse.json({ erro: err.message }, { status: 500 });
  }
}
