import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  }

  const agora = new Date();
  const resultados = { lembrete_dia: 0, lembrete_hora: 0 };

  try {
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
      const mensagem = `Ola ${nome}! Lembrando que amanha voce tem ${proc} as ${hora}. Ate amanha! — Moncie Esthetique`;

      try {
        await supabaseAdmin.from("whatsapp_logs").insert({
          paciente_id: ag.paciente_id,
          agendamento_id: ag.id,
          tipo: "lembrete_dia",
          mensagem,
          status: "enviado",
        });
      } catch {}

      resultados.lembrete_dia++;
    }

    return NextResponse.json({ ok: true, ...resultados, hora: agora.toISOString() });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}