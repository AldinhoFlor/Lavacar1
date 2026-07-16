"use client";

import { useRouter } from "next/navigation";
import type { Periodo } from "@/lib/lavacar/format";

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
  { value: "custom", label: "Período" },
];

const TIPOS: { value: string; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "entrada", label: "Entradas" },
  { value: "saida", label: "Saídas" },
];

export function FiltrosCaixa({
  periodo,
  tipo,
  de,
  ate,
}: {
  periodo: Periodo;
  tipo: string;
  de: string;
  ate: string;
}) {
  const router = useRouter();

  function navegar(next: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { periodo, tipo, de, ate, ...next };
    params.set("periodo", merged.periodo);
    if (merged.tipo && merged.tipo !== "todas") params.set("tipo", merged.tipo);
    if (merged.periodo === "custom") {
      params.set("de", merged.de);
      params.set("ate", merged.ate);
    }
    router.push(`/caixa?${params.toString()}`);
  }

  return (
    <div className="space-y-2.5">
      {/* Período */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PERIODOS.map((p) => {
          const ativo = p.value === periodo;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => navegar({ periodo: p.value })}
              aria-pressed={ativo}
              className={`min-h-[40px] shrink-0 rounded-full border px-4 text-sm font-medium transition active:scale-[0.97] ${
                ativo
                  ? "border-brand bg-brand/15 text-brand"
                  : "border-border bg-surface-2 text-muted"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Datas custom */}
      {periodo === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="Data inicial"
            value={de}
            onChange={(e) => navegar({ periodo: "custom", de: e.target.value })}
            className="h-11 flex-1 rounded-xl border border-border bg-surface-2 px-3 text-sm text-fg outline-none focus:border-brand"
          />
          <span className="text-xs text-muted">até</span>
          <input
            type="date"
            aria-label="Data final"
            value={ate}
            onChange={(e) => navegar({ periodo: "custom", ate: e.target.value })}
            className="h-11 flex-1 rounded-xl border border-border bg-surface-2 px-3 text-sm text-fg outline-none focus:border-brand"
          />
        </div>
      )}

      {/* Tipo */}
      <div className="flex gap-2">
        {TIPOS.map((t) => {
          const ativo = t.value === tipo;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => navegar({ tipo: t.value })}
              aria-pressed={ativo}
              className={`min-h-[40px] flex-1 rounded-xl border text-sm font-medium transition active:scale-[0.97] ${
                ativo
                  ? "border-brand bg-brand/15 text-brand"
                  : "border-border bg-surface-2 text-muted"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
