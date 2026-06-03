import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSalesOrders, useCreateSalesOrder, useDispatchOrder } from "../../hooks/useOrders";
import { useUIStore } from "../../store/uiStore";
import { formatCurrency, formatDate } from "../../lib/utils";
import { SOStatusBadge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { CARRIERS } from "../../lib/constants";

const createSOSchema = z.object({
  customerName: z.string().min(1, "Customer name required"),
  requiredBy: z.string().min(1, "Required date needed"),
  carrier: z.string().optional(),
  shippingAddress: z.string().min(5, "Shipping address required"),
});

type CreateSOForm = z.infer<typeof createSOSchema>;

const STATUS_FILTERS = [
  { label: "All Orders", value: "" },
  { label: "Processing", value: "processing" },
  { label: "Picking", value: "picking" },
  { label: "Packing", value: "packing" },
  { label: "Dispatched", value: "dispatched" },
];

export default function OutboundPage() {
  const [status, setStatus] = useState("");
  const { activeModal, openModal, closeModal } = useUIStore();
  const { data, isLoading, error, refetch } = useSalesOrders({ status });
  const createSO = useCreateSalesOrder();
  const dispatch = useDispatchOrder();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateSOForm>({
    resolver: zodResolver(createSOSchema),
  });

  const onSubmit = (form: CreateSOForm) => {
    createSO.mutate({ ...form, items: [] }, { onSuccess: () => reset() });
  };

  const orders = data?.data ?? [];
  const urgentCount = orders.filter((o) => o.isUrgent).length;
  const dispatchedToday = orders.filter((o) => o.status === "dispatched").length;
  const fillRate = 96.4;

  if (isLoading) return <PageSpinner />;
  if (error) return <ErrorState message="Failed to load sales orders." onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open Orders", value: String(data?.total ?? 0), sub: `${urgentCount} urgent`, color: "#f59e0b" },
          { label: "Dispatched Today", value: String(dispatchedToday), sub: "Fulfilled successfully", color: "#4ade80" },
          { label: "Fill Rate", value: `${fillRate}%`, sub: "Target: 95%", color: "#22d3ee" },
        ].map((k) => (
          <div key={k.label} className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-4">
            <div className="text-[12px] font-medium text-[#8b92a8]">{k.label}</div>
            <div className="mt-1.5 font-['JetBrains_Mono',monospace] text-[22px] font-semibold" style={{ color: k.color }}>{k.value}</div>
            <div className="mt-1 text-[12px] text-[#4ade80]">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setStatus(f.value)}
              className={`rounded-[10px] border px-3.5 py-1.5 text-[12px] font-medium transition-all ${status === f.value ? "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ade80]" : "border-[#2a2f42] bg-[#1a1e28] text-[#8b92a8] hover:text-[#e8eaf0]"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={() => openModal("create-so")} className="ml-auto flex items-center gap-1.5 rounded-[10px] bg-[#4ade80] px-3.5 py-2 text-[13px] font-semibold text-[#0d0f14] hover:bg-[#22c55e]">
          + New Sales Order
        </button>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-[#2a2f42]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#2a2f42]">
              {["SO Number", "Customer", "Items", "Value", "Required By", "Status", "Carrier", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((so) => (
              <tr key={so.id} className="border-b border-[#2a2f42] transition-colors hover:bg-[#1a1e28] last:border-b-0">
                <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8]">{so.soNumber}</td>
                <td className="px-4 py-3 text-[13px] text-[#e8eaf0]">{so.customerName}</td>
                <td className="px-4 py-3 text-[13px] text-[#8b92a8]">{so.totalItems} SKUs</td>
                <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8]">{formatCurrency(so.totalValue)}</td>
                <td className="px-4 py-3 text-[13px] text-[#8b92a8]">{formatDate(so.requiredBy)}</td>
                <td className="px-4 py-3"><SOStatusBadge status={so.status} isUrgent={so.isUrgent} /></td>
                <td className="px-4 py-3 text-[13px] text-[#8b92a8]">{so.carrier ?? "—"} {so.trackingNumber && <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[#555d73]">{so.trackingNumber}</span>}</td>
                <td className="px-4 py-3">
                  {["picking", "packing"].includes(so.status) && (
                    <button onClick={() => dispatch.mutate({ id: so.id, carrier: so.carrier ?? "FedEx" })}
                      className="rounded-[8px] bg-[rgba(74,222,128,0.1)] px-3 py-1.5 text-[12px] font-medium text-[#4ade80] hover:bg-[rgba(74,222,128,0.2)]">
                      Dispatch
                    </button>
                  )}
                  {so.status === "dispatched" && (
                    <button className="rounded-[8px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-1.5 text-[12px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]">Track</button>
                  )}
                  {["processing"].includes(so.status) && (
                    <button className="rounded-[8px] bg-[rgba(74,222,128,0.1)] px-3 py-1.5 text-[12px] font-medium text-[#4ade80] hover:bg-[rgba(74,222,128,0.2)]">Pick</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeModal === "create-so" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => closeModal()}>
          <div className="w-[440px] rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[16px] font-semibold text-[#e8eaf0]">Create Sales Order</span>
              <button onClick={() => closeModal()} className="text-[#8b92a8] hover:text-[#e8eaf0]">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Customer Name / ID</label>
                <input {...register("customerName")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]" placeholder="e.g. Retail Chain #4" />
                {errors.customerName && <p className="mt-1 text-[11px] text-[#f87171]">{errors.customerName.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Required By</label>
                  <input {...register("requiredBy")} type="date" className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Carrier</label>
                  <select {...register("carrier")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none">
                    {CARRIERS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Shipping Address</label>
                <input {...register("shippingAddress")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]" placeholder="Full shipping address" />
                {errors.shippingAddress && <p className="mt-1 text-[11px] text-[#f87171]">{errors.shippingAddress.message}</p>}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => closeModal()} className="rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-4 py-2.5 text-[13px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]">Cancel</button>
                <button type="submit" disabled={createSO.isPending} className="rounded-[10px] bg-[#4ade80] px-4 py-2.5 text-[13px] font-semibold text-[#0d0f14] hover:bg-[#22c55e] disabled:opacity-60">
                  {createSO.isPending ? "Creating…" : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}