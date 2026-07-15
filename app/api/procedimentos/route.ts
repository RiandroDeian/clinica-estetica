export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessao } from "@/lib/auth";

export async function GET() {
  try {
    const sessao = await getSessao();

    if (!sessao) {
      return NextResponse.json(
        { erro: "Nao autorizado" },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("procedimentos")
      .select("*")
      .eq("ativo", true)
      .order("nome");

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      {
        erro: err?.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessao = await getSessao();

    if (!sessao) {
      return NextResponse.json(
        { erro: "Nao autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("procedimentos")
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { erro: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      {
        erro: err?.message,
      },
      { status: 500 }
    );
  }
}

