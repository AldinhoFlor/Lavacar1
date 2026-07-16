"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Droplets,
  Plus,
  Minus,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Counter } from "@/components/lavacar/counter";
import { MovimentacaoRow } from "../movimentacao-row";
import { SerieChart } from "./serie-chart";
import { EmptyState } from "../empty-state";
import { useLavacarActions } from "../actions-context";
import { formatBRL } from "@/lib/lavacar/format";
import type { MetricasDashboard } from "@/lib/lavacar/types";

function fmt(n: number) {
  return formatBRL(n);
}

export function DashboardView({ data }: { data: MetricasDashboard }) {
  const { abrirNovaLavagem, abrirNovaDespesa } = useLavacarActions();

  const cards = [
    {
      label: "Sobrou hoje",
      value: <Counter value={data.hoje.saldo} format={fmt} />,
      icon: Wallet,
      color: "brand",
    },
    {
      label: "Entrou hoje",
      value: <Counter value={data.hoje.entradas} format={fmt} />,
      icon: ArrowUpRight,
      color: "success",
    },
    {
      label: "Saiu hoje",
      value: <Counter value={data.hoje.saidas} format={fmt} />,
      icon: ArrowDownLeft,
      color: "danger",
    },
    {
      label: "Lavagens hoje",
      value: <Counter value={data.hoje.lavagens} />,
      icon: Droplets,
      color: "info",
    },
  ];

  const semMovimento =
    data.hoje.entradas === 0 &&
    data.hoje.saidas === 0 &&
    data.ultimasMovimentacoes.length === 0;

  return (
    <div className="space-y-6">
      {/* Cards de hoje */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card relative overflow-hidden p-4"
            >
              <span
                className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  background: `color-mix(in srgb, var(--color-${c.color}) 16%, transparent)`,
                  color: `var(--color-${c.color})`,
                }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-xl font-bold tabular-nums tracking-tight">
                {c.value}
              </p>
              <p className="text-xs text-muted">{c.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Botões de ação gigantes */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={abrirNovaLavagem}
          className="btn-brand flex min-h-[60px] items-center justify-center gap-2 rounded-2xl text-base font-bold transition active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" />
          Nova lavagem
        </button>
        <button
          type="button"
          onClick={abrirNovaDespesa}
          className="flex min-h-[60px] items-center justify-center gap-2 rounded-2xl border border-danger/40 bg-danger/10 text-base font-bold text-danger transition active:scale-[0.98]"
        >
          <Minus className="h-5 w-5" />
          Nova despesa
        </button>
      </div>

      {/* Resumo do mês */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card p-5"
      >
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold">Resumo do mês</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <ResumoItem label="Entrou" value={data.mes.entradas} color="success" />
          <ResumoItem label="Saiu" value={data.mes.saidas} color="danger" />
          <ResumoItem
            label="Sobrou"
            value={data.mes.saldo}
            color={data.mes.saldo >= 0 ? "success" : "danger"}
          />
        </div>
      </motion.div>

      {/* Gráfico 14 dias */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-5"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Últimos 14 dias</h3>
          <div className="flex items-center gap-3 text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-success" /> Entrou
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-danger" /> Saiu
            </span>
          </div>
        </div>
        <SerieChart data={data.serie14dias} />
      </motion.div>

      {/* Últimas movimentações */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="card p-5"
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Últimas movimentações</h3>
          <Link
            href="/caixa"
            className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
          >
            Ver caixa <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {data.ultimasMovimentacoes.length === 0 ? (
          semMovimento ? (
            <EmptyState
              icon={Droplets}
              title="Registre sua primeira lavagem 🚗"
              description="Comece a controlar o caixa com um toque no botão acima."
            >
              <button
                type="button"
                onClick={abrirNovaLavagem}
                className="btn-brand mt-1 flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" /> Nova lavagem
              </button>
            </EmptyState>
          ) : (
            <p className="py-6 text-center text-sm text-muted">
              Nenhuma movimentação ainda.
            </p>
          )
        ) : (
          <div className="space-y-0.5">
            {data.ultimasMovimentacoes.map((m) => (
              <MovimentacaoRow key={m.id} mov={m} />
            ))}
          </div>
        )}
      </motion.div>

      {/* Atalho lavagens */}
      <Link
        href="/lavagens"
        className="card flex items-center gap-3 p-4 transition hover:border-brand/50"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/15 text-info">
          <Droplets className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Lavagens e fiados</p>
          <p className="text-xs text-muted">Histórico e valores a receber</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted" />
      </Link>
    </div>
  );
}

function ResumoItem({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-2/40 p-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p
        className="mt-0.5 text-base font-bold tabular-nums"
        style={{ color: `var(--color-${color})` }}
      >
        {formatBRL(value)}
      </p>
    </div>
  );
}
