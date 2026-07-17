export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao, hashSenha } from "@/lib/auth";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from("funcionarios")
    .select("id, nome, email, role, cargo, cor, ativo, criado_em, telefone, data_admissao, status, especialidades, permissoes, recebe_follow_ups")
    .order("nome");
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao || sessao.role !== "admin") return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const body = await request.json();
  const { nome, email, senha, role, cargo, cor, telefone, data_admissao, especialidades, permissoes } = body;
  const senha_hash = await hashSenha(senha);
  const { data, error } = await supabaseAdmin
    .from("funcionarios")
    .insert({
      nome, email, senha_hash,
      role: role ?? "funcionario",
      cargo: cargo ?? "recepcionista",
      cor: cor ?? "#c8a078",
      telefone: telefone || null,
      data_admissao: data_admissao || null,
      especialidades: especialidades ?? [],
      permissoes: permissoes ?? {
        agenda: true, pacientes: true, pacotes: false,
        procedimentos: false, financeiro: false,
        relatorios: false, configuracoes: false, whatsapp: false,
      },
    })
    .select("id, nome, email, role, cargo, cor, telefone, data_admissao, especialidades, permissoes")
    .single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao || sessao.role !== "admin") return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const body = await request.json();
  const { id, ...campos } = body;
  if (!id) return NextResponse.json({ erro: "ID obrigatorio" }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("funcionarios")
    .update(campos)
    .eq("id", id)
    .select("id, nome, email, role, cargo, cor, ativo, telefone, data_admissao, status, especialidades, permissoes, recebe_follow_ups")
    .single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  const body = await request.json();
  const { id, ...updates } = body;
  const { data, error } = await supabaseAdmin.from("funcionarios").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}