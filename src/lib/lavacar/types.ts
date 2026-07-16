// =============================================================================
// LavaCar — tipos das entidades (espelham supabase/lavacar-schema.sql)
// =============================================================================

export type Papel = "dono" | "funcionario";
export type TipoMovimentacao = "entrada" | "saida";
export type StatusLavagem = "pago" | "pendente";
export type FormaPagamento =
  | "dinheiro"
  | "pix"
  | "cartao_debito"
  | "cartao_credito"
  | "outro";

// -----------------------------------------------------------------------------
// Entidades
// -----------------------------------------------------------------------------

export interface Empresa {
  id: string;
  nome: string;
  criado_por: string | null;
  created_at: string;
}

export interface Membro {
  id: string;
  empresa_id: string;
  user_id: string;
  papel: Papel;
  created_at: string;
}

export interface Servico {
  id: string;
  empresa_id: string;
  nome: string;
  preco: number;
  ativo: boolean;
  ordem: number;
  created_at: string;
}

export interface Categoria {
  id: string;
  empresa_id: string;
  nome: string;
  tipo: TipoMovimentacao;
  ordem: number;
  created_at: string;
}

export interface Lavagem {
  id: string;
  empresa_id: string;
  servico_id: string | null;
  servico_nome: string;
  valor: number;
  forma_pagamento: FormaPagamento;
  cliente: string | null;
  placa: string | null;
  observacao: string | null;
  status: StatusLavagem;
  data: string; // yyyy-MM-dd
  criado_por: string | null;
  created_at: string;
}

export interface Movimentacao {
  id: string;
  empresa_id: string;
  tipo: TipoMovimentacao;
  categoria_id: string | null;
  categoria_nome: string | null;
  descricao: string;
  valor: number;
  forma_pagamento: FormaPagamento;
  data: string; // yyyy-MM-dd
  lavagem_id: string | null;
  criado_por: string | null;
  created_at: string;
}

// Empresa + papel do usuário logado (retorno de getEmpresaDoUsuario)
export interface EmpresaComPapel {
  empresa: Empresa;
  papel: Papel;
}

// -----------------------------------------------------------------------------
// Formas de pagamento — labels + ícones (nomes de ícones lucide-react)
// -----------------------------------------------------------------------------

export interface FormaPagamentoMeta {
  value: FormaPagamento;
  label: string;
  /** Nome do ícone em lucide-react (ex.: import { Banknote } from "lucide-react") */
  icon: string;
}

export const FORMAS_PAGAMENTO: Record<FormaPagamento, FormaPagamentoMeta> = {
  dinheiro: { value: "dinheiro", label: "Dinheiro", icon: "Banknote" },
  pix: { value: "pix", label: "Pix", icon: "QrCode" },
  cartao_debito: { value: "cartao_debito", label: "Débito", icon: "CreditCard" },
  cartao_credito: { value: "cartao_credito", label: "Crédito", icon: "CreditCard" },
  outro: { value: "outro", label: "Outro", icon: "Wallet" },
};

export const FORMAS_PAGAMENTO_LIST: FormaPagamentoMeta[] =
  Object.values(FORMAS_PAGAMENTO);

export function formaPagamentoLabel(forma: FormaPagamento | null | undefined): string {
  if (!forma) return "—";
  return FORMAS_PAGAMENTO[forma]?.label ?? "Outro";
}

// -----------------------------------------------------------------------------
// Métricas do dashboard
// -----------------------------------------------------------------------------

export interface ResumoPeriodo {
  entradas: number;
  saidas: number;
  saldo: number;
}

/** Um ponto da série diária entrada vs saída (últimos 14 dias). */
export interface PontoSerieDiaria {
  data: string; // yyyy-MM-dd
  /** Rótulo curto pt-BR para o eixo, ex.: "16/07" */
  label: string;
  entradas: number;
  saidas: number;
}

export interface MetricasDashboard {
  hoje: ResumoPeriodo & { lavagens: number };
  mes: ResumoPeriodo;
  serie14dias: PontoSerieDiaria[];
  ultimasMovimentacoes: Movimentacao[];
}

// -----------------------------------------------------------------------------
// Relatório mensal
// -----------------------------------------------------------------------------

export interface PontoSaldoDiario {
  data: string; // yyyy-MM-dd
  label: string; // "16"
  entradas: number;
  saidas: number;
  saldoDia: number;
  saldoAcumulado: number;
}

export interface AgrupamentoCategoria {
  categoriaNome: string;
  total: number;
  quantidade: number;
}

export interface AgrupamentoFormaPagamento {
  forma: FormaPagamento;
  label: string;
  total: number;
  quantidade: number;
}

export interface TopServico {
  servicoNome: string;
  quantidade: number;
  total: number;
}

export interface RelatorioMensal {
  ano: number;
  mes: number; // 1-12
  totais: ResumoPeriodo;
  saldoDiario: PontoSaldoDiario[];
  despesasPorCategoria: AgrupamentoCategoria[];
  entradasPorFormaPagamento: AgrupamentoFormaPagamento[];
  topServicosPorQuantidade: TopServico[];
  topServicosPorValor: TopServico[];
  totalLavagens: number;
}
