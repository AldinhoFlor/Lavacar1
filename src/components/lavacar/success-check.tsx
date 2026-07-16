"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

/**
 * Overlay de sucesso (animação de check) exibido brevemente após uma ação.
 * O componente que o usa controla a visibilidade e o timeout de fechamento.
 */
export function SuccessCheck({ label = "Pronto!" }: { label?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-2xl bg-surface/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{
          background: "color-mix(in srgb, var(--color-success) 20%, transparent)",
          color: "var(--color-success)",
        }}
      >
        <motion.span
          initial={{ scale: 0.3 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 16 }}
        >
          <Check className="h-10 w-10" strokeWidth={3} />
        </motion.span>
      </motion.span>
      <p className="text-lg font-semibold text-fg">{label}</p>
    </motion.div>
  );
}
