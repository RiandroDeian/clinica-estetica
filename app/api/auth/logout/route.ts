import { NextResponse } from "next/server";
import { destruirSessao, getSessao } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function logAudit(dados: object) {
  try {
    await supabaseAdmin.from("audit_logs").insert(dados);
  } catch {}
}

export async function POST() {
  try {
    const sessao = await getSessao();
    if (sessao) {
      void logAudit({
        funcionario_id:   sessao.id,
        funcionario_nome: sessao.nome,
        acao: "logout",
        tabela: "funcionarios",
        descricao: `Logout de ${sessao.nome} (${sessao.email})`,
      });
    }
    await destruirSessao();
    return NextResponse.json({ ok: true });
  } catch {
    await destruirSessao();
    return NextResponse.json({ ok: true });
  }
}
