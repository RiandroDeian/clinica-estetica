// Resolve o segredo usado para assinar/validar as sessões (JWT).
//
// Regra de segurança: em produção (inclui deploys de Preview na Vercel, que
// rodam com NODE_ENV=production) o AUTH_SECRET é OBRIGATÓRIO. Se faltar, falha
// alto em vez de cair silenciosamente num segredo público — o que permitiria
// forjar sessões de administrador.
//
// Em desenvolvimento local usa um fallback só para não travar o `npm run dev`.
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET ausente ou muito curto. Defina a variável de ambiente AUTH_SECRET (mín. 16 caracteres) nas configurações do projeto.",
    );
  }

  return "dev-only-insecure-secret-nao-use-em-producao";
}

/** Segredo já codificado em bytes, pronto para jose (SignJWT/jwtVerify). */
export function getSecretBytes(): Uint8Array {
  return new TextEncoder().encode(getAuthSecret());
}
