import { Banknote, QrCode, CreditCard, Wallet, type LucideIcon } from "lucide-react";
import type { FormaPagamento } from "@/lib/lavacar/types";

const MAP: Record<FormaPagamento, LucideIcon> = {
  dinheiro: Banknote,
  pix: QrCode,
  cartao_debito: CreditCard,
  cartao_credito: CreditCard,
  outro: Wallet,
};

/** Componente de ícone lucide para uma forma de pagamento. */
export function PaymentIcon({
  forma,
  className,
}: {
  forma: FormaPagamento;
  className?: string;
}) {
  const Icon = MAP[forma] ?? Wallet;
  return <Icon className={className} aria-hidden />;
}

export function iconePagamento(forma: FormaPagamento): LucideIcon {
  return MAP[forma] ?? Wallet;
}
