import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao || sessao.role !== "admin") return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tabela    = searchParams.get("tabela") ?? "";
  const acao      = searchParams.get("acao") ?? "";
  const funcionario = searchParams.get("funcionario") ?? "";
  const busca     = searchParams.get("busca") ?? "";
  const pagina    = Number(searchParams.get("pagina") ?? "1");
  const limite    = 50;
  const offset    = (pagina - 1) * limite;

  let query = supabaseAdmin
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("criado_em", { ascending: false })
    .range(offset, offset + limite - 1);

  if (tabela)      query = query.eq("tabela", tabela);
  if (acao)        query = query.eq("acao", acao);
  if (funcionario) query = query.eq("funcionario_id", funcionario);
  if (busca)       query = query.ilike("descricao", `%${busca}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  return NextResponse.json({ logs: data ?? [], total: count ?? 0, pagina, limite });
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const body = await request.json();
  const { acao, tabela, registro_id, descricao, dados_antes, dados_depois } = body;

  const { error } = await supabaseAdmin.from("audit_logs").insert({
    funcionario_id:   sessao.id,
    funcionario_nome: sessao.nome ?? sessao.email,
    acao,
    tabela,
    registro_id,
    descricao,
    dados_antes:   dados_antes  ?? null,
    dados_depois:  dados_depois ?? null,
  });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
