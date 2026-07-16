// =============================================================================
// LavaCar — helpers de parsing de valor monetário digitado (input pt-BR).
// (Não é query nem action — apenas utilidade de UI.)
// =============================================================================

/**
 * Converte texto digitado pelo usuário ("50", "50,00", "1.250,50", "R$ 30")
 * num número. Retorna NaN quando não há dígitos.
 */
export function parseValor(raw: string): number {
  const s = (raw ?? "").trim().replace(/[^\d.,]/g, "");
  if (!s) return NaN;
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  let normalized = s;
  if (hasComma && hasDot) {
    // dot como separador de milhar, vírgula como decimal
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    normalized = s.replace(",", ".");
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

/** Valor válido para envio (número finito e >= 0). */
export function valorValido(n: number): boolean {
  return Number.isFinite(n) && n >= 0;
}
