"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { ChevronDown, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { SuccessCheck } from "./success-check";
import { PaymentIcon } from "./payment-icon";
import { parseValor, valorValido } from "./money";
import { registrarLavagem } from "@/app/actions/lavacar";
import { formatBRL } from "@/lib/lavacar/format";
import { FORMAS_PAGAMENTO } from "@/lib/lavacar/types";
import type { FormaPagamento, Servico } from "@/lib/lavacar/types";

const FORMAS_PRINCIPAIS: FormaPagamento[] = [
  "dinheiro",
  "pix",
  "cartao_debito",
  "cartao_credito",
];

export function NovaLavagemModal({
  open,
  onClose,
  empresaId,
  servicos,
}: {
  open: boolean;
  onClose: () => void;
  empresaId: string;
  servicos: Servico[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sucesso, setSucesso] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [servicoId, setServicoId] = useState<string | null>(null);
  const [servicoNome, setServicoNome] = useState<string>("");
  const [forma, setForma] = useState<FormaPagamento>("dinheiro");
  const [detalhes, setDetalhes] = useState(false);
  const [valorCustom, setValorCustom] = useState("");
  const [cliente, setCliente] = useState("");
  const [placa, setPlaca] = useState("");
  const [fiado, setFiado] = useState(false);

  const servicosAtivos = useMemo(
    () => servicos.filter((s) => s.ativo),
    [servicos]
  );

  const servicoSel = servicos.find((s) => s.id === servicoId) ?? null;
  const valorCustomNum = parseValor(valorCustom);
  const valorFinal = valorValido(valorCustomNum)
    ? valorCustomNum
    : servicoSel?.preco ?? 0;

  const podeRegistrar = !!servicoNome && valorValido(valorFinal) && valorFinal > 0;

  function reset() {
    setServicoId(null);
    setServicoNome("");
    setForma("dinheiro");
    setDetalhes(false);
    setValorCustom("");
    setCliente("");
    setPlaca("");
    setFiado(false);
  }

  function handleClose() {
    if (pending) return;
    reset();
    onClose();
  }

  function selecionar(s: Servico) {
    setServicoId(s.id);
    setServicoNome(s.nome);
  }

  function registrar() {
    if (!podeRegistrar) return;
    startTransition(async () => {
      const res = await registrarLavagem({
        empresaId,
        servicoId,
        servicoNome,
        valor: valorFinal,
        formaPagamento: forma,
        cliente: cliente || null,
        placa: placa || null,
        status: fiado ? "pendente" : "pago",
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      setSucesso(true);
      toast.success(
        fiado ? "Lavagem registrada (fiado)" : "Lavagem registrada!"
      );
      router.refresh();
      timeoutRef.current = setTimeout(() => {
        setSucesso(false);
        reset();
        onClose();
      }, 1100);
    });
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nova lavagem" wide>
      <div className="relative">
        <AnimatePresence>{sucesso && <SuccessCheck label="Registrada!" />}</AnimatePresence>

        {/* Passo 1 — serviço */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          1. Escolha o serviço
        </p>
        {servicosAtivos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            Nenhum serviço cadastrado. Adicione em Ajustes.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {servicosAtivos.map((s) => {
              const ativo = s.id === servicoId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selecionar(s)}
                  aria-pressed={ativo}
                  className={`flex min-h-[64px] flex-col items-start justify-center rounded-xl border p-3 text-left transition active:scale-[0.97] ${
                    ativo
                      ? "border-brand bg-brand/15"
                      : "border-border bg-surface-2 hover:border-brand/50"
                  }`}
                >
                  <span className="line-clamp-2 text-sm font-semibold text-fg">
                    {s.nome}
                  </span>
                  <span className="mt-0.5 text-xs text-muted">
                    {formatBRL(s.preco)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Passo 2 — forma de pagamento */}
        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted">
          2. Forma de pagamento
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {FORMAS_PRINCIPAIS.map((f) => {
            const ativo = f === forma;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setForma(f)}
                aria-pressed={ativo}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl border p-2 transition active:scale-[0.97] ${
                  ativo
                    ? "border-brand bg-brand/15 text-fg"
                    : "border-border bg-surface-2 text-muted hover:border-brand/50"
                }`}
              >
                <PaymentIcon forma={f} className="h-5 w-5" />
                <span className="text-xs font-medium">
                  {FORMAS_PAGAMENTO[f].label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mais detalhes (recolhido) */}
        <button
          type="button"
          onClick={() => setDetalhes((v) => !v)}
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-fg"
          aria-expanded={detalhes}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${detalhes ? "rotate-180" : ""}`}
          />
          Mais detalhes
        </button>

        <AnimatePresence initial={false}>
          {detalhes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-3 rounded-xl border border-border-soft bg-surface-2/40 p-3">
                <div>
                  <label
                    htmlFor="lav-valor"
                    className="mb-1 block text-xs font-medium text-muted"
                  >
                    Valor personalizado
                  </label>
                  <input
                    id="lav-valor"
                    inputMode="decimal"
                    placeholder={
                      servicoSel ? formatBRL(servicoSel.preco) : "R$ 0,00"
                    }
                    value={valorCustom}
                    onChange={(e) => setValorCustom(e.target.value)}
                    className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-brand"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="lav-cliente"
                      className="mb-1 block text-xs font-medium text-muted"
                    >
                      Cliente
                    </label>
                    <input
                      id="lav-cliente"
                      value={cliente}
                      onChange={(e) => setCliente(e.target.value)}
                      className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lav-placa"
                      className="mb-1 block text-xs font-medium text-muted"
                    >
                      Placa
                    </label>
                    <input
                      id="lav-placa"
                      value={placa}
                      onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                      className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm uppercase text-fg outline-none focus:border-brand"
                    />
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface p-3">
                  <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                    <input
                      type="checkbox"
                      checked={fiado}
                      onChange={(e) => setFiado(e.target.checked)}
                      className="peer h-6 w-6 appearance-none rounded-md border border-border bg-surface-2 checked:border-warning checked:bg-warning/20"
                    />
                    <Check className="pointer-events-none absolute h-4 w-4 text-warning opacity-0 peer-checked:opacity-100" />
                  </span>
                  <span className="text-sm">
                    <span className="font-medium text-fg">Fiado (a receber)</span>
                    <span className="block text-xs text-muted">
                      Não entra no caixa até ser recebido
                    </span>
                  </span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmar */}
        <button
          type="button"
          onClick={registrar}
          disabled={!podeRegistrar || pending}
          className="btn-brand mt-5 flex h-14 w-full items-center justify-center rounded-2xl text-base font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? "Registrando…"
            : `Registrar ${formatBRL(valorFinal)}${fiado ? " (fiado)" : ""}`}
        </button>
      </div>
    </Modal>
  );
}
