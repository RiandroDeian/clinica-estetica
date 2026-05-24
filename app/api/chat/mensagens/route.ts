export async function POST(request: NextRequest) {
  const sessao = await getSessao();

  if (!sessao) {
    return NextResponse.json(
      { erro: "Nao autorizado" },
      { status: 401 }
    );
  }

  const {
    conteudo,
    canal_id,
    reply_id,
    mencoes,
    arquivo_url,
    arquivo_nome,
    arquivo_tipo,
  } = await request.json();

  if (!conteudo?.trim()) {
    return NextResponse.json(
      { erro: "Mensagem vazia" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("chat_mensagens")
    .insert({
      conteudo: conteudo.trim(),
      funcionario_id: sessao.id,

      canal_id: canal_id ?? null,
      reply_id: reply_id ?? null,
      mencoes: mencoes ?? [],

      arquivo_url: arquivo_url ?? null,
      arquivo_nome: arquivo_nome ?? null,
      arquivo_tipo: arquivo_tipo ?? null,
    })
    .select("*, funcionarios(nome, cor)")
    .single();

  if (error) {
    return NextResponse.json(
      { erro: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}