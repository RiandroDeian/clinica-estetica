export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const pacote_id = searchParams.get("pacote_id");
  if (!pacote_id) return NextResponse.json({ erro: "pacote_id obrigatório" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("laser_boleto_historico")
    .select("*, funcionarios(nome)")
    .eq("pacote_id", pacote_id)
    .order("mes_referencia", { ascending: false });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { pacote_id, data_pagamento, dia_vencimento, observacao } = body;

  if (!pacote_id || !data_pagamento) {
    return NextResponse.json({ erro: "pacote_id e data_pagamento são obrigatórios" }, { status: 400 });
  }

  // ✅ Calcula dias de atraso comparando com o dia de vencimento esperado
  const dataPag = new Date(data_pagamento + "T12:00:00");
  const diaEsperado = Number(dia_vencimento) || dataPag.getDate();

  // Data esperada de vencimento no mesmo mês do pagamento
  const dataEsperada = new Date(dataPag.getFullYear(), dataPag.getMonth(), diaEsperado);
  const diffMs = dataPag.getTime() - dataEsperada.getTime();
  const diasAtraso = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  // Mês de referência = primeiro dia do mês do vencimento
  const mesReferencia = new Date(dataPag.getFullYear(), dataPag.getMonth(), 1).toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from("laser_boleto_historico")
    .insert({
      pacote_id,
      mes_referencia: mesReferencia,
      data_pagamento,
      dias_atraso: diasAtraso,
      observacao: observacao || null,
      funcionario_id: sessao.id,
    })
    .select("*, funcionarios(nome)")
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  // ✅ Atualiza o status do pacote para "pago" e a data de acerto
  await supabaseAdmin
    .from("laser_pacotes")
    .update({ status_pagamento: "pago", data_acerto: data_pagamento })
    .eq("id", pacote_id);

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ erro: "id obrigatório" }, { status: 400 });

  await supabaseAdmin.from("laser_boleto_historico").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}