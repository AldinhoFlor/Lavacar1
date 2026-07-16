import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { modoSemLogin } from "@/lib/modo";
import { getEmpresaDoUsuario } from "@/lib/lavacar/queries";
import { OnboardingForm } from "@/components/lavacar/onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  // Caminho autenticado: exige sessão. No modo sem login isso é pulado.
  if (!modoSemLogin()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
  }

  // Já tem empresa? Vai direto para o app.
  const vinculo = await getEmpresaDoUsuario();
  if (vinculo) redirect("/");

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <OnboardingForm />
    </div>
  );
}
