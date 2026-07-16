"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Wallet,
  BarChart3,
  Settings,
  Plus,
  Car,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LavacarProvider, useLavacarActions } from "./actions-context";
import type { Categoria, Empresa, Servico } from "@/lib/lavacar/types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/", label: "Início", icon: Home },
  { href: "/caixa", label: "Caixa", icon: Wallet },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function LavacarShell({
  empresa,
  servicos,
  categorias,
  children,
}: {
  empresa: Empresa;
  servicos: Servico[];
  categorias: Categoria[];
  children: React.ReactNode;
}) {
  return (
    <LavacarProvider
      empresaId={empresa.id}
      servicos={servicos}
      categorias={categorias}
    >
      <div className="min-h-dvh md:flex">
        <DesktopSidebar empresa={empresa} />

        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader empresa={empresa} />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-8">
            {children}
          </main>
        </div>

        <MobileBottomNav />
      </div>
    </LavacarProvider>
  );
}

function MobileHeader({ empresa }: { empresa: Empresa }) {
  return (
    <header className="glass sticky top-0 z-20 flex items-center gap-3 border-b border-border-soft px-4 py-3 md:hidden">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-white">
        <Car className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-fg">{empresa.nome}</p>
        <p className="text-[11px] text-muted">Controle de caixa</p>
      </div>
    </header>
  );
}

function DesktopSidebar({ empresa }: { empresa: Empresa }) {
  const pathname = usePathname();
  const { abrirMenuRapido } = useLavacarActions();

  return (
    <aside className="glass sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border-soft px-3 py-5 md:flex">
      <Link href="/" className="mb-6 flex items-center gap-2.5 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-white">
          <Car className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-fg">
            {empresa.nome}
          </span>
          <span className="block text-[11px] text-muted">LavaCar</span>
        </span>
      </Link>

      <button
        type="button"
        onClick={abrirMenuRapido}
        className="btn-brand mb-4 flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition active:scale-[0.98]"
      >
        <Plus className="h-5 w-5" />
        Nova ação
      </button>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                active
                  ? "bg-brand/15 text-brand"
                  : "text-muted hover:bg-surface-2 hover:text-fg"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();
  const { abrirMenuRapido } = useLavacarActions();

  const left = NAV.slice(0, 2);
  const right = NAV.slice(2);

  return (
    <nav
      className="glass fixed bottom-0 left-0 right-0 z-30 flex items-stretch justify-around border-t border-border-soft px-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5 md:hidden"
      aria-label="Navegação principal"
    >
      {left.map((item) => (
        <NavButton key={item.href} item={item} active={isActive(pathname, item.href)} />
      ))}

      <button
        type="button"
        onClick={abrirMenuRapido}
        aria-label="Nova ação"
        className="relative -mt-6 flex w-16 shrink-0 flex-col items-center justify-start"
      >
        <motion.span
          whileTap={{ scale: 0.9 }}
          className="btn-brand flex h-14 w-14 items-center justify-center rounded-full ring-4 ring-bg"
        >
          <Plus className="h-7 w-7" />
        </motion.span>
        <span className="mt-0.5 text-[10px] font-medium text-muted">Novo</span>
      </button>

      {right.map((item) => (
        <NavButton key={item.href} item={item} active={isActive(pathname, item.href)} />
      ))}
    </nav>
  );
}

function NavButton({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-medium transition",
        active ? "text-brand" : "text-muted"
      )}
    >
      <Icon className="h-5 w-5" />
      {item.label}
    </Link>
  );
}
