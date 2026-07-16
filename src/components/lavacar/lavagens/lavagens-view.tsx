"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Clock, Car, Check, Droplets } from "lucide-react";
import { PaymentIcon } from "../payment-icon";
import { EmptyState } from "../empty-state";
import { useLavacarActions } from "../actions-context";
import { marcarLavagemPaga } from "@/app/actions/lavacar";
import { formatBRL, formatDiaSemana, round2 } from "@/lib/lavacar/format";
import { formaPagamentoLabel } from "@/lib/lavacar/types";
import type { Lavagem } from "@/lib/lavacar/types";

export function LavagensView({
  pendentes,
  historico,
}: {
  pendentes: Lavagem[];
  historico: Lavagem[];
}) {
  const { abrirNovaLavagem } = useLavacarActions();

  const totalReceber = useMemo(
    () => round2(pendentes.reduce((s, l) => s + l.valor, 0)),
    [pendentes]
  );

  const grupos = useMemo(() => {
    const map = new Map<string, Lavagem[]>();
    for (const l of historico) {
      const arr = map.get(l.data) ?? [];
      arr.push(l);
      map.set(l.data, arr);
    }
    return [...map.entries()].map(([data, itens]) => ({ data, itens }));
  }, [historico]);

  return (
    <div className="space-y-6">
      {/* A receber (fiado) */}
      {pendentes.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-warning">
              <Clock className="h-4 w-4" /> A receber (fiado)
            </h2>
            <span className="text-sm font-bold tabular-nums text-warning">
              {formatBRL(totalReceber)}
            </span>
          </div>
          <div className="space-y-2">
            {pendentes.map((l) => (
              <PendenteRow key={l.id} lavagem={l} />
            ))}
          </div>
        </section>
      )}

      {/* Histórico */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold">Histórico de lavagens</h2>
        {historico.length === 0 ? (
          <EmptyState
            icon={Droplets}
            title="Nenhuma lavagem por aqui ainda"
            description="Registre a primeira lavagem para começar o histórico."
          >
            <button
              type="button"
              onClick={abrirNovaLavagem}
              className="btn-brand mt-1 flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition active:scale-[0.98]"
            >
              Nova lavagem
            </button>
          </EmptyState>
        ) : (
          <div className="space-y-5">
            {grupos.map((g, i) => (
              <motion.div
                key={g.data}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <h3 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  {formatDiaSemana(g.data)}
                </h3>
                <div className="card divide-y divide-border-soft p-1.5">
                  {g.itens.map((l) => (
                    <LavagemRow key={l.id} lavagem={l} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function detalhe(l: Lavagem): string | null {
  const partes = [l.cliente, l.placa].filter(Boolean);
  return partes.length ? partes.join(" · ") : null;
}

function LavagemRow({ lavagem }: { lavagem: Lavagem }) {
  const d = detalhe(lavagem);
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info/15 text-info">
        <Car className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">
          {lavagem.servico_nome}
        </p>
        <p className="flex items-center gap-1 truncate text-xs text-muted">
          <PaymentIcon forma={lavagem.forma_pagamento} className="h-3 w-3" />
          {formaPagamentoLabel(lavagem.forma_pagamento)}
          {d ? ` · ${d}` : ""}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-success">
        {formatBRL(lavagem.valor)}
      </span>
    </div>
  );
}

function PendenteRow({ lavagem }: { lavagem: Lavagem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const d = detalhe(lavagem);

  function receber() {
    startTransition(async () => {
      const res = await marcarLavagemPaga(lavagem.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Recebido! Entrada lançada no caixa.");
      router.refresh();
    });
  }

  return (
    <div className="card flex items-center gap-3 border-warning/30 p-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: "color-mix(in srgb, var(--color-warning) 16%, transparent)",
          color: "var(--color-warning)",
        }}
      >
        <Clock className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">
          {lavagem.servico_nome}
        </p>
        <p className="truncate text-xs text-muted">
          {d ?? "Sem cliente"} · {formatBRL(lavagem.valor)}
        </p>
      </div>
      <button
        type="button"
        onClick={receber}
        disabled={pending}
        className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white transition active:scale-[0.97] disabled:opacity-60"
        style={{ background: "var(--color-success)" }}
      >
        <Check className="h-4 w-4" />
        {pending ? "…" : "Receber"}
      </button>
    </div>
  );
}
