"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { modoSemLogin } from "@/lib/modo";
import { round2, toISODate } from "@/lib/lavacar/format";
import type {
  FormaPagamento,
  StatusLavagem,
  TipoMovimentacao,
} from "@/lib/lavacar/types";

// =============================================================================
// Tipos de retorno
// =============================================================================

type ActionErro = { error: string };
type ActionOk<T = unknown> = { ok: true } & T;
type ActionResult<T = unknown> = ActionErro | ActionOk<T>;

// =============================================================================
// Autorização — SEMPRE validar que o user é membro da empresa antes de mutar.
// Não confiar apenas em RLS.
// =============================================================================

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Client de mutação: no modo sem login usa o admin (service role, bypassa RLS);
// caso contrário, o client server autenticado (protegido por RLS).
async function getDb(): Promise<SupabaseClient> {
  if (modoSemLogin()) return createAdminClient() as unknown as SupabaseClient;
  return createClient();
}

/** id da empresa única (a primeira criada) — base da autorização no modo sem login. */
async function empresaUnicaId(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase
    .from("lc_empresas")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

/**
 * Verifica se o usuário logado é membro da empresa. Helper de autorização
 * usado por toda mutação. Exportado por ser um Server Action ("use server").
 *
 * No modo sem login não há membros: autoriza quando a empresa é a única (a
 * primeira criada).
 */
export async function isMembroDaEmpresa(empresaId: string): Promise<boolean> {
  if (modoSemLogin()) {
    const supabase = await getDb();
    return (await empresaUnicaId(supabase)) === empresaId;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("lc_membros")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("user_id", user.id)
    .maybeSingle();

  return !!data;
}

/**
 * Garante autorização para mutar a empresa. Retorna o userId (null no modo sem
 * login) + o client a usar, ou um erro.
 *
 * No modo sem login pula auth.getUser() e a checagem de membro: usa o client
 * admin e exige apenas que a empresa seja a única (a primeira criada).
 */
async function autorizar(
  empresaId: string
): Promise<{ userId: string | null; supabase: SupabaseClient } | ActionErro> {
  if (modoSemLogin()) {
    const supabase = await getDb();
    const unica = await empresaUnicaId(supabase);
    if (!unica) return { error: "Nenhum lava-rápido cadastrado" };
    if (empresaId !== unica) return { error: "Sem permissão nesta empresa" };
    return { userId: null, supabase };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: membro } = await supabase
    .from("lc_membros")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membro) return { error: "Sem permissão nesta empresa" };
  return { userId: user.id, supabase };
}

function isErro(v: unknown): v is ActionErro {
  return typeof v === "object" && v !== null && "error" in v;
}

function revalidarLavacar() {
  revalidatePath("/");
  revalidatePath("/caixa");
  revalidatePath("/lavagens");
  revalidatePath("/relatorios");
  revalidatePath("/ajustes");
}

// =============================================================================
// Empresa / onboarding
// =============================================================================

const SEED_SERVICOS: { nome: string; preco: number }[] = [
  { nome: "Lavagem Simples", preco: 30 },
  { nome: "Lavagem Completa", preco: 50 },
  { nome: "Lavagem + Cera", preco: 70 },
  { nome: "Higienização Interna", preco: 120 },
  { nome: "Polimento", preco: 200 },
];

const SEED_CATEGORIAS: { nome: string; tipo: TipoMovimentacao }[] = [
  { nome: "Lavagens", tipo: "entrada" },
  { nome: "Outras receitas", tipo: "entrada" },
  { nome: "Produtos de limpeza", tipo: "saida" },
  { nome: "Água e Luz", tipo: "saida" },
  { nome: "Aluguel", tipo: "saida" },
  { nome: "Salários/Diárias", tipo: "saida" },
  { nome: "Manutenção", tipo: "saida" },
  { nome: "Outras despesas", tipo: "saida" },
];

/** Popula serviços e categorias padrão da empresa recém-criada. */
async function seedEmpresa(
  supabase: SupabaseClient,
  empresaId: string
): Promise<ActionErro | null> {
  const { error: errServ } = await supabase.from("lc_servicos").insert(
    SEED_SERVICOS.map((s, i) => ({
      empresa_id: empresaId,
      nome: s.nome,
      preco: round2(s.preco),
      ativo: true,
      ordem: i,
    }))
  );
  if (errServ) return { error: errServ.message };

  const { error: errCat } = await supabase.from("lc_categorias").insert(
    SEED_CATEGORIAS.map((c, i) => ({
      empresa_id: empresaId,
      nome: c.nome,
      tipo: c.tipo,
      ordem: i,
    }))
  );
  if (errCat) return { error: errCat.message };

  return null;
}

export async function criarEmpresa(
  nome: string
): Promise<ActionResult<{ empresaId: string }>> {
  const nomeLimpo = nome.trim();
  if (!nomeLimpo) return { error: "Informe o nome do lava-rápido" };

  // Modo sem login: single-empresa. Cria a empresa SEM membro (criado_por null)
  // e sem inserir em lc_membros; se já existe uma, bloqueia.
  if (modoSemLogin()) {
    const supabase = await getDb();
    const jaExiste = await empresaUnicaId(supabase);
    if (jaExiste) return { error: "Você já tem um lava-rápido cadastrado" };

    const { data: empresa, error: errEmpresa } = await supabase
      .from("lc_empresas")
      .insert({ nome: nomeLimpo, criado_por: null })
      .select("id")
      .single();
    if (errEmpresa || !empresa) {
      return { error: errEmpresa?.message ?? "Falha ao criar empresa" };
    }
    const empresaId = empresa.id as string;

    const errSeed = await seedEmpresa(supabase, empresaId);
    if (errSeed) return errSeed;

    revalidarLavacar();
    return { ok: true, empresaId };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  // Falha limpa se o user já tem empresa.
  const { data: jaMembro } = await supabase
    .from("lc_membros")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (jaMembro) return { error: "Você já tem um lava-rápido cadastrado" };

  // 1) Empresa
  const { data: empresa, error: errEmpresa } = await supabase
    .from("lc_empresas")
    .insert({ nome: nomeLimpo, criado_por: user.id })
    .select("id")
    .single();
  if (errEmpresa || !empresa) {
    return { error: errEmpresa?.message ?? "Falha ao criar empresa" };
  }
  const empresaId = empresa.id as string;

  // 2) Membro dono (bootstrap)
  const { error: errMembro } = await supabase.from("lc_membros").insert({
    empresa_id: empresaId,
    user_id: user.id,
    papel: "dono",
  });
  if (errMembro) return { error: errMembro.message };

  // 3) Seed de serviços e categorias
  const errSeed = await seedEmpresa(supabase, empresaId);
  if (errSeed) return errSeed;

  revalidarLavacar();
  return { ok: true, empresaId };
}

export async function atualizarEmpresa(
  empresaId: string,
  nome: string
): Promise<ActionResult> {
  const auth = await autorizar(empresaId);
  if (isErro(auth)) return auth;

  const nomeLimpo = nome.trim();
  if (!nomeLimpo) return { error: "Informe o nome do lava-rápido" };

  const { error } = await auth.supabase
    .from("lc_empresas")
    .update({ nome: nomeLimpo })
    .eq("id", empresaId);
  if (error) return { error: error.message };

  revalidarLavacar();
  return { ok: true };
}

// =============================================================================
// Lavagens
// =============================================================================

export interface RegistrarLavagemInput {
  empresaId: string;
  servicoId?: string | null;
  servicoNome: string;
  valor: number;
  formaPagamento: FormaPagamento;
  cliente?: string | null;
  placa?: string | null;
  observacao?: string | null;
  status?: StatusLavagem; // default 'pago'
  data?: string; // yyyy-MM-dd, default hoje
}

/** Busca a categoria "Lavagens" (entrada) da empresa para snapshot. */
async function categoriaLavagens(
  supabase: SupabaseClient,
  empresaId: string
): Promise<{ id: string | null; nome: string }> {
  const { data } = await supabase
    .from("lc_categorias")
    .select("id, nome")
    .eq("empresa_id", empresaId)
    .eq("tipo", "entrada")
    .eq("nome", "Lavagens")
    .limit(1)
    .maybeSingle();
  return { id: (data?.id as string) ?? null, nome: data?.nome ?? "Lavagens" };
}

export async function registrarLavagem(
  input: RegistrarLavagemInput
): Promise<ActionResult<{ lavagemId: string }>> {
  const auth = await autorizar(input.empresaId);
  if (isErro(auth)) return auth;
  const { supabase, userId } = auth;

  const nome = input.servicoNome.trim();
  if (!nome) return { error: "Escolha um serviço" };

  const valor = round2(input.valor);
  if (!Number.isFinite(valor) || valor < 0) return { error: "Valor inválido" };

  const status: StatusLavagem = input.status ?? "pago";
  const data = input.data ?? toISODate(new Date());

  const { data: lavagem, error: errLav } = await supabase
    .from("lc_lavagens")
    .insert({
      empresa_id: input.empresaId,
      servico_id: input.servicoId ?? null,
      servico_nome: nome,
      valor,
      forma_pagamento: input.formaPagamento,
      cliente: input.cliente?.trim() || null,
      placa: input.placa?.trim() || null,
      observacao: input.observacao?.trim() || null,
      status,
      data,
      criado_por: userId,
    })
    .select("id")
    .single();
  if (errLav || !lavagem) {
    return { error: errLav?.message ?? "Falha ao registrar lavagem" };
  }
  const lavagemId = lavagem.id as string;

  // REGRA CENTRAL: lavagem paga gera a entrada vinculada; pendente (fiado) não.
  if (status === "pago") {
    const cat = await categoriaLavagens(supabase, input.empresaId);
    const { error: errMov } = await supabase.from("lc_movimentacoes").insert({
      empresa_id: input.empresaId,
      tipo: "entrada",
      categoria_id: cat.id,
      categoria_nome: cat.nome,
      descricao: `Lavagem — ${nome}`,
      valor,
      forma_pagamento: input.formaPagamento,
      data,
      lavagem_id: lavagemId,
      criado_por: userId,
    });
    if (errMov) return { error: errMov.message };
  }

  revalidarLavacar();
  return { ok: true, lavagemId };
}

export async function marcarLavagemPaga(
  lavagemId: string
): Promise<ActionResult> {
  const supabase = await getDb();
  const { data: lavagem } = await supabase
    .from("lc_lavagens")
    .select("*")
    .eq("id", lavagemId)
    .maybeSingle();
  if (!lavagem) return { error: "Lavagem não encontrada" };

  const auth = await autorizar(lavagem.empresa_id as string);
  if (isErro(auth)) return auth;
  const { userId } = auth;

  const { error: errUpd } = await supabase
    .from("lc_lavagens")
    .update({ status: "pago" })
    .eq("id", lavagemId);
  if (errUpd) return { error: errUpd.message };

  // Cria a entrada vinculada apenas se ainda não existir (lavagem_id é UNIQUE).
  const { data: existente } = await supabase
    .from("lc_movimentacoes")
    .select("id")
    .eq("lavagem_id", lavagemId)
    .maybeSingle();

  if (!existente) {
    const cat = await categoriaLavagens(supabase, lavagem.empresa_id as string);
    const valor = round2(Number(lavagem.valor ?? 0));
    const { error: errMov } = await supabase.from("lc_movimentacoes").insert({
      empresa_id: lavagem.empresa_id,
      tipo: "entrada",
      categoria_id: cat.id,
      categoria_nome: cat.nome,
      descricao: `Lavagem — ${lavagem.servico_nome ?? ""}`.trim(),
      valor,
      forma_pagamento: lavagem.forma_pagamento,
      data: lavagem.data,
      lavagem_id: lavagemId,
      criado_por: userId,
    });
    if (errMov) return { error: errMov.message };
  }

  revalidarLavacar();
  return { ok: true };
}

export async function excluirLavagem(lavagemId: string): Promise<ActionResult> {
  const supabase = await getDb();
  const { data: lavagem } = await supabase
    .from("lc_lavagens")
    .select("empresa_id")
    .eq("id", lavagemId)
    .maybeSingle();
  if (!lavagem) return { error: "Lavagem não encontrada" };

  const auth = await autorizar(lavagem.empresa_id as string);
  if (isErro(auth)) return auth;

  // A movimentação vinculada some via ON DELETE CASCADE (fk lavagem_id).
  const { error } = await supabase
    .from("lc_lavagens")
    .delete()
    .eq("id", lavagemId);
  if (error) return { error: error.message };

  revalidarLavacar();
  return { ok: true };
}

// =============================================================================
// Movimentações (livro-caixa manual)
// =============================================================================

export interface MovimentacaoInput {
  empresaId: string;
  tipo: TipoMovimentacao;
  categoriaId?: string | null;
  descricao: string;
  valor: number;
  formaPagamento: FormaPagamento;
  data?: string; // yyyy-MM-dd
}

/** Resolve o nome (snapshot) da categoria a partir do id. */
async function snapshotCategoria(
  supabase: SupabaseClient,
  empresaId: string,
  categoriaId: string | null | undefined
): Promise<string | null> {
  if (!categoriaId) return null;
  const { data } = await supabase
    .from("lc_categorias")
    .select("nome")
    .eq("id", categoriaId)
    .eq("empresa_id", empresaId)
    .maybeSingle();
  return data?.nome ?? null;
}

export async function criarMovimentacao(
  input: MovimentacaoInput
): Promise<ActionResult<{ id: string }>> {
  const auth = await autorizar(input.empresaId);
  if (isErro(auth)) return auth;
  const { supabase, userId } = auth;

  const valor = round2(input.valor);
  if (!Number.isFinite(valor) || valor < 0) return { error: "Valor inválido" };

  const categoriaNome = await snapshotCategoria(
    supabase,
    input.empresaId,
    input.categoriaId
  );

  const { data, error } = await supabase
    .from("lc_movimentacoes")
    .insert({
      empresa_id: input.empresaId,
      tipo: input.tipo,
      categoria_id: input.categoriaId ?? null,
      categoria_nome: categoriaNome,
      descricao: input.descricao.trim(),
      valor,
      forma_pagamento: input.formaPagamento,
      data: input.data ?? toISODate(new Date()),
      criado_por: userId,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { error: error?.message ?? "Falha ao salvar movimentação" };
  }

  revalidarLavacar();
  return { ok: true, id: data.id as string };
}

export interface AtualizarMovimentacaoPatch {
  tipo?: TipoMovimentacao;
  categoriaId?: string | null;
  descricao?: string;
  valor?: number;
  formaPagamento?: FormaPagamento;
  data?: string;
}

export async function atualizarMovimentacao(
  id: string,
  patch: AtualizarMovimentacaoPatch
): Promise<ActionResult> {
  const supabase = await getDb();
  const { data: mov } = await supabase
    .from("lc_movimentacoes")
    .select("empresa_id")
    .eq("id", id)
    .maybeSingle();
  if (!mov) return { error: "Movimentação não encontrada" };

  const empresaId = mov.empresa_id as string;
  const auth = await autorizar(empresaId);
  if (isErro(auth)) return auth;

  const update: Record<string, unknown> = {};
  if (patch.tipo !== undefined) update.tipo = patch.tipo;
  if (patch.descricao !== undefined) update.descricao = patch.descricao.trim();
  if (patch.formaPagamento !== undefined)
    update.forma_pagamento = patch.formaPagamento;
  if (patch.data !== undefined) update.data = patch.data;
  if (patch.valor !== undefined) {
    const valor = round2(patch.valor);
    if (!Number.isFinite(valor) || valor < 0)
      return { error: "Valor inválido" };
    update.valor = valor;
  }
  if (patch.categoriaId !== undefined) {
    update.categoria_id = patch.categoriaId;
    update.categoria_nome = await snapshotCategoria(
      supabase,
      empresaId,
      patch.categoriaId
    );
  }

  const { error } = await supabase
    .from("lc_movimentacoes")
    .update(update)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidarLavacar();
  return { ok: true };
}

export async function excluirMovimentacao(id: string): Promise<ActionResult> {
  const supabase = await getDb();
  const { data: mov } = await supabase
    .from("lc_movimentacoes")
    .select("empresa_id")
    .eq("id", id)
    .maybeSingle();
  if (!mov) return { error: "Movimentação não encontrada" };

  const auth = await autorizar(mov.empresa_id as string);
  if (isErro(auth)) return auth;

  const { error } = await supabase
    .from("lc_movimentacoes")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };

  revalidarLavacar();
  return { ok: true };
}

// =============================================================================
// Serviços
// =============================================================================

export interface ServicoInput {
  id?: string; // presente => update
  empresaId: string;
  nome: string;
  preco: number;
  ativo?: boolean;
  ordem?: number;
}

export async function salvarServico(
  input: ServicoInput
): Promise<ActionResult<{ id: string }>> {
  const auth = await autorizar(input.empresaId);
  if (isErro(auth)) return auth;
  const { supabase } = auth;

  const nome = input.nome.trim();
  if (!nome) return { error: "Informe o nome do serviço" };
  const preco = round2(input.preco);
  if (!Number.isFinite(preco) || preco < 0) return { error: "Preço inválido" };

  if (input.id) {
    const { error } = await supabase
      .from("lc_servicos")
      .update({
        nome,
        preco,
        ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
        ...(input.ordem !== undefined ? { ordem: input.ordem } : {}),
      })
      .eq("id", input.id)
      .eq("empresa_id", input.empresaId);
    if (error) return { error: error.message };
    revalidarLavacar();
    return { ok: true, id: input.id };
  }

  const { data, error } = await supabase
    .from("lc_servicos")
    .insert({
      empresa_id: input.empresaId,
      nome,
      preco,
      ativo: input.ativo ?? true,
      ordem: input.ordem ?? 0,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { error: error?.message ?? "Falha ao salvar serviço" };
  }
  revalidarLavacar();
  return { ok: true, id: data.id as string };
}

export async function excluirServico(
  empresaId: string,
  servicoId: string
): Promise<ActionResult<{ soft: boolean }>> {
  const auth = await autorizar(empresaId);
  if (isErro(auth)) return auth;
  const { supabase } = auth;

  // Referenciado por alguma lavagem? Então soft delete (ativo=false).
  const { count } = await supabase
    .from("lc_lavagens")
    .select("id", { count: "exact", head: true })
    .eq("servico_id", servicoId);

  if ((count ?? 0) > 0) {
    const { error } = await supabase
      .from("lc_servicos")
      .update({ ativo: false })
      .eq("id", servicoId)
      .eq("empresa_id", empresaId);
    if (error) return { error: error.message };
    revalidarLavacar();
    return { ok: true, soft: true };
  }

  const { error } = await supabase
    .from("lc_servicos")
    .delete()
    .eq("id", servicoId)
    .eq("empresa_id", empresaId);
  if (error) return { error: error.message };
  revalidarLavacar();
  return { ok: true, soft: false };
}

// =============================================================================
// Categorias
// =============================================================================

export interface CategoriaInput {
  id?: string; // presente => update
  empresaId: string;
  nome: string;
  tipo: TipoMovimentacao;
  ordem?: number;
}

export async function salvarCategoria(
  input: CategoriaInput
): Promise<ActionResult<{ id: string }>> {
  const auth = await autorizar(input.empresaId);
  if (isErro(auth)) return auth;
  const { supabase } = auth;

  const nome = input.nome.trim();
  if (!nome) return { error: "Informe o nome da categoria" };

  if (input.id) {
    const { error } = await supabase
      .from("lc_categorias")
      .update({
        nome,
        tipo: input.tipo,
        ...(input.ordem !== undefined ? { ordem: input.ordem } : {}),
      })
      .eq("id", input.id)
      .eq("empresa_id", input.empresaId);
    if (error) return { error: error.message };
    revalidarLavacar();
    return { ok: true, id: input.id };
  }

  const { data, error } = await supabase
    .from("lc_categorias")
    .insert({
      empresa_id: input.empresaId,
      nome,
      tipo: input.tipo,
      ordem: input.ordem ?? 0,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { error: error?.message ?? "Falha ao salvar categoria" };
  }
  revalidarLavacar();
  return { ok: true, id: data.id as string };
}

export async function excluirCategoria(
  empresaId: string,
  categoriaId: string
): Promise<ActionResult> {
  const auth = await autorizar(empresaId);
  if (isErro(auth)) return auth;
  const { supabase } = auth;

  // Em uso? Anula categoria_id nas movimentações mantendo o snapshot
  // categoria_nome, depois remove a categoria.
  const { error: errNull } = await supabase
    .from("lc_movimentacoes")
    .update({ categoria_id: null })
    .eq("categoria_id", categoriaId)
    .eq("empresa_id", empresaId);
  if (errNull) return { error: errNull.message };

  const { error } = await supabase
    .from("lc_categorias")
    .delete()
    .eq("id", categoriaId)
    .eq("empresa_id", empresaId);
  if (error) return { error: error.message };

  revalidarLavacar();
  return { ok: true };
}
