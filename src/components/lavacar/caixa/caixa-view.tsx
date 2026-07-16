"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Wallet } from "lucide-react";
import { MovimentacaoRow } from "../movimentacao-row";
import { EditarMovimentacaoModal } from "../editar-movimentacao-modal";
import { ConfirmDialog } from "../confirm-dialog";
import { EmptyState } from "../empty-state";
import { useLavacarActions } from "../actions-context";
import { excluirMovimentacao } from "@/app/actions/lavacar";
import { formatBRL, formatDiaSemana, round2 } from "@/lib/lavacar/format";
import type { Categoria, Movimentacao, ResumoPeriodo } from "@/lib/lavacar/types";

interface Grupo {
  data: string;
  itens: Movimentacao[];
  saldo: number;
}

export function CaixaView({
  movimentacoes,
  totais,
  categorias,
}: {
  movimentacoes: Movimentacao[];
  totais: ResumoPeriodo;
  categorias: Categoria[];
}) {
  const router = useRouter();
  const { abrirMenuRapido } = useLavacarActions();

  const [editando, setEditando] = useState<Movimentacao | null>(null);
  const [excluindo, setExcluindo] = useState<Movimentacao | null>(null);

  const grupos = useMemo<Grupo[]>(() => {
    const map = new Map<string, Movimentacao[]>();
    for (const m of movimentacoes) {
      const arr = map.get(m.data) ?? [];
      arr.push(m);
      map.set(m.data, arr);
    }
    return [...map.entries()].map(([data, itens]) => {
      const saldo = round2(
        itens.reduce(
          (s, m) => s + (m.tipo === "entrada" ? m.valor : -m.valor),
          0
        )
      );
      return { data, itens, saldo };
    });
  }, [movimentacoes]);

  async function confirmarExclusao() {
    if (!excluindo) return;
    const res = await excluirMovimentacao(excluindo.id);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Movimentação excluída");
    setExcluindo(null);
    router.refresh();
  }

  return (
    <>
      {/* Totais do período */}
      <div className="grid grid-cols-3 gap-3">
        <TotalCard label="Entrou" value={totais.entradas} color="success" />
        <TotalCard label="Saiu" value={totais.saidas} color="danger" />
        <TotalCard
          label="Saldo"
          value={totais.saldo}
          color={totais.saldo >= 0 ? "success" : "danger"}
        />
      </div>

      {/* Lista agrupada */}
      {movimentacoes.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nenhuma movimentação no período"
          description="Ajuste o filtro ou registre uma nova entrada/saída."
        />
      ) : (
        <div className="space-y-5">
          {grupos.map((g, i) => (
            <motion.div
              key={g.data}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
            >
              <div className="mb-1.5 flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {formatDiaSemana(g.data)}
                </h3>
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{
                    color: `var(--color-${g.saldo >= 0 ? "success" : "danger"})`,
                  }}
                >
                  {g.saldo >= 0 ? "+" : "−"}
                  {formatBRL(Math.abs(g.saldo))}
                </span>
              </div>
              <div className="card divide-y divide-border-soft p-1.5">
                {g.itens.map((m) => (
                  <MovimentacaoRow
                    key={m.id}
                    mov={m}
                    actions={
                      <div className="flex shrink-0 items-center">
                        <button
                          type="button"
                          onClick={() => setEditando(m)}
                          aria-label="Editar"
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setExcluindo(m)}
                          aria-label="Excluir"
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-danger/15 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    }
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={abrirMenuRapido}
        aria-label="Nova movimentação"
        className="btn-brand fixed bottom-24 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition active:scale-95 md:bottom-8 md:right-8"
      >
        <Plus className="h-7 w-7" />
      </button>

      <EditarMovimentacaoModal
        mov={editando}
        categorias={categorias}
        onClose={() => setEditando(null)}
      />
      <ConfirmDialog
        open={!!excluindo}
        onClose={() => setExcluindo(null)}
        onConfirm={confirmarExclusao}
        title="Excluir movimentação"
        message={
          excluindo
            ? `Deseja excluir "${excluindo.descricao}" de ${formatBRL(excluindo.valor)}? Essa ação não pode ser desfeita.`
            : ""
        }
      />
    </>
  );
}

function TotalCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="card p-3.5 text-center">
      <p className="text-[11px] text-muted">{label}</p>
      <p
        className="mt-0.5 text-sm font-bold tabular-nums sm:text-base"
        style={{ color: `var(--color-${color})` }}
      >
        {formatBRL(value)}
      </p>
    </div>
  );
}
