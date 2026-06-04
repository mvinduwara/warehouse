import { useParams, useNavigate } from "react-router-dom";
import { useProduct, useAdjustStock } from "../../hooks/useInventory";
import { useUIStore } from "../../store/uiStore";
import { useState } from "react";
import { formatCurrency, formatDate, getStockStatus } from "../../lib/utils";
import { StockBadge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import { ErrorState } from "../../components/ui/ErrorState";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeModal, openModal, closeModal } = useUIStore();
  const { data: product, isLoading, error, refetch } = useProduct(id ?? "");
  const adjustStock = useAdjustStock();

  const [adjustDelta, setAdjustDelta] = useState<string>("");
  const [adjustReason, setAdjustReason] = useState("Cycle count correction");
  const [adjustLocationId, setAdjustLocationId] = useState<string>("");

  if (isLoading) return <PageSpinner />;
  if (error || !product) return <ErrorState message="Product not found." onRetry={refetch} />;

  const status = getStockStatus(product.totalOnHand, product.reorderPoint);

  const handleAdjust = () => {
    const delta = parseInt(adjustDelta, 10);
    if (isNaN(delta) || delta === 0) return;
    const locId = adjustLocationId || product.inventoryLevels[0]?.locationId;
    if (!locId) return;
    adjustStock.mutate(
      { productId: product.id, locationId: locId, delta, reason: adjustReason },
      { onSuccess: () => { setAdjustDelta(""); closeModal(); } }
    );
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-[#2a2f42] bg-[#13161e] text-[#8b92a8] transition-colors hover:text-[#e8eaf0]"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[20px] font-semibold text-[#e8eaf0]">{product.name}</h1>
            <StockBadge status={status} />
          </div>
          <p className="mt-0.5 font-['JetBrains_Mono',monospace] text-[13px] text-[#555d73]">
            {product.sku}
            {product.barcode && ` · ${product.barcode}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openModal("adjust-stock")}
            className="rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-4 py-2 text-[13px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]"
          >
            Adjust Stock
          </button>
          <button className="rounded-[10px] bg-[#4ade80] px-4 py-2 text-[13px] font-semibold text-[#0d0f14] hover:bg-[#22c55e]">
            Edit Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">

        {/* Left: details + stock table */}
        <div className="col-span-2 flex flex-col gap-4">

          {/* Product Details */}
          <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
            <h2 className="mb-4 text-[14px] font-semibold text-[#e8eaf0]">Product Details</h2>
            <div className="grid grid-cols-2 gap-x-10 gap-y-4">
              {[
                ["Category", product.category],
                ["Unit of Measure", product.unitOfMeasure],
                ["Unit Cost", formatCurrency(product.unitCost)],
                ["Selling Price", formatCurrency(product.sellingPrice)],
                ["Reorder Point", String(product.reorderPoint)],
                ["Barcode", product.barcode ?? "—"],
                ["Created", formatDate(product.createdAt)],
                ["Last Updated", formatDate(product.updatedAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
                    {label}
                  </div>
                  <div className="mt-0.5 text-[13px] text-[#e8eaf0]">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock by Location */}
          <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
            <h2 className="mb-4 text-[14px] font-semibold text-[#e8eaf0]">
              Stock by Location
            </h2>
            {product.inventoryLevels.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-[#555d73]">
                No inventory levels recorded.
              </p>
            ) : (
              <div className="overflow-hidden rounded-[10px] border border-[#2a2f42]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#2a2f42]">
                      {["Zone", "Rack", "Bin", "On Hand", "Reserved", "Available"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {product.inventoryLevels.map((lvl) => (
                      <tr key={lvl.id} className="border-b border-[#2a2f42] last:border-b-0">
                        <td className="px-4 py-3 text-[13px] text-[#e8eaf0]">{lvl.zone}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8]">{lvl.rack}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8]">{lvl.bin}</td>
                        <td className="px-4 py-3 text-[13px] font-semibold text-[#e8eaf0]">{lvl.quantityOnHand.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[13px] text-[#f59e0b]">{lvl.quantityReserved.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[13px] font-semibold text-[#4ade80]">{lvl.quantityAvailable.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: stat cards */}
        <div className="flex flex-col gap-4">
          {[
            { label: "Total On Hand", value: product.totalOnHand.toLocaleString(), color: "#e8eaf0" },
            { label: "Total Available", value: product.totalAvailable.toLocaleString(), color: "#4ade80" },
            {
              label: "Total Value",
              value: formatCurrency(product.totalOnHand * product.unitCost, "USD", true),
              color: "#22d3ee",
            },
            { label: "Storage Locations", value: String(product.inventoryLevels.length), color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
              <div className="text-[12px] font-medium text-[#8b92a8]">{s.label}</div>
              <div
                className="mt-2 font-['JetBrains_Mono',monospace] text-[26px] font-semibold"
                style={{ color: s.color }}
              >
                {s.value}
              </div>
            </div>
          ))}

          {/* Reorder alert */}
          {(status === "low" || status === "critical" || status === "out_of_stock") && (
            <div className="rounded-[16px] border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.06)] p-5">
              <div className="flex items-center gap-2 text-[#f87171]">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span className="text-[13px] font-semibold">Reorder Needed</span>
              </div>
              <p className="mt-2 text-[12px] text-[#8b92a8]">
                Current stock ({product.totalOnHand}) is at or below the reorder point ({product.reorderPoint}).
              </p>
              <button className="mt-3 w-full rounded-[8px] bg-[rgba(248,113,113,0.15)] px-3 py-2 text-[12px] font-medium text-[#f87171] hover:bg-[rgba(248,113,113,0.25)]">
                Create Purchase Order
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {activeModal === "adjust-stock" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => closeModal()}>
          <div className="w-[400px] rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[16px] font-semibold text-[#e8eaf0]">Adjust Stock</span>
              <button onClick={() => closeModal()} className="text-[#8b92a8] hover:text-[#e8eaf0]">✕</button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Location</label>
                <select
                  value={adjustLocationId}
                  onChange={(e) => setAdjustLocationId(e.target.value)}
                  className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]"
                >
                  {product.inventoryLevels.map((lvl) => (
                    <option key={lvl.locationId} value={lvl.locationId}>
                      {lvl.zone} / {lvl.rack} / {lvl.bin} (On hand: {lvl.quantityOnHand})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
                  Adjustment (use negative to remove)
                </label>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                  placeholder="e.g. +50 or -10"
                  className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 font-['JetBrains_Mono',monospace] text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]"
                >
                  <option>Cycle count correction</option>
                  <option>Damaged goods</option>
                  <option>Found stock</option>
                  <option>Supplier return</option>
                  <option>Write-off</option>
                  <option>Manual correction</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => closeModal()} className="rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-4 py-2.5 text-[13px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]">
                  Cancel
                </button>
                <button
                  onClick={handleAdjust}
                  disabled={adjustStock.isPending || !adjustDelta || adjustDelta === "0"}
                  className="rounded-[10px] bg-[#4ade80] px-4 py-2.5 text-[13px] font-semibold text-[#0d0f14] hover:bg-[#22c55e] disabled:opacity-60"
                >
                  {adjustStock.isPending ? "Saving…" : "Apply Adjustment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}