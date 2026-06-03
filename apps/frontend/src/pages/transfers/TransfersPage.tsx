import { useTransfers, useCreateTransfer, useConfirmTransfer, useCompleteTransfer } from "../../hooks/useWarehouse";
import { useUIStore } from "../../store/uiStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDate } from "../../lib/utils";
import { TransferStatusBadge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { ZONES_LIST } from "../../lib/constants";

const createTransferSchema = z.object({
  fromLocationId: z.string().min(1),
  toLocationId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number({ coerce: true }).int().positive(),
  reason: z.string().min(1),
});

type TransferForm = z.infer<typeof createTransferSchema>;

const REASONS = ["Rebalancing", "Overflow", "Zone Maintenance", "Customer Request"];

export default function TransfersPage() {
  const { activeModal, openModal, closeModal } = useUIStore();
  const { data: transfers, isLoading, error, refetch } = useTransfers();
  const createTransfer = useCreateTransfer();
  const confirm = useConfirmTransfer();
  const complete = useCompleteTransfer();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TransferForm>({
    resolver: zodResolver(createTransferSchema),
  });

  const onSubmit = (form: TransferForm) => {
    createTransfer.mutate(form, { onSuccess: () => reset() });
  };

  if (isLoading) return <PageSpinner />;
  if (error) return <ErrorState message="Failed to load transfers." onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-[#e8eaf0]">Stock Transfers</h2>
        <button onClick={() => openModal("create-transfer")} className="flex items-center gap-1.5 rounded-[10px] bg-[#4ade80] px-3.5 py-2 text-[13px] font-semibold text-[#0d0f14] hover:bg-[#22c55e]">
          + New Transfer
        </button>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-[#2a2f42]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#2a2f42]">
              {["Transfer ID", "From", "To", "Product", "Qty", "Reason", "Date", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(transfers ?? []).map((t) => (
              <tr key={t.id} className="border-b border-[#2a2f42] transition-colors hover:bg-[#1a1e28] last:border-b-0">
                <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8]">{t.transferNumber}</td>
                <td className="px-4 py-3"><span className="rounded bg-[#232839] px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] text-[#8b92a8]">{t.fromZone}</span></td>
                <td className="px-4 py-3"><span className="rounded bg-[#232839] px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] text-[#8b92a8]">{t.toZone}</span></td>
                <td className="px-4 py-3 text-[13px] text-[#8b92a8]">{t.sku}</td>
                <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-[#e8eaf0]">{t.quantity}</td>
                <td className="px-4 py-3 text-[13px] text-[#8b92a8]">{t.reason}</td>
                <td className="px-4 py-3 text-[13px] text-[#555d73]">{formatDate(t.createdAt, "MMM d")}</td>
                <td className="px-4 py-3"><TransferStatusBadge status={t.status} /></td>
                <td className="px-4 py-3 flex gap-1">
                  {t.status === "draft" && (
                    <button onClick={() => confirm.mutate(t.id)} className="rounded-[8px] bg-[rgba(34,211,238,0.1)] px-3 py-1.5 text-[12px] font-medium text-[#22d3ee] hover:bg-[rgba(34,211,238,0.2)]">
                      Send
                    </button>
                  )}
                  {t.status === "in_transit" && (
                    <button onClick={() => complete.mutate(t.id)} className="rounded-[8px] bg-[rgba(74,222,128,0.1)] px-3 py-1.5 text-[12px] font-medium text-[#4ade80] hover:bg-[rgba(74,222,128,0.2)]">
                      Confirm Receipt
                    </button>
                  )}
                  {["completed", "cancelled"].includes(t.status) && (
                    <button className="rounded-[8px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-1.5 text-[12px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]">View</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">From Zone</label>
                  <select {...register("fromLocationId")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none">
                    {ZONES_LIST.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">To Zone</label>
                  <select {...register("toLocationId")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none">
                    {ZONES_LIST.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Product SKU</label>
                <input {...register("productId")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]" placeholder="Search SKU…" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Quantity</label>
                <input {...register("quantity")} type="number" className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]" placeholder="0" />
                {errors.quantity && <p className="mt-1 text-[11px] text-[#f87171]">{errors.quantity.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Reason</label>
                <select {...register("reason")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none">
                  {REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => closeModal()} className="rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-4 py-2.5 text-[13px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]">Cancel</button>
                <button type="submit" disabled={createTransfer.isPending} className="rounded-[10px] bg-[#4ade80] px-4 py-2.5 text-[13px] font-semibold text-[#0d0f14] hover:bg-[#22c55e] disabled:opacity-60">
                  {createTransfer.isPending ? "Creating…" : "Create Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}