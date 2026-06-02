import { createClient } from "@supabase/supabase-js";

// Cliente admin (usa a SERVICE_ROLE_KEY — nunca exponha no frontend)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ← variável de ambiente privada
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);