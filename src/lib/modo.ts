// =============================================================================
// Modo de operação do app.
//
// "Modo sem login": quando MODO_SEM_LOGIN=true, o app roda como single-empresa
// (uso pessoal), sem exigir conta/sessão. Todo o acesso a dados passa a usar o
// client admin (service role) no servidor, que bypassa o RLS.
//
// Quando desligado (env ausente ou != "true"), o app volta a exigir login via
// Supabase Auth + RLS — o caminho multi-empresa para vender a vários clientes.
// =============================================================================

/** true quando o app deve rodar sem login (single-empresa, uso pessoal). */
export function modoSemLogin(): boolean {
  return process.env.MODO_SEM_LOGIN === "true";
}
