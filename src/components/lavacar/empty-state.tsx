import type { LucideIcon } from "lucide-react";

/** Estado vazio amigável com ícone, mensagem e CTA opcional. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background: "color-mix(in srgb, var(--color-brand) 16%, transparent)",
          color: "var(--color-brand)",
        }}
      >
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <div>
        <p className="text-base font-semibold text-fg">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
