import { getEmpresaDoUsuario, getMetricasDashboard } from "@/lib/lavacar/queries";
import { DashboardView } from "@/components/lavacar/dashboard/dashboard-view";

export const dynamic = "force-dynamic";

export default async function LavacarDashboardPage() {
  const vinculo = await getEmpresaDoUsuario();
  if (!vinculo) return null; // layout já redireciona

  const metricas = await getMetricasDashboard(vinculo.empresa.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Início</h1>
        <p className="text-sm text-muted">Como está o caixa hoje</p>
      </div>
      <DashboardView data={metricas} />
    </div>
  );
}
