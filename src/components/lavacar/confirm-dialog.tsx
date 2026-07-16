"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { AlertTriangle } from "lucide-react";

/**
 * Modal de confirmação para ações destrutivas. `onConfirm` pode ser assíncrono;
 * o botão mostra estado de carregamento enquanto resolve.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Excluir",
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: `color-mix(in srgb, var(--color-${danger ? "danger" : "warning"}) 16%, transparent)`,
            color: `var(--color-${danger ? "danger" : "warning"})`,
          }}
        >
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </span>
        <p className="pt-1 text-sm text-muted">{message}</p>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="h-12 flex-1 rounded-xl border border-border bg-surface-2 text-sm font-semibold text-fg transition active:scale-[0.98] disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="h-12 flex-1 rounded-xl text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
          style={{ background: `var(--color-${danger ? "danger" : "brand"})` }}
        >
          {loading ? "Aguarde…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
