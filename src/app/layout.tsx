import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "LavaCar — Gestão do seu lava-rápido",
  description:
    "App simples para controlar o caixa do seu lava-rápido: registre lavagens, despesas e fiados, e acompanhe entradas, saídas e relatórios do mês.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="app-aurora min-h-screen antialiased">
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#14141d",
              border: "1px solid #262636",
              color: "#ececf3",
            },
          }}
        />
      </body>
    </html>
  );
}
