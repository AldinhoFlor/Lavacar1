// =============================================================================
// LavaCar — formatação (moeda BRL, datas pt-BR) e helpers de período
// =============================================================================

import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata um número como moeda brasileira: 50 -> "R$ 50,00". */
export function formatBRL(value: number | null | undefined): string {
  return brl.format(value ?? 0);
}

/** Arredonda para 2 casas decimais (padrão monetário do módulo). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Converte um valor `date` do banco (yyyy-MM-dd) numa Date local sem
 * deslocamento de fuso — trata a string como data-calendário, não instante UTC.
 */
export function parseDateOnly(iso: string): Date {
  // "2026-07-16" -> Date no fuso local à meia-noite
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Aceita "yyyy-MM-dd" (coluna date) ou ISO completo e devolve uma Date. */
function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  return value.length === 10 ? parseDateOnly(value) : parseISO(value);
}

/** "16 de julho de 2026" */
export function formatData(value: string | Date): string {
  return format(toDate(value), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

/** "16/07/2026" */
export function formatDataCurta(value: string | Date): string {
  return format(toDate(value), "dd/MM/yyyy", { locale: ptBR });
}

/** "16/07" — para eixos de gráfico */
export function formatDiaMes(value: string | Date): string {
  return format(toDate(value), "dd/MM", { locale: ptBR });
}

/** "Quinta, 16 de julho" — cabeçalho de grupo por dia */
export function formatDiaSemana(value: string | Date): string {
  return format(toDate(value), "EEEE, dd 'de' MMMM", { locale: ptBR });
}

/** "julho de 2026" — navegação de relatório */
export function formatMesAno(ano: number, mes: number): string {
  return format(new Date(ano, mes - 1, 1), "MMMM 'de' yyyy", { locale: ptBR });
}

/** Converte Date -> "yyyy-MM-dd" (formato das colunas date). */
export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

// -----------------------------------------------------------------------------
// Períodos — sempre retornam { de, ate } como "yyyy-MM-dd" (inclusivos)
// -----------------------------------------------------------------------------

export type Periodo = "hoje" | "semana" | "mes" | "custom";

export interface IntervaloDatas {
  de: string; // yyyy-MM-dd inclusivo
  ate: string; // yyyy-MM-dd inclusivo
}

export function intervaloHoje(ref: Date = new Date()): IntervaloDatas {
  const iso = toISODate(ref);
  return { de: iso, ate: iso };
}

/** Semana começando na segunda-feira (padrão pt-BR). */
export function intervaloSemana(ref: Date = new Date()): IntervaloDatas {
  return {
    de: toISODate(startOfWeek(ref, { weekStartsOn: 1 })),
    ate: toISODate(endOfWeek(ref, { weekStartsOn: 1 })),
  };
}

export function intervaloMes(ref: Date = new Date()): IntervaloDatas {
  return {
    de: toISODate(startOfMonth(ref)),
    ate: toISODate(endOfMonth(ref)),
  };
}

/** Mês/ano explícitos (mes 1-12). */
export function intervaloMesAno(ano: number, mes: number): IntervaloDatas {
  const ref = new Date(ano, mes - 1, 1);
  return intervaloMes(ref);
}

/** Intervalo custom a partir de duas datas soltas (ordena se invertidas). */
export function intervaloCustom(de: string, ate: string): IntervaloDatas {
  return de <= ate ? { de, ate } : { de: ate, ate: de };
}

/** Resolve um Periodo nomeado num intervalo concreto. */
export function resolverPeriodo(
  periodo: Periodo,
  custom?: { de: string; ate: string },
  ref: Date = new Date()
): IntervaloDatas {
  switch (periodo) {
    case "hoje":
      return intervaloHoje(ref);
    case "semana":
      return intervaloSemana(ref);
    case "mes":
      return intervaloMes(ref);
    case "custom":
      return custom
        ? intervaloCustom(custom.de, custom.ate)
        : intervaloHoje(ref);
  }
}
