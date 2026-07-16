"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { PaymentIcon } from "./payment-icon";
import { parseValor, valorValido } from "./money";
import { atualizarMovimentacao } from "@/app/actions/lavacar";
import { FORMAS_PAGAMENTO, FORMAS_PAGAMENTO_LIST } from "@/lib/lavacar/types";
import type {
  Categoria,
  FormaPagamento,
  Movimentacao,
  TipoMovimentacao,
} from "@/lib/lavacar/types";

export function EditarMovimentacaoModal({
  mov,
  categorias,
  onClose,
}: {
  mov: Movimentacao | null;
  categorias: Categoria[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [tipo, setTipo] = useState<TipoMovimentacao>("saida");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [forma, setForma] = useState<FormaPagamento>("dinheiro");
  const [data, setData] = useState("");

  useEffect(() => {
    if (!mov) return;
    setTipo(mov.tipo);
    setValor(String(mov.valor).replace(".", ","));
    setDescricao(mov.descricao);
    setCategoriaId(mov.categoria_id);
    setForma(mov.forma_pagamento);
    setData(mov.data);
  }, [mov]);

  const categoriasDoTipo = useMemo(
    () => categorias.filter((c) => c.tipo === tipo),
    [categorias, tipo]
  );

  const valorNum = parseValor(valor);
  const podeSalvar = valorValido(valorNum) && valorNum > 0 && descricao.trim().length > 0;

  function salvar() {
    if (!mov || !podeSalvar) return;
    startTransition(async () => {
      const res = await atualizarMovimentacao(mov.id, {
        tipo,
        valor: valorNum,
        descricao,
        categoriaId,
        formaPagamento: forma,
        data,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Movimentação atualizada");
      router.refresh();
      onClose();
    });
  }

  return (
    <Modal open={!!mov} onClose={onClose} title="Editar movimentação">
      {/* Tipo */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {(["entrada", "saida"] as TipoMovimentacao[]).map((t) => {
          const ativo = t === tipo;
          const cor = t === "entrada" ? "success" : "danger";
          return (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTipo(t);
                setCategoriaId(null);
              }}
              aria-pressed={ativo}
              className="min-h-[44px] rounded-xl border text-sm font-semibold transition active:scale-[0.98]"
              style={
                ativo
                  ? {
                      borderColor: `var(--color-${cor})`,
                      background: `color-mix(in srgb, var(--color-${cor}) 15%, transparent)`,
                      color: `var(--color-${cor})`,
                    }
                  : undefined
              }
            >
              {t === "entrada" ? "Entrada" : "Saída"}
            </button>
          );
        })}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ed-valor" className="mb-1 block text-xs font-medium text-muted">
            Valor
          </label>
          <input
            id="ed-valor"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-fg outline-none focus:border-brand"
          />
        </div>
        <div>
          <label htmlFor="ed-data" className="mb-1 block text-xs font-medium text-muted">
            Data
          </label>
          <input
            id="ed-data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-fg outline-none focus:border-brand"
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="ed-desc" className="mb-1 block text-xs font-medium text-muted">
          Descrição
        </label>
        <input
          id="ed-desc"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="h-12 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-fg outline-none focus:border-brand"
        />
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-medium text-muted">Categoria</p>
        <div className="flex flex-wrap gap-2">
          {categoriasDoTipo.map((c) => {
            const ativo = c.id === categoriaId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoriaId(ativo ? null : c.id)}
                aria-pressed={ativo}
                className={`min-h-[40px] rounded-full border px-3.5 py-1.5 text-sm font-medium transition active:scale-[0.97] ${
                  ativo
                    ? "border-brand bg-brand/15 text-fg"
                    : "border-border bg-surface-2 text-muted hover:border-brand/50"
                }`}
              >
                {c.nome}
              </button>
            );
          })}
          {categoriasDoTipo.length === 0 && (
            <span className="text-sm text-muted">Sem categorias.</span>
          )}
        </div>
      </div>

      <div className="mb-5">
        <p className="mb-2 text-xs font-medium text-muted">Forma de pagamento</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {FORMAS_PAGAMENTO_LIST.map((f) => {
            const ativo = f.value === forma;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setForma(f.value)}
                aria-pressed={ativo}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl border p-1.5 transition active:scale-[0.97] ${
                  ativo
                    ? "border-brand bg-brand/15 text-fg"
                    : "border-border bg-surface-2 text-muted hover:border-brand/50"
                }`}
              >
                <PaymentIcon forma={f.value} className="h-4 w-4" />
                <span className="text-[11px] font-medium">
                  {FORMAS_PAGAMENTO[f.value].label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="h-12 flex-1 rounded-xl border border-border bg-surface-2 text-sm font-semibold text-fg transition active:scale-[0.98] disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={salvar}
          disabled={!podeSalvar || pending}
          className="btn-brand h-12 flex-1 rounded-xl text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </Modal>
  );
}
