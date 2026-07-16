"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Car, ArrowRight } from "lucide-react";
import { criarEmpresa } from "@/app/actions/lavacar";

export function OnboardingForm() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [pending, startTransition] = useTransition();

  function criar() {
    const limpo = nome.trim();
    if (!limpo) {
      toast.error("Informe o nome do seu lava-rápido");
      return;
    }
    startTransition(async () => {
      const res = await criarEmpresa(limpo);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Tudo pronto! Bem-vindo 🚗");
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="card w-full max-w-md p-7 text-center"
    >
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 18 }}
        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-white"
      >
        <Car className="h-8 w-8" />
      </motion.span>

      <h1 className="text-2xl font-bold tracking-tight">Bem-vindo ao LavaCar</h1>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
        Controle o caixa do seu lava-rápido de forma simples. Como se chama seu
        negócio?
      </p>

      <div className="mt-6 text-left">
        <label
          htmlFor="empresa-nome"
          className="mb-1.5 block text-xs font-medium text-muted"
        >
          Nome do seu lava-rápido
        </label>
        <input
          id="empresa-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") criar();
          }}
          autoFocus
          placeholder="Ex.: Lava-Jato do Zé"
          className="h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 text-base text-fg outline-none focus:border-brand"
        />
      </div>

      <button
        type="button"
        onClick={criar}
        disabled={pending || !nome.trim()}
        className="btn-brand mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Criando…" : "Começar"}
        {!pending && <ArrowRight className="h-5 w-5" />}
      </button>

      <p className="mt-4 text-xs text-muted">
        Já deixamos serviços e categorias prontos para você editar depois.
      </p>
    </motion.div>
  );
}
