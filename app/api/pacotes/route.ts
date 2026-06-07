export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET() {
const sessao = await getSessao();

if (!sessao) {
return NextResponse.json(
{ erro: "Não autorizado" },
{ status: 401 }
);
}

const { data: pacotes, error } = await supabaseAdmin
.from("pacotes")
.select(`       *,
      pacientes(nome)
    `)
.order("comprado_em", {
ascending: false,
});

if (error) {
return NextResponse.json(
{ erro: error.message },
{ status: 500 }
);
}

const pacotesIds = (pacotes ?? []).map((p) => p.id);

const { data: relacoes } = await supabaseAdmin
.from("pacote_procedimentos")
.select(`       pacote_id,
      procedimentos(
        id,
        nome
      )
    `)
.in("pacote_id", pacotesIds);

const resultado = (pacotes ?? []).map((pacote) => ({
...pacote,
procedimentos:
relacoes
?.filter((r) => r.pacote_id === pacote.id)
.map((r: any) => r.procedimentos)
.filter(Boolean) ?? [],
}));

return NextResponse.json(resultado);
}

export async function POST(request: NextRequest) {
const sessao = await getSessao();

if (!sessao) {
return NextResponse.json(
{ erro: "Não autorizado" },
{ status: 401 }
);
}

try {
const body = await request.json();


const { data: pacote, error } = await supabaseAdmin
  .from("pacotes")
  .insert({
    paciente_id: body.paciente_id,
    total_sessoes: Number(body.total_sessoes),
    sessoes_usadas: 0,
    ativo: true,
    categoria: body.categoria,
    status: "Ativo",
    nome_pacote: body.nome_pacote,
    observacoes: body.observacoes || null,
  })
  .select()
  .single();

if (error) {
  return NextResponse.json(
    { erro: error.message },
    { status: 500 }
  );
}

if (
  body.procedimento_ids &&
  Array.isArray(body.procedimento_ids) &&
  body.procedimento_ids.length > 0
) {
  const registros = body.procedimento_ids.map(
    (procedimento_id: string) => ({
      pacote_id: pacote.id,
      procedimento_id,
    })
  );

  const { error: relacaoError } = await supabaseAdmin
    .from("pacote_procedimentos")
    .insert(registros);

  if (relacaoError) {
    return NextResponse.json(
      { erro: relacaoError.message },
      { status: 500 }
    );
  }
}

return NextResponse.json(pacote);

} catch (err: any) {
return NextResponse.json(
{ erro: err.message },
{ status: 500 }
);
}
}
