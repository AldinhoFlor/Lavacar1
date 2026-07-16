// =============================================================================
// LavaCar — fetchers server-side (RSC). Todos usam o client do Supabase server.
// Agregações feitas em TypeScript sobre os rows do período (volumes pequenos).
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { modoSemLogin } from "@/lib/modo";
import {
  intervaloMes,
  intervaloMesAno,
  toISODate,
  formatDiaMes,
  round2,
} from "@/lib/lavacar/format";
import { FORMAS_PAGAMENTO } from "@/lib/lavacar/types";
import type {
  Empresa,
  EmpresaComPapel,
  Servico,
  Categoria,
  Lavagem,
  Movimentacao,
  Papel,
  FormaPagamento,
  TipoMovimentacao,
  MetricasDashboard,
  PontoSerieDiaria,
  PontoSaldoDiario,
  RelatorioMensal,
  AgrupamentoCategoria,
  AgrupamentoFormaPagamento,
  TopServico,
} from "@/lib/lavacar/types";

// Numeric do Postgres pode chegar como number ou string — normaliza.
function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function normalizarMovimentacao(row: Movimentacao): Movimentacao {
  return { ...row, valor: num(row.valor) };
}

function normalizarLavagem(row: Lavagem): Lavagem {
  return { ...row, valor: num(row.valor) };
}

// Client de leitura: no modo sem login usa o admin (service role, bypassa RLS);
// caso contrário, o client server autenticado (protegido por RLS).
type Db = Awaited<ReturnType<typeof createClient>>;

async function getDb(): Promise<Db> {
  if (modoSemLogin()) return createAdminClient() as unknown as Db;
  return createClient();
}

// -----------------------------------------------------------------------------
// Empresa / usuário
// -----------------------------------------------------------------------------

/**
 * Empresa (e papel) do usuário logado. `null` se não autenticado ou sem empresa
 * — quem chama redireciona para /login ou /onboarding.
 *
 * No modo sem login vira "empresa única": retorna a primeira empresa criada
 * (order by created_at asc limit 1) com papel 'dono', ou null se não existir
 * nenhuma (→ onboarding).
 */
export async function getEmpresaDoUsuario(): Promise<EmpresaComPapel | null> {
  if (modoSemLogin()) {
    const supabase = await getDb();
    const { data: empresa } = await supabase
      .from("lc_empresas")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!empresa) return null;
    return { empresa: empresa as Empresa, papel: "dono" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membro } = await supabase
    .from("lc_membros")
    .select("papel, empresa:lc_empresas(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membro || !membro.empresa) return null;

  // O join tipa `empresa` como array/objeto conforme a versão; normalizamos.
  const empresaRaw = Array.isArray(membro.empresa)
    ? membro.empresa[0]
    : membro.empresa;
  if (!empresaRaw) return null;

  return {
    empresa: empresaRaw as Empresa,
    papel: membro.papel as Papel,
  };
}

// -----------------------------------------------------------------------------
// Catálogos
// -----------------------------------------------------------------------------

export async function getServicos(empresaId: string): Promise<Servico[]> {
  const supabase = await getDb();
  const { data } = await supabase
    .from("lc_servicos")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("ordem", { ascending: true })
    .order("nome", { ascending: true });
  return (data ?? []).map((s) => ({ ...(s as Servico), preco: num(s.preco) }));
}

export async function getCategorias(empresaId: string): Promise<Categoria[]> {
  const supabase = await getDb();
  const { data } = await supabase
    .from("lc_categorias")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("tipo", { ascending: true })
    .order("ordem", { ascending: true })
    .order("nome", { ascending: true });
  return (data ?? []) as Categoria[];
}

// -----------------------------------------------------------------------------
// Movimentações / lavagens
// -----------------------------------------------------------------------------

export interface FiltroMovimentacoes {
  de: string; // yyyy-MM-dd
  ate: string; // yyyy-MM-dd
  tipo?: TipoMovimentacao;
}

export async function getMovimentacoes(
  empresaId: string,
  filtro: FiltroMovimentacoes
): Promise<Movimentacao[]> {
  const supabase = await getDb();
  let query = supabase
    .from("lc_movimentacoes")
    .select("*")
    .eq("empresa_id", empresaId)
    .gte("data", filtro.de)
    .lte("data", filtro.ate);

  if (filtro.tipo) query = query.eq("tipo", filtro.tipo);

  const { data } = await query
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []).map((m) => normalizarMovimentacao(m as Movimentacao));
}

