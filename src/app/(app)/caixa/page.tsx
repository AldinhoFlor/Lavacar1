import {
  getEmpresaDoUsuario,
  getMovimentacoes,
  getCategorias,
} from "@/lib/lavacar/queries";
import {
  resolverPeriodo,
  intervaloMes,
  round2,
  type Periodo,
} from "@/lib/lavacar/format";
import { FiltrosCaixa } from "@/components/lavacar/caixa/filtros";
import { CaixaView } from "@/components/lavacar/caixa/caixa-view";
import type { TipoMovimentacao } from "@/lib/lavacar/types";

export const dynamic = "force-dynamic";

const PERIODOS_VALIDOS: Periodo[] = ["hoje", "semana", "mes", "custom"];

export default async function CaixaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const vinculo = await getEmpresaDoUsuario();
  if (!vinculo) return null;

  const sp = await searchParams;
  const periodoParam = typeof sp.periodo === "string" ? sp.periodo : "mes";
  const periodo: Periodo = PERIODOS_VALIDOS.includes(periodoParam as Periodo)
    ? (periodoParam as Periodo)
    : "mes";

  const mesAtual = intervaloMes();
  const deParam = typeof sp.de === "string" ? sp.de : mesAtual.de;
  const ateParam = typeof sp.ate === "string" ? sp.ate : mesAtual.ate;

  const intervalo = resolverPeriodo(periodo, { de: deParam, ate: ateParam });

  const tipoParam = typeof sp.tipo === "string" ? sp.tipo : "todas";
  const tipo: TipoMovimentacao | undefined =
    tipoParam === "entrada" || tipoParam === "saida" ? tipoParam : undefined;

  const [movimentacoes, categorias] = await Promise.all([
    getMovimentacoes(vinculo.empresa.id, {
      de: intervalo.de,
      ate: intervalo.ate,
      tipo,
    }),
    getCategorias(vinculo.empresa.id),
  ]);

  const entradas = round2(
    movimentacoes
      .filter((m) => m.tipo === "entrada")
      .reduce((s, m) => s + m.valor, 0)
  );
  const saidas = round2(
    movimentacoes
      .filter((m) => m.tipo === "saida")
      .reduce((s, m) => s + m.valor, 0)
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Caixa</h1>
        <p className="text-sm text-muted">Tudo que entrou e saiu</p>
      </div>

      <FiltrosCaixa
        periodo={periodo}
        tipo={tipoParam === "entrada" || tipoParam === "saida" ? tipoParam : "todas"}
        de={intervalo.de}
        ate={intervalo.ate}
      />

      <CaixaView
        movimentacoes={movimentacoes}
        totais={{ entradas, saidas, saldo: round2(entradas - saidas) }}
        categorias={categorias}
      />
    </div>
  );
}
