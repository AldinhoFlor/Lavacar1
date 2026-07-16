import { redirect } from "next/navigation";
import { modoSemLogin } from "@/lib/modo";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  // Modo sem login: não há tela de entrada — vai direto para o app.
  if (modoSemLogin()) redirect("/");
  return <LoginForm />;
}
