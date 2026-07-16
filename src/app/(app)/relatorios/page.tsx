import { getEmpresaDoUsuario, getRelatorioMensal } from "@/lib/lavacar/queries";
import { RelatoriosView } from "@/components/lavacar/relatorios/relatorios-view";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const vinculo = await getEmpresaDoUsuario();
  if (!vinculo) return null;

  const sp = await searchParams;
  const hoje = new Date();
  const anoParam = typeof sp.ano === "string" ? parseInt(sp.ano, 10) : NaN;
  const mesParam = typeof sp.mes === "string" ? parseInt(sp.mes, 10) : NaN;

  const ano = Number.isFinite(anoParam) ? anoParam : hoje.getFullYear();
  const mes =
    Number.isFinite(mesParam) && mesParam >= 1 && mesParam <= 12
      ? mesParam
      : hoje.getMonth() + 1;

  const relatorio = await getRelatorioMensal(vinculo.empresa.id, ano, mes);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted">Seu mês em números</p>
      </div>
      <RelatoriosView relatorio={relatorio} />
    </div>
  );
}
