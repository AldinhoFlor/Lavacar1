"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Trophy,
  BarChart3,
} from "lucide-react";
import { EmptyState } from "../empty-state";
import { formatBRL, formatMesAno } from "@/lib/lavacar/format";
import type { RelatorioMensal } from "@/lib/lavacar/types";

const CAT_COLORS = [
  "var(--color-brand)",
  "var(--color-brand-2)",
  "var(--color-brand-3)",
  "var(--color-info)",
  "var(--color-warning)",
  "var(--color-danger)",
];

function BRLTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-xl">
      {label && <p className="mb-0.5 font-medium text-fg">{label}</p>}
      <p className="font-semibold text-fg">{formatBRL(payload[0]?.value)}</p>
    </div>
  );
}

export function RelatoriosView({ relatorio }: { relatorio: RelatorioMensal }) {
  const { ano, mes, totais } = relatorio;

  const prev = mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 };
  const next = mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 };

  const semDados = totais.entradas === 0 && totais.saidas === 0;

  const despesasData = relatorio.despesasPorCategoria.map((d) => ({
    name: d.categoriaNome,
    total: d.total,
  }));
  const formasData = relatorio.entradasPorFormaPagamento.map((f) => ({
    name: f.label,
    total: f.total,
  }));

  return (
    <div className="space-y-5">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <NavBtn href={`/relatorios?ano=${prev.ano}&mes=${prev.mes}`} dir="prev" />
        <p className="text-base font-semibold capitalize">
          {formatMesAno(ano, mes)}
        </p>
        <NavBtn href={`/relatorios?ano=${next.ano}&mes=${next.mes}`} dir="next" />
      </div>

      {/* Cards totais */}
      <div className="grid grid-cols-3 gap-3">
        <TotalCard label="Entrou" value={totais.entradas} color="success" icon={ArrowUpRight} />
        <TotalCard label="Saiu" value={totais.saidas} color="danger" icon={ArrowDownLeft} />
        <TotalCard
          label="Lucro"
          value={totais.saldo}
          color={totais.saldo >= 0 ? "success" : "danger"}
          icon={Wallet}
        />
      </div>

      {semDados ? (
        <EmptyState
          icon={BarChart3}
          title="Sem dados neste mês"
          description="Escolha outro mês ou registre movimentações."
        />
      ) : (
        <>
          {/* Saldo acumulado */}
          <Card title="Saldo acumulado no mês">
            <div className="h-52 w-full" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={relatorio.saldoDiario}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="lc-saldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--color-border-soft)" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                    tick={{ fill: "var(--color-muted)", fontSize: 10 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    tick={{ fill: "var(--color-muted)", fontSize: 10 }}
                    tickFormatter={(v: number) =>
                      Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                    }
                  />
                  <Tooltip content={<BRLTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="saldoAcumulado"
                    stroke="var(--color-brand)"
                    strokeWidth={2}
                    fill="url(#lc-saldo)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Despesas por categoria */}
          <Card title="Despesas por categoria">
            {despesasData.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">Nenhuma despesa.</p>
            ) : (
              <div
                className="w-full"
                style={{ height: Math.max(120, despesasData.length * 42) }}
                aria-hidden
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={despesasData}
                    layout="vertical"
                    margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                    />
                    <Tooltip cursor={{ fill: "var(--color-surface-2)", opacity: 0.4 }} content={<BRLTooltip />} />
                    <Bar dataKey="total" radius={[0, 6, 6, 0]} maxBarSize={22}>
                      {despesasData.map((_, i) => (
                        <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Entradas por forma de pagamento */}
          <Card title="Entradas por forma de pagamento">
            {formasData.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">Nenhuma entrada.</p>
            ) : (
              <div className="h-48 w-full" aria-hidden>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formasData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--color-border-soft)" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      tick={{ fill: "var(--color-muted)", fontSize: 10 }}
                      tickFormatter={(v: number) =>
                        Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                      }
                    />
                    <Tooltip cursor={{ fill: "var(--color-surface-2)", opacity: 0.4 }} content={<BRLTooltip />} />
                    <Bar dataKey="total" fill="var(--color-success)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Top serviços */}
          <Card title="Top serviços do mês">
            {relatorio.topServicosPorValor.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">
                Nenhuma lavagem registrada.
              </p>
            ) : (
              <div className="space-y-1">
                {relatorio.topServicosPorValor.slice(0, 6).map((s, i) => (
                  <div
                    key={s.servicoNome}
                    className="flex items-center gap-3 rounded-xl px-2 py-2"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                      style={{
                        background:
                          i === 0
                            ? "color-mix(in srgb, var(--color-warning) 18%, transparent)"
                            : "var(--color-surface-2)",
                        color: i === 0 ? "var(--color-warning)" : "var(--color-muted)",
                      }}
                    >
                      {i === 0 ? <Trophy className="h-4 w-4" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">
                        {s.servicoNome}
                      </p>
                      <p className="text-xs text-muted">
                        {s.quantidade} {s.quantidade === 1 ? "lavagem" : "lavagens"}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-success">
                      {formatBRL(s.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function NavBtn({ href, dir }: { href: string; dir: "prev" | "next" }) {
  return (
    <Link
      href={href}
      aria-label={dir === "prev" ? "Mês anterior" : "Próximo mês"}
      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-2 text-muted transition hover:text-fg active:scale-95"
    >
      {dir === "prev" ? (
        <ChevronLeft className="h-5 w-5" />
      ) : (
        <ChevronRight className="h-5 w-5" />
      )}
    </Link>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </motion.div>
  );
}

function TotalCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: typeof Wallet;
}) {
  return (
    <div className="card p-3.5">
      <span
        className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg"
        style={{
          background: `color-mix(in srgb, var(--color-${color}) 16%, transparent)`,
          color: `var(--color-${color})`,
        }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p
        className="text-sm font-bold tabular-nums sm:text-base"
        style={{ color: `var(--color-${color})` }}
      >
        {formatBRL(value)}
      </p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
