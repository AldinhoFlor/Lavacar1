import "server-only";
import { createClient } from "@supabase/supabase-js";

// =============================================================================
// Client Supabase "admin" (service role) — SOMENTE server-side.
//
// Usa a SUPABASE_SERVICE_ROLE_KEY, que BYPASSA o RLS. Por isso o schema não
// precisa mudar: a autorização passa a ser feita em código (empresa única no
// modo sem login). NUNCA importe este módulo no client nem no middleware (edge);
// a chave é secreta e não pode vazar para o navegador.
//
// É usado apenas quando modoSemLogin() é verdadeiro.
// =============================================================================

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
