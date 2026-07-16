"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { formatBRL } from "@/lib/lavacar/format";
import type { PontoSerieDiaria } from "@/lib/lavacar/types";

interface TooltipEntry {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-fg">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-1.5 text-muted">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: entry.color }}
          />
          {entry.dataKey === "entradas" ? "Entrou" : "Saiu"}:{" "}
          <span className="font-semibold text-fg">{formatBRL(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function SerieChart({ data }: { data: PontoSerieDiaria[] }) {
  return (
    <div className="h-48 w-full" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border-soft)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={Math.max(0, Math.floor(data.length / 7) - 1)}
            tick={{ fill: "var(--color-muted)", fontSize: 10 }}
          />
          <Tooltip
            cursor={{ fill: "var(--color-surface-2)", opacity: 0.5 }}
            content={<ChartTooltip />}
          />
          <Bar
            dataKey="entradas"
            fill="var(--color-success)"
            radius={[3, 3, 0, 0]}
            maxBarSize={14}
          />
          <Bar
            dataKey="saidas"
            fill="var(--color-danger)"
            radius={[3, 3, 0, 0]}
            maxBarSize={14}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