export interface FiltroLavagens {
  de: string;
  ate: string;
}

export async function getLavagens(
  empresaId: string,
  filtro: FiltroLavagens
): Promise<Lavagem[]> {
  const supabase = await getDb();
  const { data } = await supabase
    .from("lc_lavagens")
    .select("*")
    .eq("empresa_id", empresaId)
    .gte("data", filtro.de)
    .lte("data", filtro.ate)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []).map((l) => normalizarLavagem(l as Lavagem));
}

/** Lavagens em aberto (fiado) — independente de período, para o botão "Receber". */
export async function getLavagensPendentes(
  empresaId: string
): Promise<Lavagem[]> {
  const supabase = await getDb();
  const { data } = await supabase
    .from("lc_lavagens")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("status", "pendente")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []).map((l) => normalizarLavagem(l as Lavagem));
}

// -----------------------------------------------------------------------------
// Dashboard
// -----------------------------------------------------------------------------

export async function getMetricasDashboard(
  empresaId: string,
  ref: Date = new Date()
): Promise<MetricasDashboard> {
  const supabase = await getDb();

  const hojeISO = toISODate(ref);
  const mes = intervaloMes(ref);

  // Janela que cobre tanto os últimos 14 dias quanto o mês corrente.
  const inicio14 = new Date(ref);
  inicio14.setDate(inicio14.getDate() - 13);
  const inicio14ISO = toISODate(inicio14);
  const rangeInicio = inicio14ISO < mes.de ? inicio14ISO : mes.de;

  const [movsRes, lavHojeRes, ultimasRes] = await Promise.all([
    supabase
      .from("lc_movimentacoes")
      .select("*")
      .eq("empresa_id", empresaId)
      .gte("data", rangeInicio)
      .lte("data", hojeISO),
    supabase
      .from("lc_lavagens")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("data", hojeISO),
    supabase
      .from("lc_movimentacoes")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const movs = (movsRes.data ?? []).map((m) =>
    normalizarMovimentacao(m as Movimentacao)
  );

  // Hoje
  const movsHoje = movs.filter((m) => m.data === hojeISO);
  const entradasHoje = round2(
    movsHoje.filter((m) => m.tipo === "entrada").reduce((s, m) => s + m.valor, 0)
  );
  const saidasHoje = round2(
    movsHoje.filter((m) => m.tipo === "saida").reduce((s, m) => s + m.valor, 0)
  );

  // Mês corrente
  const movsMes = movs.filter((m) => m.data >= mes.de && m.data <= mes.ate);
  const entradasMes = round2(
    movsMes.filter((m) => m.tipo === "entrada").reduce((s, m) => s + m.valor, 0)
  );
  const saidasMes = round2(
    movsMes.filter((m) => m.tipo === "saida").reduce((s, m) => s + m.valor, 0)
  );

  // Série dos últimos 14 dias (entradas vs saídas por dia)
  const serie14dias: PontoSerieDiaria[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(ref);
    d.setDate(d.getDate() - i);
    const iso = toISODate(d);
    const doDia = movs.filter((m) => m.data === iso);
    serie14dias.push({
      data: iso,
      label: formatDiaMes(iso),
      entradas: round2(
        doDia.filter((m) => m.tipo === "entrada").reduce((s, m) => s + m.valor, 0)
      ),
      saidas: round2(
        doDia.filter((m) => m.tipo === "saida").reduce((s, m) => s + m.valor, 0)
      ),
    });
  }

  const ultimasMovimentacoes = (ultimasRes.data ?? []).map((m) =>
    normalizarMovimentacao(m as Movimentacao)
  );

  return {
    hoje: {
      entradas: entradasHoje,
      saidas: saidasHoje,
      saldo: round2(entradasHoje - saidasHoje),
      lavagens: lavHojeRes.count ?? 0,
    },
    mes: {
      entradas: entradasMes,
      saidas: saidasMes,
      saldo: round2(entradasMes - saidasMes),
    },
    serie14dias,
    ultimasMovimentacoes,
  };
}

// -----------------------------------------------------------------------------
// Relatório mensal
// -----------------------------------------------------------------------------

export async function getRelatorioMensal(
  empresaId: string,
  ano: number,
  mes: number
): Promise<RelatorioMensal> {
  const supabase = await getDb();
  const range = intervaloMesAno(ano, mes);

  const [movsRes, lavRes] = await Promise.all([
    supabase
      .from("lc_movimentacoes")
      .select("*")
      .eq("empresa_id", empresaId)
      .gte("data", range.de)
      .lte("data", range.ate),
    supabase
      .from("lc_lavagens")
      .select("*")
      .eq("empresa_id", empresaId)
      .gte("data", range.de)
      .lte("data", range.ate),
  ]);

  const movs = (movsRes.data ?? []).map((m) =>
    normalizarMovimentacao(m as Movimentacao)
  );
  const lavagens = (lavRes.data ?? []).map((l) =>
    normalizarLavagem(l as Lavagem)
  );

  // Totais
  const entradas = round2(
    movs.filter((m) => m.tipo === "entrada").reduce((s, m) => s + m.valor, 0)
  );
  const saidas = round2(
    movs.filter((m) => m.tipo === "saida").reduce((s, m) => s + m.valor, 0)
  );

  // Saldo acumulado por dia do mês
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const saldoDiario: PontoSaldoDiario[] = [];
  let acumulado = 0;
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const iso = toISODate(new Date(ano, mes - 1, dia));
    const doDia = movs.filter((m) => m.data === iso);
    const eDia = round2(
      doDia.filter((m) => m.tipo === "entrada").reduce((s, m) => s + m.valor, 0)
    );
    const sDia = round2(
      doDia.filter((m) => m.tipo === "saida").reduce((s, m) => s + m.valor, 0)
    );
    const saldoDia = round2(eDia - sDia);
    acumulado = round2(acumulado + saldoDia);
    saldoDiario.push({
      data: iso,
      label: String(dia),
      entradas: eDia,
      saidas: sDia,
      saldoDia,
      saldoAcumulado: acumulado,
    });
  }

  // Despesas por categoria
  const catMap = new Map<string, AgrupamentoCategoria>();
  for (const m of movs) {
    if (m.tipo !== "saida") continue;
    const nome = m.categoria_nome ?? "Sem categoria";
    const atual = catMap.get(nome) ?? {
      categoriaNome: nome,
      total: 0,
      quantidade: 0,
    };
    atual.total = round2(atual.total + m.valor);
    atual.quantidade += 1;
    catMap.set(nome, atual);
  }
  const despesasPorCategoria = [...catMap.values()].sort(
    (a, b) => b.total - a.total
  );

  // Entradas por forma de pagamento
  const fpMap = new Map<FormaPagamento, AgrupamentoFormaPagamento>();
  for (const m of movs) {
    if (m.tipo !== "entrada") continue;
    const atual = fpMap.get(m.forma_pagamento) ?? {
      forma: m.forma_pagamento,
      label: FORMAS_PAGAMENTO[m.forma_pagamento]?.label ?? "Outro",
      total: 0,
      quantidade: 0,
    };
    atual.total = round2(atual.total + m.valor);
    atual.quantidade += 1;
    fpMap.set(m.forma_pagamento, atual);
  }
  const entradasPorFormaPagamento = [...fpMap.values()].sort(
    (a, b) => b.total - a.total
  );

  // Top serviços (por lavagens do mês)
  const servMap = new Map<string, TopServico>();
  for (const l of lavagens) {
    const nome = l.servico_nome || "Serviço";
    const atual = servMap.get(nome) ?? {
      servicoNome: nome,
      quantidade: 0,
      total: 0,
    };
    atual.quantidade += 1;
    atual.total = round2(atual.total + l.valor);
    servMap.set(nome, atual);
  }
  const servicos = [...servMap.values()];
  const topServicosPorQuantidade = [...servicos].sort(
    (a, b) => b.quantidade - a.quantidade
  );
  const topServicosPorValor = [...servicos].sort((a, b) => b.total - a.total);

  return {
    ano,
    mes,
    totais: { entradas, saidas, saldo: round2(entradas - saidas) },
    saldoDiario,
    despesasPorCategoria,
    entradasPorFormaPagamento,
    topServicosPorQuantidade,
    topServicosPorValor,
    totalLavagens: lavagens.length,
  };
}
