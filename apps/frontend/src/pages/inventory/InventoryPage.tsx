import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProducts, useCreateProduct } from "../../hooks/useInventory";
import { useUIStore } from "../../store/uiStore";
import { formatCurrency, getStockStatus } from "../../lib/utils";
import { StockBadge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { CATEGORIES, ZONES_LIST } from "../../lib/constants";

const STATUS_FILTERS = [
  { label: "All Items", value: "" },
  { label: "In Stock", value: "in_stock" },
  { label: "Low Stock", value: "low" },
  { label: "Out of Stock", value: "out_of_stock" },
];

const createSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(2, "Name is required"),
  category: z.string().min(1, "Category required"),
  barcode: z.string().optional(),
  unitOfMeasure: z.string().min(1, "UOM required"),
  unitCost: z.number({ coerce: true }).positive("Must be positive"),
  sellingPrice: z.number({ coerce: true }).positive("Must be positive"),
  reorderPoint: z.number({ coerce: true }).int().min(0),
  initialQty: z.number({ coerce: true }).int().min(0),
  locationZone: z.string().min(1, "Zone required"),
});

type CreateForm = z.infer<typeof createSchema>;

export default function InventoryPage() {
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const { activeModal, openModal, closeModal } = useUIStore();

  const { data, isLoading, error, refetch } = useProducts({ status, category, page, pageSize: 20 });
  const createProduct = useCreateProduct();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  const onSubmit = (form: CreateForm) => {
    createProduct.mutate(form, { onSuccess: () => reset() });
  };

  if (isLoading) return <PageSpinner />;
  if (error) return <ErrorState message="Failed to load inventory." onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatus(f.value); setPage(1); }}
            className={`rounded-[10px] border px-3.5 py-1.5 text-[12px] font-medium transition-all ${
              status === f.value
                ? "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ade80]"
                : "border-[#2a2f42] bg-[#1a1e28] text-[#8b92a8] hover:text-[#e8eaf0]"
            }`}
          >
            {f.label}
          </button>
        ))}
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategory(category === cat ? "" : cat); setPage(1); }}
            className={`rounded-[10px] border px-3.5 py-1.5 text-[12px] font-medium transition-all ${
              category === cat
                ? "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ade80]"
                : "border-[#2a2f42] bg-[#1a1e28] text-[#8b92a8] hover:text-[#e8eaf0]"
            }`}
          >
            {cat}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button className="flex items-center gap-1.5 rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-1.5 text-[12px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Import CSV
          </button>
          <button
            onClick={() => openModal("add-product")}
            className="flex items-center gap-1.5 rounded-[10px] bg-[#4ade80] px-3 py-1.5 text-[12px] font-semibold text-[#0d0f14] transition-all hover:bg-[#22c55e]"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Product
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[16px] border border-[#2a2f42]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#2a2f42]">
              {["SKU", "Product Name", "Category", "Location", "On Hand", "Reorder Pt.", "Unit Cost", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.data.map((product) => {
              const level = product.inventoryLevels[0];
              const status = getStockStatus(product.totalOnHand, product.reorderPoint);
              return (
                <tr
                  key={product.id}
                  className="cursor-pointer border-b border-[#2a2f42] transition-colors hover:bg-[#1a1e28] last:border-b-0"
                >
                  <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8]">{product.sku}</td>
                  <td className="px-4 py-3 text-[13px] font-medium text-[#e8eaf0]">
                    <Link to={`/inventory/${product.id}`} className="hover:text-[#4ade80]">{product.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#8b92a8]">{product.category}</td>
                  <td className="px-4 py-3">
                    {level && (
                      <span className="rounded bg-[#232839] px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] text-[#8b92a8]">
                        {level.zone} / {level.rack} / {level.bin}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: status === "critical" || status === "out_of_stock" ? "#f87171" : "#e8eaf0" }}>
                    {product.totalOnHand.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-[#555d73]">{product.reorderPoint}</td>
                  <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8]">{formatCurrency(product.unitCost)}</td>
                  <td className="px-4 py-3"><StockBadge status={status} /></td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/inventory/${product.id}`}
                      className="rounded-[8px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-1.5 text-[12px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-[12px] text-[#8b92a8]">
          <span>Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total} items</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-[8px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-1.5 disabled:opacity-40">← Prev</button>
            {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`rounded-[8px] border px-3 py-1.5 ${p === page ? "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ade80]" : "border-[#2a2f42] bg-[#1a1e28]"}`}>{p}</button>
            ))}
            <button disabled={page === data.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-[8px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-1.5 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {activeModal === "add-product" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => closeModal()}>
          <div className="max-h-[85vh] w-[480px] max-w-[90vw] overflow-y-auto rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[16px] font-semibold text-[#e8eaf0]">Add New Product</span>
              <button onClick={() => closeModal()} className="text-[#8b92a8] hover:text-[#e8eaf0]">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Product Name</label>
                <input {...register("name")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]" placeholder="e.g. USB-C Hub 7-in-1" />
                {errors.name && <p className="mt-1 text-[11px] text-[#f87171]">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">SKU</label>
                  <input {...register("sku")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]" placeholder="SKU-XXXX" />
                  {errors.sku && <p className="mt-1 text-[11px] text-[#f87171]">{errors.sku.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Barcode</label>
                  <input {...register("barcode")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]" placeholder="EAN / UPC" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Category</label>
                  <select {...register("category")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Unit of Measure</label>
                  <select {...register("unitOfMeasure")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none">
                    <option>Each (ea)</option><option>Box</option><option>Pallet</option><option>Kg</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Unit Cost ($)</label>
                  <input {...register("unitCost")} type="number" step="0.01" className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]" placeholder="0.00" />
                  {errors.unitCost && <p className="mt-1 text-[11px] text-[#f87171]">{errors.unitCost.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Selling Price ($)</label>
                  <input {...register("sellingPrice")} type="number" step="0.01" className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]" placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Initial Qty</label>
                  <input {...register("initialQty")} type="number" className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]" placeholder="0" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Reorder Point</label>
                  <input {...register("reorderPoint")} type="number" className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Storage Zone</label>
                <select {...register("locationZone")} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none">
                  {ZONES_LIST.map((z) => <option key={z}>{z}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => closeModal()} className="rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-4 py-2.5 text-[13px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]">Cancel</button>
                <button type="submit" disabled={createProduct.isPending} className="flex items-center gap-2 rounded-[10px] bg-[#4ade80] px-4 py-2.5 text-[13px] font-semibold text-[#0d0f14] hover:bg-[#22c55e] disabled:opacity-60">
                  {createProduct.isPending ? "Saving…" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}