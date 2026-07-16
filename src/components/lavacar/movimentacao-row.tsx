"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatBRL } from "@/lib/lavacar/format";
import { formaPagamentoLabel } from "@/lib/lavacar/types";
import type { Movimentacao } from "@/lib/lavacar/types";

/** Linha de movimentação reutilizada no dashboard e no caixa. */
export function MovimentacaoRow({
  mov,
  actions,
}: {
  mov: Movimentacao;
  actions?: React.ReactNode;
}) {
  const entrada = mov.tipo === "entrada";
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-surface-2/60">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: `color-mix(in srgb, var(--color-${entrada ? "success" : "danger"}) 16%, transparent)`,
          color: `var(--color-${entrada ? "success" : "danger"})`,
        }}
      >
        {entrada ? (
          <ArrowUpRight className="h-5 w-5" />
        ) : (
          <ArrowDownLeft className="h-5 w-5" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{mov.descricao}</p>
        <p className="truncate text-xs text-muted">
          {mov.categoria_nome ? `${mov.categoria_nome} · ` : ""}
          {formaPagamentoLabel(mov.forma_pagamento)}
        </p>
      </div>

      <span
        className="shrink-0 text-sm font-semibold tabular-nums"
        style={{ color: `var(--color-${entrada ? "success" : "danger"})` }}
      >
        {entrada ? "+" : "−"}
        {formatBRL(mov.valor)}
      </span>

      {actions}
    </div>
  );
}
