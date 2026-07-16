"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { SuccessCheck } from "./success-check";
import { PaymentIcon } from "./payment-icon";
import { parseValor, valorValido } from "./money";
import { criarMovimentacao } from "@/app/actions/lavacar";
import { formatBRL, toISODate } from "@/lib/lavacar/format";
import { FORMAS_PAGAMENTO, FORMAS_PAGAMENTO_LIST } from "@/lib/lavacar/types";
import type { Categoria, FormaPagamento } from "@/lib/lavacar/types";

export function NovaDespesaModal({
  open,
  onClose,
  empresaId,
  categorias,
}: {
  open: boolean;
  onClose: () => void;
  empresaId: string;
  categorias: Categoria[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sucesso, setSucesso] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [forma, setForma] = useState<FormaPagamento>("dinheiro");
  const [data, setData] = useState(() => toISODate(new Date()));

  const categoriasSaida = useMemo(
    () => categorias.filter((c) => c.tipo === "saida"),
    [categorias]
  );

  const valorNum = parseValor(valor);
  const podeSalvar = valorValido(valorNum) && valorNum > 0;

  function reset() {
    setValor("");
    setDescricao("");
    setCategoriaId(null);
    setForma("dinheiro");
    setData(toISODate(new Date()));
  }

  function handleClose() {
    if (pending) return;
    reset();
    onClose();
  }

  function salvar() {
    if (!podeSalvar) return;
    const nomeCat =
      categorias.find((c) => c.id === categoriaId)?.nome ?? "despesa";
    startTransition(async () => {
      const res = await criarMovimentacao({
        empresaId,
        tipo: "saida",
        categoriaId,
        descricao: descricao.trim() || nomeCat,
        valor: valorNum,
        formaPagamento: forma,
        data,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      setSucesso(true);
      toast.success("Despesa salva!");
      router.refresh();
      timeoutRef.current = setTimeout(() => {
        setSucesso(false);
        reset();
        onClose();
      }, 1100);
    });
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nova despesa">
      <div className="relative">
        <AnimatePresence>{sucesso && <SuccessCheck label="Salva!" />}</AnimatePresence>

        {/* Valor grande */}
        <div className="mb-4">
          <label
            htmlFor="desp-valor"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted"
          >
            Quanto saiu?
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-2 px-4 py-3 focus-within:border-danger">
            <span className="text-2xl font-bold text-danger">R$</span>
            <input
              id="desp-valor"
              inputMode="decimal"
              autoFocus
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full bg-transparent text-3xl font-bold text-fg outline-none placeholder:text-muted/50"
            />
          </div>
          {valor && valorValido(valorNum) && (
            <p className="mt-1 text-right text-xs text-muted">
              {formatBRL(valorNum)}
            </p>
          )}
        </div>

        {/* Descrição */}
        <div className="mb-4">
          <label
            htmlFor="desp-desc"
            className="mb-1 block text-xs font-medium text-muted"
          >
            Descrição
          </label>
          <input
            id="desp-desc"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex.: shampoo automotivo"
            className="h-12 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-fg outline-none focus:border-brand"
          />
        </div>

        {/* Categorias (chips) */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-muted">Categoria</p>
          <div className="flex flex-wrap gap-2">
            {categoriasSaida.map((c) => {
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
            {categoriasSaida.length === 0 && (
              <span className="text-sm text-muted">
                Nenhuma categoria de saída.
              </span>
            )}
          </div>
        </div>

        {/* Forma de pagamento */}
        <div className="mb-4">
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
                  className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl border p-1.5 transition active:scale-[0.97] ${
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

        {/* Data */}
        <div className="mb-5">
          <label
            htmlFor="desp-data"
            className="mb-1 block text-xs font-medium text-muted"
          >
            Data
          </label>
          <input
            id="desp-data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-fg outline-none focus:border-brand"
          />
        </div>

        <button
          type="button"
          onClick={salvar}
          disabled={!podeSalvar || pending}
          className="flex h-14 w-full items-center justify-center rounded-2xl text-base font-bold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "var(--color-danger)" }}
        >
          {pending ? "Salvando…" : "Salvar despesa"}
        </button>
      </div>
    </Modal>
  );
}
