import { cn } from "../../lib/utils";
import type { StockStatus } from "../../lib/utils";

type BadgeVariant = "green" | "red" | "amber" | "blue" | "purple" | "gray";

const VARIANTS: Record<BadgeVariant, string> = {
  green: "bg-[rgba(74,222,128,0.12)] text-[#4ade80]",
  red: "bg-[rgba(248,113,113,0.12)] text-[#f87171]",
  amber: "bg-[rgba(245,158,11,0.12)] text-[#f59e0b]",
  blue: "bg-[rgba(34,211,238,0.12)] text-[#22d3ee]",
  purple: "bg-[rgba(139,92,246,0.12)] text-[#a78bfa]",
  gray: "bg-[rgba(255,255,255,0.06)] text-[#8b92a8]",
};

const STOCK_STATUS_VARIANTS: Record<StockStatus, BadgeVariant> = {
  in_stock: "green",
  low: "amber",
  critical: "red",
  out_of_stock: "red",
};

const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  in_stock: "● In Stock",
  low: "⚡ Low Stock",
  critical: "⚠ Critical",
  out_of_stock: "✕ Out of Stock",
};

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StockBadge({ status }: { status: StockStatus }) {
  return (
    <Badge variant={STOCK_STATUS_VARIANTS[status]}>
      {STOCK_STATUS_LABELS[status]}
    </Badge>
  );
}

const PO_STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  draft: { label: "📋 Draft", variant: "gray" },
  confirmed: { label: "📋 Confirmed", variant: "purple" },
  shipped: { label: "🚢 Shipped", variant: "blue" },
  in_transit: { label: "⏳ In Transit", variant: "amber" },
  received: { label: "✓ Received", variant: "green" },
  cancelled: { label: "✕ Cancelled", variant: "red" },
};

const SO_STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  processing: { label: "📋 Processing", variant: "purple" },
  picking: { label: "🔵 Picking", variant: "blue" },
  packing: { label: "📦 Packing", variant: "amber" },
  dispatched: { label: "✓ Dispatched", variant: "green" },
  delivered: { label: "✓ Delivered", variant: "green" },
  cancelled: { label: "✕ Cancelled", variant: "red" },
};

const TRANSFER_STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  draft: { label: "📋 Draft", variant: "blue" },
  in_transit: { label: "⏳ In Transit", variant: "amber" },
  completed: { label: "✓ Completed", variant: "green" },
  cancelled: { label: "✕ Cancelled", variant: "red" },
};

export function POStatusBadge({ status }: { status: string }) {
  const map = PO_STATUS_MAP[status] ?? { label: status, variant: "gray" as BadgeVariant };
  return <Badge variant={map.variant}>{map.label}</Badge>;
}

export function SOStatusBadge({ status, isUrgent }: { status: string; isUrgent?: boolean }) {
  if (isUrgent && status !== "dispatched" && status !== "delivered") {
    return <Badge variant="red">🔴 Urgent</Badge>;
  }
  const map = SO_STATUS_MAP[status] ?? { label: status, variant: "gray" as BadgeVariant };
  return <Badge variant={map.variant}>{map.label}</Badge>;
}

export function TransferStatusBadge({ status }: { status: string }) {
  const map = TRANSFER_STATUS_MAP[status] ?? { label: status, variant: "gray" as BadgeVariant };
  return <Badge variant={map.variant}>{map.label}</Badge>;
}