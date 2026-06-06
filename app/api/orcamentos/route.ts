import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const busca  = searchParams.get("busca") ?? "";

  let query = supabaseAdmin
    .from("orcamentos")
    .select("*, pacientes(nome, telefone), funcionarios(nome)")
    .order("criado_em", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  let lista = data ?? [];
  if (busca) {
    lista = lista.filter((o: any) =>
      o.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      o.pacientes?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      o.telefone?.includes(busca)
    );
  }

  return NextResponse.json(lista);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const body = await request.json();
  const itens = body.itens ?? [];
  const valor_total = itens.reduce((acc: number, i: any) => acc + (Number(i.preco) * Number(i.quantidade)), 0);
  const desconto    = Number(body.desconto ?? 0);
  const valor_final = valor_total - desconto;

  const { data, error } = await supabaseAdmin
    .from("orcamentos")
    .insert({
      nome:         body.nome ?? null,
      telefone:     body.telefone ?? null,
      cpf:          body.cpf ?? null,
      paciente_id:  body.paciente_id ?? null,
      funcionario_id: sessao.id,
      status:       "rascunho",
      itens,
      valor_total,
      desconto,
      valor_final,
      validade:     body.validade ?? null,
      notas:        body.notas ?? null,
    })
    .select("*, pacientes(nome, telefone), funcionarios(nome)")
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}
