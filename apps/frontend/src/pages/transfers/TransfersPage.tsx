import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useTransfers,
  useCreateTransfer,
  useConfirmTransfer,
  useCompleteTransfer,
} from "../../hooks/useWarehouse";
import { useLocations } from "../../hooks/useWarehouse";
import { useUIStore } from "../../store/uiStore";
import { formatDate } from "../../lib/utils";
import { TransferStatusBadge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import { ErrorState } from "../../components/ui/ErrorState";

const createTransferSchema = z.object({
  fromLocationId: z.string().min(1, "Select source location"),
  toLocationId: z.string().min(1, "Select destination location"),
  productId: z.string().min(1, "Product SKU required"),
  quantity: z.number({ coerce: true }).int().positive("Quantity must be positive"),
  reason: z.string().min(1, "Reason required"),
});

type TransferForm = z.infer<typeof createTransferSchema>;

const REASONS = ["Rebalancing", "Overflow", "Zone Maintenance", "Customer Request", "Cycle Count"];
const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "In Transit", value: "in_transit" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function TransfersPage() {
  const [filterStatus, setFilterStatus] = useState("");
  const { activeModal, openModal, closeModal } = useUIStore();

  const { data: transfers, isLoading, error, refetch } = useTransfers(filterStatus || undefined);
  const { data: locations } = useLocations();
  const createTransfer = useCreateTransfer();
  const confirm = useConfirmTransfer();
  const complete = useCompleteTransfer();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TransferForm>({
    resolver: zodResolver(createTransferSchema),
    defaultValues: { reason: "Rebalancing", quantity: 1 },
  });

  const onSubmit = (form: TransferForm) => {
    createTransfer.mutate(form, { onSuccess: () => reset() });
  };

  const allTransfers = Array.isArray(transfers) ? transfers : [];
  const draftCount = allTransfers.filter((t) => t.status === "draft").length;
  const inTransitCount = allTransfers.filter((t) => t.status === "in_transit").length;
  const completedCount = allTransfers.filter((t) => t.status === "completed").length;

  if (isLoading) return <PageSpinner />;
  if (error) return <ErrorState message="Failed to load transfers." onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-5">

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Draft", value: String(draftCount), color: "#22d3ee" },
          { label: "In Transit", value: String(inTransitCount), color: "#f59e0b" },
          { label: "Completed", value: String(completedCount), color: "#4ade80" },
        ].map((k) => (
          <div key={k.label} className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
            <div className="text-[12px] font-medium text-[#8b92a8]">{k.label}</div>
            <div className="mt-1.5 font-['JetBrains_Mono',monospace] text-[24px] font-semibold" style={{ color: k.color }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters + action */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`rounded-[10px] border px-3.5 py-1.5 text-[12px] font-medium transition-all ${
              filterStatus === f.value
                ? "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ade80]"
                : "border-[#2a2f42] bg-[#1a1e28] text-[#8b92a8] hover:text-[#e8eaf0]"
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => openModal("create-transfer")}
          className="ml-auto flex items-center gap-1.5 rounded-[10px] bg-[#4ade80] px-3.5 py-2 text-[13px] font-semibold text-[#0d0f14] hover:bg-[#22c55e]"
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Transfer
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[16px] border border-[#2a2f42]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#2a2f42]">
              {["Transfer ID", "From", "To", "Product", "Qty", "Reason", "Date", "Status", "Actions"].map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allTransfers.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-[13px] text-[#555d73]">No transfers found.</td></tr>
            )}
            {allTransfers.map((t) => (
              <tr key={t.id} className="border-b border-[#2a2f42] transition-colors hover:bg-[#1a1e28] last:border-b-0">
                <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8]">{t.transferNumber}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-[#232839] px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] text-[#8b92a8]">{t.fromZone}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-[#232839] px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] text-[#8b92a8]">{t.toZone}</span>
                </td>
                <td className="px-4 py-3 text-[13px] text-[#8b92a8]">
                  <span className="mr-1 font-['JetBrains_Mono',monospace] text-[11px]">{t.sku}</span>
                </td>
                <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[13px] font-semibold text-[#e8eaf0]">{t.quantity}</td>
                <td className="px-4 py-3 text-[13px] text-[#8b92a8]">{t.reason}</td>
                <td className="px-4 py-3 text-[12px] text-[#555d73]">{formatDate(t.createdAt, "MMM d")}</td>
                <td className="px-4 py-3"><TransferStatusBadge status={t.status} /></td>
                <td className="px-4 py-3">
                  {t.status === "draft" && (
                    <button
                      onClick={() => confirm.mutate(t.id)}
                      disabled={confirm.isPending}
                      className="rounded-[8px] bg-[rgba(34,211,238,0.1)] px-3 py-1.5 text-[12px] font-medium text-[#22d3ee] hover:bg-[rgba(34,211,238,0.2)] disabled:opacity-50"
                    >
                      Send
                    </button>
                  )}
                  {t.status === "in_transit" && (
                    <button
                      onClick={() => complete.mutate(t.id)}
                      disabled={complete.isPending}
                      className="rounded-[8px] bg-[rgba(74,222,128,0.1)] px-3 py-1.5 text-[12px] font-medium text-[#4ade80] hover:bg-[rgba(74,222,128,0.2)] disabled:opacity-50"
                    >
                      Confirm Receipt
                    </button>
                  )}
                  {["completed", "cancelled"].includes(t.status) && (
                    <button className="rounded-[8px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-1.5 text-[12px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]">
                      View
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Transfer Modal */}
      {activeModal === "create-transfer" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => closeModal()}>
          <div className="w-[440px] rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[16px] font-semibold text-[#e8eaf0]">New Stock Transfer</span>
              <button onClick={() => closeModal()} className="text-[#8b92a8] hover:text-[#e8eaf0]">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">From Location</label>
                  <select {...register("fromLocationId")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]">
                    <option value="">Select…</option>
                    {(locations ?? []).map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                  {errors.fromLocationId && <p className="mt-1 text-[11px] text-[#f87171]">{errors.fromLocationId.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">To Location</label>
                  <select {...register("toLocationId")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]">
                    <option value="">Select…</option>
                    {(locations ?? []).map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                  {errors.toLocationId && <p className="mt-1 text-[11px] text-[#f87171]">{errors.toLocationId.message}</p>}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Product ID or SKU</label>
                <input {...register("productId")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 font-['JetBrains_Mono',monospace] text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]" placeholder="Enter product ID…" />
                {errors.productId && <p className="mt-1 text-[11px] text-[#f87171]">{errors.productId.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Quantity</label>
                <input {...register("quantity")} type="number" min="1" step="1" className="w-full rounded-[10px] border border-[#2a2f4