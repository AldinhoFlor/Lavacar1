import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function timeAgo(value: string | null | undefined) {
  if (!value) return "—";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d atrás`;
  const months = Math.floor(days / 30);
  return `${months}mês atrás`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  alta: { label: "Alta", color: "#ef4444" },
  media: { label: "Média", color: "#f59e0b" },
  baixa: { label: "Baixa", color: "#64748b" },
};
export function priorityMeta(p: string | null | undefined) {
  return PRIORITY_META[p ?? "media"] ?? PRIORITY_META.media;
}

const WEBSITE_META: Record<string, { label: string; color: string }> = {
  sem_site: { label: "Sem site", color: "#ef4444" },
  desatualizado: { label: "Site feio/antigo", color: "#f59e0b" },
  basico: { label: "Site básico", color: "#0ea5e9" },
  bom: { label: "Site bom", color: "#22c55e" },
};
export function websiteMeta(w: string | null | undefined) {
  return WEBSITE_META[w ?? "sem_site"] ?? WEBSITE_META.sem_site;
}

/**
 * Public URL of a lead's proposal. Uses NEXT_PUBLIC_PROPOSAL_BASE_URL when set
 * (your custom domain / subdomain), so links copied and e-mailed to clients
 * always use the pretty domain regardless of where the CRM itself runs. Falls
 * back to the current origin.
 */
export function proposalUrl(id: string): string {
  const base = (process.env.NEXT_PUBLIC_PROPOSAL_BASE_URL || "").replace(/\/+$/, "");
  const origin =
    base || (typeof window !== "undefined" ? window.location.origin : "");
  return `${origin}/proposta/${id}`;
}

export type ProposalState = "none" | "ready" | "sent" | "followup" | "discard";

export interface ProposalStatus {
  state: ProposalState;
  label: string;
  color: string;
  days: number | null;
}

/**
 * Where a lead sits in the proposal lifecycle, for the kanban badge and the
 * lead detail. `ready` = AI copy generated (safe to send). Once sent, the
 * elapsed days are compared to the configurable follow-up / discard thresholds.
 */
export function proposalStatus(
  lead: { ai_content?: unknown; proposal_sent_at?: string | null },
  followupDays = 5,
  discardDays = 14
): ProposalStatus {
  const sentAt = lead.proposal_sent_at ? new Date(lead.proposal_sent_at) : null;
  if (sentAt && !Number.isNaN(sentAt.getTime())) {
    const days = Math.max(
      0,
      Math.floor((Date.now() - sentAt.getTime()) / 86_400_000)
    );
    if (days >= discardDays)
      return { state: "discard", label: `Descartar? · ${days}d`, color: "#ef4444", days };
    if (days >= followupDays)
      return { state: "followup", label: `Cobrar · ${days}d`, color: "#f59e0b", days };
    return {
      state: "sent",
      label: days === 0 ? "Enviada hoje" : `Enviada há ${days}d`,
      color: "#22c55e",
      days,
    };
  }
  if (lead.ai_content)
    return { state: "ready", label: "Proposta pronta", color: "#8b5cf6", days: null };
  return { state: "none", label: "", color: "", days: null };
}

const CHIP_STATUS_META: Record<string, { label: string; color: string }> = {
  novo: { label: "Novo", color: "#64748b" },
  aquecendo: { label: "Aquecendo", color: "#f59e0b" },
  ativo: { label: "Ativo", color: "#22c55e" },
  descanso: { label: "Descanso", color: "#0ea5e9" },
  sinalizado: { label: "Sinalizado", color: "#f97316" },
  banido: { label: "Banido", color: "#ef4444" },
  inativo: { label: "Inativo", color: "#475569" },
};
export function chipStatusMeta(s: string | null | undefined) {
  return CHIP_STATUS_META[s ?? "novo"] ?? CHIP_STATUS_META.novo;
}

export function healthColor(score: number) {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}
