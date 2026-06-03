import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useProducts,
  useCreateProduct,
  useImportCsv,
} from "../../hooks/useInventory";
import { useUIStore } from "../../store/uiStore";
import { formatCurrency, getStockStatus } from "../../lib/utils";
import { StockBadge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { BarcodeScannerModal } from "../../components/ui/BarcodeScannerModal";
import { CATEGORIES, ZONES_LIST } from "../../lib/constants";

const STATUS_FILTERS = [
  { label: "All Items", value: "" },
  { label: "In Stock", value: "in_stock" },
  { label: "Low Stock", value: "low" },
  { label: "Out of Stock", value: "out_of_stock" },
];

const createSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  barcode: z.string().optional(),
  unitOfMeasure: z.string().min(1, "Unit of measure is required"),
  unitCost: z.number({ coerce: true }).positive("Must be a positive number"),
  sellingPrice: z
    .number({ coerce: true })
    .positive("Must be a positive number"),
  reorderPoint: z.number({ coerce: true }).int().min(0),
  initialQty: z.number({ coerce: true }).int().min(0),
  locationZone: z.string().min(1, "Zone is required"),
});

type CreateForm = z.infer<typeof createSchema>;

export default function InventoryPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [scannerOpen, setScannerOpen] = useState(false);
  const { activeModal, openModal, closeModal, addToast } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error, refetch } = useProducts({
    status,
    category,
    page,
    pageSize: 20,
  });

  // Used only for barcode lookup — fetch all with large page size
  const { data: allProducts } = useProducts({ pageSize: 1000 });

  const createProduct = useCreateProduct();
  const importCsv = useImportCsv();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      unitOfMeasure: "Each (ea)",
      category: "Electronics",
      locationZone: "Zone A",
      reorderPoint: 50,
      initialQty: 0,
    },
  });

  const onSubmit = (form: CreateForm) => {
    createProduct.mutate(form, { onSuccess: () => reset() });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importCsv.mutate(file);
      e.target.value = "";
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    setScannerOpen(false);
    const match = allProducts?.data.find(
      (p) => p.sku === barcode || p.barcode === barcode
    );
    if (match) {
      navigate(`/inventory/${match.id}`);
    } else {
      addToast("warning", `No product found for barcode: ${barcode}`);
    }
  };

  if (isLoading) return <PageSpinner />;
  if (error)
    return (
      <ErrorState message="Failed to load inventory." onRetry={refetch} />
    );

  return (
    <div className="flex flex-col gap-5">

      {/* ── Filters & Actions ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Status filters */}
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
            className={`rounded-[10px] border px-3.5 py-1.5 text-[12px] font-medium transition-all ${
              status === f.value
                ? "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ade80]"
                : "border-[#2a2f42] bg-[#1a1e28] text-[#8b92a8] hover:text-[#e8eaf0]"
            }`}
          >
            {f.label}
          </button>
        ))}

        {/* Category filters */}
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategory(category === cat ? "" : cat);
              setPage(1);
            }}
            className={`rounded-[10px] border px-3.5 py-1.5 text-[12px] font-medium transition-all ${
              category === cat
                ? "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ade80]"
                : "border-[#2a2f42] bg-[#1a1e28] text-[#8b92a8] hover:text-[#e8eaf0]"
            }`}
          >
            {cat}
          </button>
        ))}

        {/* Right-side actions */}
        <div className="ml-auto flex items-center gap-2">

          {/* Barcode scanner */}
          <button
            onClick={() => setScannerOpen(true)}
            className="flex items-center gap-1.5 rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-1.5 text-[12px] font-medium text-[#8b92a8] transition-all hover:border-[rgba(74,222,128,0.3)] hover:text-[#4ade80]"
          >
            <svg
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M3 9V6a3 3 0 0 1 3-3h3M15 3h3a3 3 0 0 1 3 3v3M21 15v3a3 3 0 0 1-3 3h-3M9 21H6a3 3 0 0 1-3-3v-3" />
              <rect x="7" y="7" width="3" height="10" rx="1" />
              <rect x="14" y="7" width="3" height="10" rx="1" />
            </svg>
            Scan
          </button>

          {/* Hidden CSV file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* CSV import button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importCsv.isPending}
            className="flex items-center gap-1.5 rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-1.5 text-[12px] font-medium text-[#8b92a8] transition-all hover:text-[#e8eaf0] disabled:opacity-50"
          >
            {importCsv.isPending ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border border-[#2a2f42] border-t-[#4ade80]" />
                Importing…
              </>
            ) : (
              <>
                <svg
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Import CSV
              </>
            )}
          </button>

          {/* Add product */}
          <button
            onClick={() => openModal("add-product")}
            className="flex items-center gap-1.5 rounded-[10px] bg-[#4ade80] px-3.5 py-1.5 text-[12px] font-semibold text-[#0d0f14] transition-all hover:bg-[#22c55e]"
          >
            <svg
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {/* ── Product Table ──────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-[16px] border border-[#2a2f42]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#2a2f42]">
              {[
                "SKU",
                "Product Name",
                "Category",
                "Location",
                "On Hand",
                "Reorder Pt.",
                "Unit Cost",
                "Status",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.data.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-12 text-center text-[13px] text-[#555d73]"
                >
                  No products match your filters.{" "}
                  {(status || category) && (
                    <button
                      onClick={() => {
                        setStatus("");
                        setCategory("");
                      }}
                      className="text-[#4ade80] hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </td>
              </tr>
            )}

            {data?.data.map((product) => {
              const level = product.inventoryLevels[0];
              const stockStatus = getStockStatus(
                product.totalOnHand,
                product.reorderPoint
              );

              return (
                <tr
                  key={product.id}
                  className="cursor-pointer border-b border-[#2a2f42] transition-colors last:border-b-0 hover:bg-[#1a1e28]"
                  onClick={() => navigate(`/inventory/${product.id}`)}
                >
                  {/* SKU */}
                  <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8]">
                    {product.sku}
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3 text-[13px] font-medium text-[#e8eaf0]">
                    <Link
                      to={`/inventory/${product.id}`}
                      className="hover:text-[#4ade80]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {product.name}
                    </Link>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-[13px] text-[#8b92a8]">
                    {product.category}
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3">
                    {level ? (
                      <span className="rounded bg-[#232839] px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] text-[#8b92a8]">
                        {level.zone} / {level.rack} / {level.bin}
                      </span>
                    ) : (
                      <span className="text-[12px] text-[#555d73]">—</span>
                    )}
                  </td>

                  {/* On Hand */}
                  <td
                    className="px-4 py-3 text-[13px] font-semibold"
                    style={{
                      color:
                        stockStatus === "critical" ||
                        stockStatus === "out_of_stock"
                          ? "#f87171"
                          : "#e8eaf0",
                    }}
                  >
                    {product.totalOnHand.toLocaleString()}
                  </td>

                  {/* Reorder point */}
                  <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-[#555d73]">
                    {product.reorderPoint}
                  </td>

                  {/* Unit cost */}
                  <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8]">
                    {formatCurrency(product.unitCost)}
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3">
                    <StockBadge status={stockStatus} />
                  </td>

                  {/* View button */}
                  <td className="px-4 py-3">
                    <Link
                      to={`/inventory/${product.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-[8px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-1.5 text-[12px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]"
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

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-[12px] text-[#8b92a8]">
          <span>
            Showing {(page - 1) * 20 + 1}–
            {Math.min(page * 20, data.total)} of{" "}
            {data.total.toLocaleString()} items
          </span>
          <div className="flex gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-[8px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-1.5 transition-all hover:text-[#e8eaf0] disabled:opacity-40"
            >
              ← Prev
            </button>

            {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (data.totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= data.totalPages - 2) {
                pageNum = data.totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`rounded-[8px] border px-3 py-1.5 transition-all ${
                    pageNum === page
                      ? "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ade80]"
                      : "border-[#2a2f42] bg-[#1a1e28] hover:text-[#e8eaf0]"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              disabled={page === data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-[8px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-1.5 transition-all hover:text-[#e8eaf0] disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Add Product Modal ──────────────────────────────────────────── */}
      {activeModal === "add-product" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => closeModal()}
        >
          <div
            className="max-h-[85vh] w-[480px] max-w-[90vw] overflow-y-auto rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[16px] font-semibold text-[#e8eaf0]">
                Add New Product
              </span>
              <button
                onClick={() => {
                  closeModal();
                  reset();
                }}
                className="text-[#8b92a8] transition-colors hover:text-[#e8eaf0]"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              {/* Product Name */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
                  Product Name
                </label>
                <input
                  {...register("name")}
                  placeholder="e.g. USB-C Hub 7-in-1"
                  className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 font-[inherit] text-[13px] text-[#e8eaf0] outline-none transition-colors placeholder:text-[#555d73] focus:border-[#4ade80]"
                />
                {errors.name && (
                  <p className="mt-1 text-[11px] text-[#f87171]">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* SKU + Barcode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
                    SKU Code
                  </label>
                  <input
                    {...register("sku")}
                    placeholder="SKU-XXXX"
                    className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 font-[inherit] text-[13px] text-[#e8eaf0] outline-none transition-colors placeholder:text-[#555d73] focus:border-[#4ade80]"
                  />
                  {errors.sku && (
                    <p className="mt-1 text-[11px] text-[#f87171]">
                      {errors.sku.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
                    Barcode
                  </label>
                  <input
                    {...register("barcode")}
                    placeholder="EAN / UPC"
                    className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 font-[inherit] text-[13px] text-[#e8eaf0] outline-none transition-colors placeholder:text-[#555d73] focus:border-[#4ade80]"
                  />
                </div>
              </div>

              {/* Category + UOM */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
                    Category
                  </label>
                  <select
                    {...register("category")}
                    className="w-full appearance-none rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 font-[inherit] text-[13px] text-[#e8eaf0] outline-none transition-colors focus:border-[#4ade80]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-[11px] text-[#f87171]">
                      {errors.category.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
                    Unit of Measure
                  </label>
                  <select
                    {...register("unitOfMeasure")}
                    className="w-full appearance-none rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 font-[inherit] text-[13px] text-[#e8eaf0] outline-none transition-colors focus:border-[#4ade80]"
                  >
                    <option>Each (ea)</option>
                    <option>Box</option>
                    <option>Pallet</option>
                    <option>Kg</option>
                    <option>Litre</option>
                  </select>
                </div>
              </div>

              {/* Unit Cost + Selling Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
                    Unit Cost ($)
                  </label>
                  <input
                    {...register("unitCost")}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 font-[inherit] text-[13px] text-[#e8eaf0] outline-none transition-colors placeholder:text-[#555d73] focus:border-[#4ade80]"
                  />
                  {errors.unitCost && (
                    <p className="mt-1 text-[11px] text-[#f87171]">
                      {errors.unitCost.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
                    Selling Price ($)
                  </label>
                  <input
                    {...register("sellingPrice")}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 font-[inherit] text-[13px] text-[#e8eaf0] outline-none transition-colors placeholder:text-[#555d73] focus:border-[#4ade80]"
                  />
                  {errors.sellingPrice && (
                    <p className="mt-1 text-[11px] text-[#f87171]">
                      {errors.sellingPrice.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Initial Qty + Reorder Point */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
                    Initial Qty
                  </label>
                  <input
                    {...register("initialQty")}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 font-[inherit] text-[13px] text-[#e8eaf0] outline-none transition-colors placeholder:text-[#555d73] focus:border-[#4ade80]"
                  />
                  {errors.initialQty && (
                    <p className="mt-1 text-[11px] text-[#f87171]">
                      {errors.initialQty.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
                    Reorder Point
                  </label>
                  <input
                    {...register("reorderPoint")}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="50"
                    className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 font-[inherit] text-[13px] text-[#e8eaf0] outline-none transition-colors placeholder:text-[#555d73] focus:border-[#4ade80]"
                  />
                  {errors.reorderPoint && (
                    <p className="mt-1 text-[11px] text-[#f87171]">
                      {errors.reorderPoint.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Storage Zone */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
                  Storage Zone
                </label>
                <select
                  {...register("locationZone")}
                  className="w-full appearance-none rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 font-[inherit] text-[13px] text-[#e8eaf0] outline-none transition-colors focus:border-[#4ade80]"
                >
                  {ZONES_LIST.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
                {errors.locationZone && (
                  <p className="mt-1 text-[11px] text-[#f87171]">
                    {errors.locationZone.message}
                  </p>
                )}
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    closeModal();
                    reset();
                  }}
                  className="rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-4 py-2.5 text-[13px] font-medium text-[#8b92a8] transition-all hover:text-[#e8eaf0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProduct.isPending}
                  className="flex items-center gap-2 rounded-[10px] bg-[#4ade80] px-4 py-2.5 text-[13px] font-semibold text-[#0d0f14] transition-all hover:bg-[#22c55e] disabled:opacity-60"
                >
                  {createProduct.isPending ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0d0f14]/30 border-t-[#0d0f14]" />
                      Saving…
                    </>
                  ) : (
                    "Save Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Barcode Scanner Modal ──────────────────────────────────────── */}
      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
        title="Scan Product Barcode"
      />
    </div>
  );
}