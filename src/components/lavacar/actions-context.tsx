"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Droplets, TrendingDown, X } from "lucide-react";
import { NovaLavagemModal } from "./nova-lavagem-modal";
import { NovaDespesaModal } from "./nova-despesa-modal";
import type { Categoria, Servico } from "@/lib/lavacar/types";

interface LavacarActions {
  abrirNovaLavagem: () => void;
  abrirNovaDespesa: () => void;
  abrirMenuRapido: () => void;
}

const Ctx = createContext<LavacarActions | null>(null);

/** Hook para acionar os fluxos rápidos de qualquer componente client do módulo. */
export function useLavacarActions(): LavacarActions {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useLavacarActions deve ser usado dentro de LavacarProvider");
  }
  return ctx;
}

export function LavacarProvider({
  empresaId,
  servicos,
  categorias,
  children,
}: {
  empresaId: string;
  servicos: Servico[];
  categorias: Categoria[];
  children: ReactNode;
}) {
  const [lavagem, setLavagem] = useState(false);
  const [despesa, setDespesa] = useState(false);
  const [menu, setMenu] = useState(false);

  const abrirNovaLavagem = useCallback(() => {
    setMenu(false);
    setLavagem(true);
  }, []);
  const abrirNovaDespesa = useCallback(() => {
    setMenu(false);
    setDespesa(true);
  }, []);
  const abrirMenuRapido = useCallback(() => setMenu(true), []);

  return (
    <Ctx.Provider value={{ abrirNovaLavagem, abrirNovaDespesa, abrirMenuRapido }}>
      {children}

      {/* Menu de ação rápida (aberto pelo "+" central) */}
      <AnimatePresence>
        {menu && (
          <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenu(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="card relative z-10 m-3 w-full max-w-md p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
              role="dialog"
              aria-label="Ação rápida"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">O que aconteceu?</h2>
                <button
                  type="button"
                  onClick={() => setMenu(false)}
                  aria-label="Fechar"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={abrirNovaLavagem}
                  className="flex min-h-[64px] items-center gap-4 rounded-2xl border border-brand/40 bg-brand/10 p-4 text-left transition active:scale-[0.98]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/20 text-brand">
                    <Droplets className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block text-base font-semibold text-fg">
                      Nova lavagem
                    </span>
                    <span className="block text-sm text-muted">
                      Registrar um serviço prestado
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={abrirNovaDespesa}
                  className="flex min-h-[64px] items-center gap-4 rounded-2xl border border-border bg-surface-2 p-4 text-left transition active:scale-[0.98]"
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{
                      background: "color-mix(in srgb, var(--color-danger) 18%, transparent)",
                      color: "var(--color-danger)",
                    }}
                  >
                    <TrendingDown className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block text-base font-semibold text-fg">
                      Nova despesa
                    </span>
                    <span className="block text-sm text-muted">
                      Uma saída do caixa
                    </span>
                  </span>
                </button>
              </div>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
                <Sparkles className="h-3.5 w-3.5" />
                Tudo em pouquíssimos toques
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <NovaLavagemModal
        open={lavagem}
        onClose={() => setLavagem(false)}
        empresaId={empresaId}
        servicos={servicos}
      />
      <NovaDespesaModal
        open={despesa}
        onClose={() => setDespesa(false)}
        empresaId={empresaId}
        categorias={categorias}
      />
    </Ctx.Provider>
  );
}
