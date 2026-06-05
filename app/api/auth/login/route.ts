import { NextRequest, NextResponse } from "next/server";
import { verificarCredenciais, criarSessao } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const tentativas = new Map<string, { count: number; bloqueadoAte?: number }>();

function getIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
}

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  const agora = Date.now();

  const t = tentativas.get(ip);
  if (t?.bloqueadoAte && t.bloqueadoAte > agora) {
    const minutosRestantes = Math.ceil((t.bloqueadoAte - agora) / 60000);
    return NextResponse.json(
      { erro: `Muitas tentativas. Aguarde ${minutosRestantes} minuto(s).` },
      { status: 429 }
    );
  }

  try {
    const { email, senha } = await request.json();
    if (!email || !senha) {
      return NextResponse.json({ erro: "Email e senha sao obrigatorios" }, { status: 400 });
    }

    const user = await verificarCredenciais(email, senha);

    if (!user) {
      const atual = tentativas.get(ip) ?? { count: 0 };
      const novoCount = atual.count + 1;
      if (novoCount >= 5) {
        tentativas.set(ip, { count: novoCount, bloqueadoAte: agora + 15 * 60 * 1000 });
      } else {
        tentativas.set(ip, { count: novoCount });
      }

      supabaseAdmin.from("audit_logs").insert({
        funcionario_nome: email,
        acao: "login",
        tabela: "funcionarios",
        descricao: `Tentativa de login falha para ${email} — IP: ${ip} (tentativa ${novoCount}/5)`,
      }).then(() => {}).catch(() => {});

      await new Promise(r => setTimeout(r, 800));
      return NextResponse.json(
        { erro: `Email ou senha incorretos. ${5 - novoCount > 0 ? `${5 - novoCount} tentativa(s) restante(s).` : "Conta bloqueada por 15 minutos."}` },
        { status: 401 }
      );
    }

    tentativas.delete(ip);
    await criarSessao(user);

    supabaseAdmin.from("audit_logs").insert({
      funcionario_id:   user.id,
      funcionario_nome: user.nome,
      acao: "login",
      tabela: "funcionarios",
      descricao: `Login de ${user.nome} (${user.email}) — IP: ${ip}`,
    }).then(() => {}).catch(() => {});

    return NextResponse.json({ ok: true, user: { nome: user.nome, role: user.role, cargo: user.cargo } });

  } catch (err) {
    console.error("[AUTH] Erro no login:", err);
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 });
  }
}
