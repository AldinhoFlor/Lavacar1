import {
  getEmpresaDoUsuario,
  getServicos,
  getCategorias,
} from "@/lib/lavacar/queries";
import { AjustesView } from "@/components/lavacar/ajustes/ajustes-view";

export const dynamic = "force-dynamic";

export default async function AjustesPage() {
  const vinculo = await getEmpresaDoUsuario();
  if (!vinculo) return null;

  const [servicos, categorias] = await Promise.all([
    getServicos(vinculo.empresa.id),
    getCategorias(vinculo.empresa.id),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Ajustes</h1>
        <p className="text-sm text-muted">Empresa, serviços e categorias</p>
      </div>
      <AjustesView
        empresa={vinculo.empresa}
        servicos={servicos}
        categorias={categorias}
      />
    </div>
  );
}
