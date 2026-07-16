import {
  getEmpresaDoUsuario,
  getLavagens,
  getLavagensPendentes,
} from "@/lib/lavacar/queries";
import { toISODate } from "@/lib/lavacar/format";
import { LavagensView } from "@/components/lavacar/lavagens/lavagens-view";

export const dynamic = "force-dynamic";

export default async function LavagensPage() {
  const vinculo = await getEmpresaDoUsuario();
  if (!vinculo) return null;

  // Histórico: últimos 60 dias.
  const hoje = new Date();
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - 59);

  const [pendentes, historico] = await Promise.all([
    getLavagensPendentes(vinculo.empresa.id),
    getLavagens(vinculo.empresa.id, {
      de: toISODate(inicio),
      ate: toISODate(hoje),
    }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Lavagens</h1>
        <p className="text-sm text-muted">Histórico e valores a receber</p>
      </div>
      <LavagensView pendentes={pendentes} historico={historico} />
    </div>
  );
}
