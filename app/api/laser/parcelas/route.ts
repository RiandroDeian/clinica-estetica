export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

// Soma "n" meses a uma data "YYYY-MM-DD" mantendo o dia (com clamp no fim do mês).
function somarMeses(dataISO: string, n: number): string {
  const [y, m, d] = dataISO.split("-").map(Number);
  const base = new Date(y, (m - 1) + n, 1);
  const ultimoDia = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const dia = Math.min(d, ultimoDia);
  const mm = String(base.getMonth() + 1).padStart(2, "0");
  const dd = String(dia).padStart(2, "0");
  return `${base.getFullYear()}-${mm}-${dd}`;
}

// Recalcula o status_pagamento do pacote a partir das parcelas.
async function recalcularStatusPacote(pacoteId: string) {
  const { data: parcelas } = await supabaseAdmin
    .from("laser_parcelas")
    .select("data_pagamento")
    .eq("pacote_id", pacoteId);

  const lista = parcelas ?? [];
  if (lista.length === 0) return;

  const pagas = lista.filter(p => !!p.data_pagamento).length;
  const status = pagas === 0 ? "pendente" : pagas === lista.length ? "pago" : "parcial";
  await supabaseAdmin.from("laser_pacotes").update({ status_pagamento: status }).eq("id", pacoteId);
}

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const pacote_id = searchParams.get("pacote_id");
  if (!pacote_id) return NextResponse.json({ erro: "pacote_id obrigatorio" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("laser_parcelas")
    .select("*")
    .eq("pacote_id", pacote_id)
    .order("numero", { ascending: true });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// Gera todas as parcelas de um pacote (substitui as existentes).
export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const body = await request.json();
  const { pacote_id, num_parcelas, valor_parcela, primeiro_vencimento } = body;

  const n = Number(num_parcelas);
  const valor = Number(valor_parcela);
  if (!pacote_id || !n || n < 1 || !primeiro_vencimento) {
    return NextResponse.json(
      { erro: "pacote_id, num_parcelas (>=1) e primeiro_vencimento sao obrigatorios" },
      { status: 400 },
    );
  }

  // Apaga as parcelas atuais desse pacote antes de regenerar.
  await supabaseAdmin.from("laser_parcelas").delete().eq("pacote_id", pacote_id);

  const linhas = Array.from({ length: n }, (_, i) => ({
    pacote_id,
    numero: i + 1,
    total_parcelas: n,
    valor: isNaN(valor) ? 0 : valor,
    vencimento: somarMeses(primeiro_vencimento, i),
    data_pagamento: null as string | null,
  }));

  const { data, error } = await supabaseAdmin
    .from("laser_parcelas")
    .insert(linhas)
    .select("*")
    .order("numero", { ascending: true });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  await recalcularStatusPacote(pacote_id);
  return NextResponse.json(data ?? []);
}

// Atualiza uma parcela: marcar/desmarcar pago, editar valor/vencimento.
export async function PATCH(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const body = await request.json();
  const { id } = body;
  if (!id) return NextResponse.json({ erro: "id obrigatorio" }, { status: 400 });

  const campos: Record<string, unknown> = {};
  // data_pagamento: string marca (com data), null desmarca. Se vier "true"/"" resolve pra hoje.
  if (body.data_pagamento !== undefined) {
    campos.data_pagamento = body.data_pagamento
      ? (body.data_pagamento === true ? new Date().toISOString().slice(0, 10) : body.data_pagamento)
      : null;
  }
  if (body.valor !== undefined)      campos.valor      = Number(body.valor) || 0;
  if (body.vencimento !== undefined) campos.vencimento = body.vencimento || null;

  const { data, error } = await supabaseAdmin
    .from("laser_parcelas")
    .update(campos)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  if (data?.pacote_id) await recalcularStatusPacote(data.pacote_id);
  return NextResponse.json(data);
}

// Remove uma parcela (?id=) ou todas de um pacote (?pacote_id=).
export async function DELETE(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const pacote_id = searchParams.get("pacote_id");

  if (id) {
    const { data } = await supabaseAdmin.from("laser_parcelas").select("pacote_id").eq("id", id).single();
    await supabaseAdmin.from("laser_parcelas").delete().eq("id", id);
    if (data?.pacote_id) await recalcularStatusPacote(data.pacote_id);
    return NextResponse.json({ ok: true });
  }
  if (pacote_id) {
    await supabaseAdmin.from("laser_parcelas").delete().eq("pacote_id", pacote_id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ erro: "id ou pacote_id obrigatorio" }, { status: 400 });
}
