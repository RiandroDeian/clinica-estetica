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

    console.log(
      "SUPABASE URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );

    console.log(
      "SERVICE KEY:",
      process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20)
    );

    const { data, error } = await supabaseAdmin
      .from("procedimentos")
      .select("*")
      .order("nome");

    console.log("PROCEDIMENTOS:", data);
    console.log("ERRO:", error);

    return NextResponse.json({
      data,
      error,
    });
  } catch (err: any) {
    console.log("ERRO GERAL:", err);

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