import { useParams, useNavigate } from "react-router-dom";
import { useProduct } from "../../hooks/useInventory";
import { formatCurrency, formatDate, getStockStatus } from "../../lib/utils";
import { StockBadge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import { ErrorState } from "../../components/ui/ErrorState";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error, refetch } = useProduct(id ?? "");

  if (isLoading) return <PageSpinner />;
  if (error || !product) return <ErrorState message="Product not found." onRetry={refetch} />;

  const status = getStockStatus(product.totalOnHand, product.reorderPoint);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#2a2f42] bg-[#13161e] text-[#8b92a8] hover:text-[#e8eaf0]">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-semibold text-[#e8eaf0]">{product.name}</h1>
            <StockBadge status={status} />
          </div>
          <p className="mt-0.5 font-['JetBrains_Mono',monospace] text-[13px] text-[#555d73]">{product.sku}</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-[10px] bg-[#4ade80] px-4 py-2 text-[13px] font-semibold text-[#0d0f14] hover:bg-[#22c55e]">
          Edit Product
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Details */}
        <div className="col-span-2 flex flex-col gap-4">
          <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
            <h2 className="mb-4 text-[14px] font-semibold text-[#e8eaf0]">Product Details</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                ["Category", product.category],
                ["Unit of Measure", product.unitOfMeasure],
                ["Unit Cost", formatCurrency(product.unitCost)],
                ["Selling Price", formatCurrency(product.sellingPrice)],
                ["Reorder Point", product.reorderPoint],
                ["Barcode", product.barcode ?? "—"],
                ["Created", formatDate(product.createdAt)],
                ["Last Updated", formatDate(product.updatedAt)],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">{label}</div>
                  <div className="mt-0.5 text-[13px] text-[#e8eaf0]">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Levels */}
          <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
            <h2 className="mb-4 text-[14px] font-semibold text-[#e8eaf0]">Stock by Location</h2>
            <div className="overflow-hidden rounded-[10px] border border-[#2a2f42]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#2a2f42]">
                    {["Zone", "Rack", "Bin", "On Hand", "Reserved", "Available"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {product.inventoryLevels.map((lvl) => (
                    <tr key={lvl.id} className="border-b border-[#2a2f42] last:border-b-0">
                      <td className="px-4 py-3 text-[13px] text-[#e8eaf0]">{lvl.zone}</td>
                      <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8]">{lvl.rack}</td>
                      <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8]">{lvl.bin}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-[#e8eaf0]">{lvl.quantityOnHand}</td>
                      <td className="px-4 py-3 text-[13px] text-[#f59e0b]">{lvl.quantityReserved}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-[#4ade80]">{lvl.quantityAvailable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar stats */}
        <div className="flex flex-col gap-4">
          {[
            { label: "Total On Hand", value: product.totalOnHand.toLocaleString(), color: "#e8eaf0" },
            { label: "Total Available", value: product.totalAvailable.toLocaleString(), color: "#4ade80" },
            { label: "Total Value", value: formatCurrency(product.totalOnHand * product.unitCost, "USD", true), color: "#22d3ee" },
            { label: "Locations", value: String(product.inventoryLevels.length), color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
              <div className="text-[12px] font-medium text-[#8b92a8]">{s.label}</div>
              <div className="mt-2 font-['JetBrains_Mono',monospace] text-[26px] font-semibold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}