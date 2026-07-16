import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getEmpresaDoUsuario,
  getServicos,
  getCategorias,
} from "@/lib/lavacar/queries";
import { LavacarShell } from "@/components/lavacar/lavacar-shell";

export const dynamic = "force-dynamic";

export default async function LavacarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const vinculo = await getEmpresaDoUsuario();
  if (!vinculo) redirect("/onboarding");

  const [servicos, categorias] = await Promise.all([
    getServicos(vinculo.empresa.id),
    getCategorias(vinculo.empresa.id),
  ]);

  return (
    <LavacarShell
      empresa={vinculo.empresa}
      servicos={servicos}
      categorias={categorias}
    >
      {children}
    </LavacarShell>
  );
}
