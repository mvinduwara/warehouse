import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePurchaseOrders, useCreatePurchaseOrder, useUpdatePOStatus } from "../../hooks/useOrders";
import { useSuppliers } from "../../hooks/useOrders";
import { useUIStore } from "../../store/uiStore";
import { formatCurrency, formatDate } from "../../lib/utils";
import { POStatusBadge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import { ErrorState } from "../../components/ui/ErrorState";

const createPOSchema = z.object({
  supplierId: z.string().min(1, "Select a supplier"),
  expectedDate: z.string().min(1, "Expected date required"),
  receivingDock: z.string().min(1, "Select a dock"),
  notes: z.string().optional(),
});

type CreatePOForm = z.infer<typeof createPOSchema>;

const STATUS_FILTERS = [
  { label: "All POs", value: "" },
  { label: "Draft", value: "draft" },
  { label: "In Transit", value: "in_transit" },
  { label: "Received", value: "received" },
];

export default function InboundPage() {
  const [status, setStatus] = useState("");
  const { activeModal, openModal, closeModal } = useUIStore();
  const { data, isLoading, error, refetch } = usePurchaseOrders({ status });
  const { data: suppliers } = useSuppliers();
  const createPO = useCreatePurchaseOrder();
  const updateStatus = useUpdatePOStatus();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreatePOForm>({
    resolver: zodResolver(createPOSchema),
  });

  const onSubmit = (form: CreatePOForm) => {
    createPO.mutate({ ...form, items: [] }, { onSuccess: () => reset() });
  };

  const poList = data?.data ?? [];
  const inTransit = poList.filter((p) => p.status === "in_transit").length;
  const pending = poList.filter((p) => ["draft", "confirmed", "shipped"].includes(p.status)).length;

  if (isLoading) return <PageSpinner />;
  if (error) return <ErrorState message="Failed to load purchase orders." onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-5">
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active POs", value: String(data?.total ?? 0), sub: `${inTransit} arriving soon` },
          { label: "Pending GRNs", value: String(pending), sub: "Awaiting verification" },
          { label: "Suppliers", value: String(suppliers?.length ?? 0), sub: "Active suppliers" },
        ].map((k) => (
          <div key={k.label} className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-4">
            <div className="text-[12px] font-medium text-[#8b92a8]">{k.label}</div>
            <div className="mt-1.5 font-['JetBrains_Mono',monospace] text-[22px] font-semibold text-[#e8eaf0]">{k.value}</div>
            <div className="mt-1 text-[12px] text-[#4ade80]">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Header + filters */}
      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setStatus(f.value)}
              className={`rounded-[10px] border px-3.5 py-1.5 text-[12px] font-medium transition-all ${status === f.value ? "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ade80]" : "border-[#2a2f42] bg-[#1a1e28] text-[#8b92a8] hover:text-[#e8eaf0]"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <button onClick={() => openModal("create-po")}
            className="flex items-center gap-1.5 rounded-[10px] bg-[#4ade80] px-3.5 py-2 text-[13px] font-semibold text-[#0d0f14] hover:bg-[#22c55e]">
            + New Purchase Order
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[16px] border border-[#2a2f42]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#2a2f42]">
              {["PO Number", "Supplier", "Items", "Total Value", "Expected Date", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {poList.map((po) => (
              <tr key={po.id} className="border-b border-[#2a2f42] transition-colors hover:bg-[#1a1e28] last:border-b-0">
                <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8]">{po.poNumber}</td>
                <td className="px-4 py-3 text-[13px] text-[#e8eaf0]">{po.supplier.name}</td>
                <td className="px-4 py-3 text-[13px] text-[#8b92a8]">{po.totalItems} SKUs</td>
                <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8]">{formatCurrency(po.totalValue)}</td>
                <td className="px-4 py-3 text-[13px] text-[#8b92a8]">{formatDate(po.expectedDate)}</td>
                <td className="px-4 py-3"><POStatusBadge status={po.status} /></td>
                <td className="px-4 py-3">
                  {po.status === "in_transit" && (
                    <button onClick={() => updateStatus.mutate({ id: po.id, status: "received" })}
                      className="rounded-[8px] bg-[rgba(74,222,128,0.1)] px-3 py-1.5 text-[12px] font-medium text-[#4ade80] hover:bg-[rgba(74,222,128,0.2)]">
                      Receive
                    </button>
                  )}
                  {po.status !== "in_transit" && (
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

      {/* Create PO Modal */}
      {activeModal === "create-po" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => closeModal()}>
          <div className="w-[440px] rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[16px] font-semibold text-[#e8eaf0]">Create Purchase Order</span>
              <button onClick={() => closeModal()} className="text-[#8b92a8] hover:text-[#e8eaf0]">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Supplier</label>
                <select {...register("supplierId")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none">
                  <option value="">Select supplier…</option>
                  {suppliers?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errors.supplierId && <p className="mt-1 text-[11px] text-[#f87171]">{errors.supplierId.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Expected Date</label>
                  <input {...register("expectedDate")} type="date" className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Receiving Dock</label>
                  <select {...register("receivingDock")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none">
                    <option value="Dock A">Dock A</option>
                    <option value="Dock B">Dock B</option>
                    <option value="Dock C">Dock C</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Notes (optional)</label>
                <input {...register("notes")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]" placeholder="Any additional notes…" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => closeModal()} className="rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-4 py-2.5 text-[13px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]">Cancel</button>
                <button type="submit" disabled={createPO.isPending} className="rounded-[10px] bg-[#4ade80] px-4 py-2.5 text-[13px] font-semibold text-[#0d0f14] hover:bg-[#22c55e] disabled:opacity-60">
                  {createPO.isPending ? "Creating…" : "Create PO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}