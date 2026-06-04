import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { id } = await params;

  const [pacote, sessoes] = await Promise.all([
    supabaseAdmin.from("laser_pacotes").select("*, pacientes(nome, telefone, cpf, data_nascimento, alergias), funcionarios(nome, cor)").eq("id", id).single(),
    supabaseAdmin.from("laser_sessoes").select("*, funcionarios(nome)").eq("pacote_id", id).order("numero_sessao"),
  ]);

  if (pacote.error) return NextResponse.json({ erro: "Nao encontrado" }, { status: 404 });
  return NextResponse.json({ ...pacote.data, sessoes: sessoes.data ?? [] });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  if (body.acao === "registrar_sessao") {
    const { data: pacote } = await supabaseAdmin
      .from("laser_pacotes")
      .select("sessoes_feitas, total_sessoes")
      .eq("id", id)
      .single();

    const novasSessoes = (pacote?.sessoes_feitas ?? 0) + 1;
    const finalizado = novasSessoes >= (pacote?.total_sessoes ?? 0);

    await supabaseAdmin.from("laser_pacotes").update({
      sessoes_feitas: novasSessoes,
      status: finalizado ? "finalizado" : "em_tratamento"
    }).eq("id", id);

    await supabaseAdmin.from("laser_sessoes").insert({
      pacote_id: id,
      paciente_id: body.paciente_id,
      funcionario_id: sessao.id,
      numero_sessao: novasSessoes,
      observacoes: body.observacoes ?? "",
      intercorrencias: body.intercorrencias ?? "",
    });

    return NextResponse.json({ ok: true, sessoes_feitas: novasSessoes, finalizado });
  }

  const { data, error } = await supabaseAdmin
    .from("laser_pacotes")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
_: NextRequest,
{ params }: { params: Promise<{ id: string }> }
) {
const sessao = await getSessao();

if (!sessao) {
return NextResponse.json(
{ erro: "Nao autorizado" },
{ status: 401 }
);
}

const { id } = await params;

try {
// Remove primeiro as sessões vinculadas
const { error: erroSessoes } = await supabaseAdmin
.from("laser_sessoes")
.delete()
.eq("pacote_id", id);

if (erroSessoes) {
  return NextResponse.json(
    { erro: erroSessoes.message },
    { status: 500 }
  );
}

// Depois remove o pacote
const { error: erroPacote } = await supabaseAdmin
  .from("laser_pacotes")
  .delete()
  .eq("id", id);

if (erroPacote) {
  return NextResponse.json(
    { erro: erroPacote.message },
    { status: 500 }
  );
}

return NextResponse.json({
  ok: true,
  mensagem: "Pacote excluido com sucesso",
});

} catch (error: any) {
return NextResponse.json(
{ erro: error.message },
{ status: 500 }
);
}
}
