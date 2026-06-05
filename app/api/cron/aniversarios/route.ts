import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  }

  const hoje = new Date();
  const mes = hoje.getMonth() + 1;
  const dia = hoje.getDate();

  try {
    // Busca pacientes que fazem aniversário hoje
    const { data: pacientes } = await supabaseAdmin
      .from("pacientes")
      .select("id, nome, telefone, data_nascimento")
      .not("data_nascimento", "is", null)
      .not("telefone", "is", null);

    const aniversariantes = (pacientes ?? []).filter(p => {
      if (!p.data_nascimento) return false;
      const nasc = new Date(p.data_nascimento + "T12:00:00");
      return nasc.getMonth() + 1 === mes && nasc.getDate() === dia;
    });

    let enviados = 0;

    for (const p of aniversariantes) {
      const nome = p.nome.split(" ")[0];
      const mensagem = `Feliz Aniversário, ${nome}! 🎂🎉 A equipe Moncié deseja um dia incrível! Como presente especial, você ganhou um desconto na sua próxima visita. 💝 — Moncié Esthetique`;

      await supabaseAdmin.from("whatsapp_logs").insert({
        paciente_id: p.id,
        tipo: "aniversario",
        mensagem,
        status: "enviado",
      }).catch(() => {});

      enviados++;
    }

    return NextResponse.json({ ok: true, aniversariantes: enviados, data: `${dia}/${mes}` });

  } catch (err: any) {
    return NextResponse.json({ erro: err.message }, { status: 500 });
  }
}
