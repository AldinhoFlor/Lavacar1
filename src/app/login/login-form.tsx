"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { login } from "./actions";
import { LogoMark } from "@/components/logo";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null as null | { error: string });

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="card w-full max-w-md p-8 shadow-2xl"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <motion.div
            initial={{ rotate: -12, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mb-4"
          >
            <LogoMark className="h-14 w-14" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight">
            Lava<span className="gradient-text">Car</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Controle de caixa do seu lava-rápido
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">E-mail</label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Senha</label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {state?.error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger"
            >
              {state.error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          Seus dados ficam protegidos por RLS no Supabase
        </p>
      </motion.div>
    </div>
  );
}
