import { useState } from "react";
import {
  useReportSummary,
  useMovementReport,
  useAgingReport,
  useSupplierPerformance,
} from "../../hooks/useReports";
import { formatCurrency } from "../../lib/utils";
import { PageSpinner } from "../../components/ui/Spinner";
import { ErrorState } from "../../components/ui/ErrorState";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { API_BASE_URL } from "../../lib/constants";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";

type Period = "6m" | "1y" | "ytd";

const PERIOD_LABELS: Record<Period, string> = {
  "6m": "Last 6 months",
  "1y": "Last year",
  ytd: "Year to date",
};

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("6m");
  const [exporting, setExporting] = useState(false);
  const token = useAuthStore((s) => s.token);
  const { addToast } = useUIStore();

  const { data: summary, isLoading, error, refetch } = useReportSummary();
  const { data: movement } = useMovementReport(period);
  const { data: aging } = useAgingReport();
  const { data: suppliers } = useSupplierPerformance();

  const handleExport = async (type: "inventory" | "aging") => {
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reports/export?type=${type}&format=pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("success", `${type} report downloaded.`);
    } catch {
      addToast("error", "Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) return <PageSpinner />;
  if (error) return <ErrorState message="Failed to load reports." onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-5">

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Inventory Turnover",
            value: `${summary?.inventoryTurnover ?? 0}x`,
            sub: `vs ${summary?.inventoryTurnoverDelta ?? 0}x last quarter`,
            color: "#4ade80",
          },
          {
            label: "Order Fill Rate",
            value: `${summary?.orderFillRate ?? 0}%`,
            sub: "Target: 95%",
            color: "#22d3ee",
          },
          {
            label: "Avg Lead Time",
            value: `${summary?.avgLeadTimeDays ?? 0}d`,
            sub: `${(summary?.avgLeadTimeDelta ?? 0) >= 0 ? "+" : ""}${summary?.avgLeadTimeDelta ?? 0}d change`,
            color: "#f59e0b",
          },
          {
            label: "Shrinkage Rate",
            value: `${summary?.shrinkageRate ?? 0}%`,
            sub: `Target: ${summary?.shrinkageTarget ?? 0.5}%`,
            color: (summary?.shrinkageRate ?? 0) > (summary?.shrinkageTarget ?? 0.5) ? "#f87171" : "#4ade80",
          },
        ].map((k) => (
          <div key={k.label} className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
            <div className="text-[12px] font-medium text-[#8b92a8]">{k.label}</div>
            <div
              className="mt-1.5 font-['JetBrains_Mono',monospace] text-[24px] font-semibold"
              style={{ color: k.color }}
            >
              {k.value}
            </div>
            <div className="mt-1 text-[11px] text-[#555d73]">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Movement chart */}
      <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[14px] font-semibold text-[#e8eaf0]">Monthly Stock Movement</span>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-[8px] border px-3 py-1.5 text-[12px] font-medium transition-all ${
                  period === p
                    ? "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ade80]"
                    : "border-[#2a2f42] bg-[#1a1e28] text-[#8b92a8] hover:text-[#e8eaf0]"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
            <button
              onClick={() => handleExport("inventory")}
              disabled={exporting}
              className="rounded-[8px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-1.5 text-[12px] font-medium text-[#8b92a8] hover:text-[#e8eaf0] disabled:opacity-50"
            >
              {exporting ? "Exporting…" : "Export PDF"}
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={movement ?? []} barGap={4}>
            <CartesianGrid stroke="#1a1e28" />
            <XAxis dataKey="month" tick={{ fill: "#555d73", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#555d73", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#1a1e28", border: "1px solid #2a2f42", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#e8eaf0" }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#8b92a8", paddingTop: 8 }}
            />
            <Bar dataKey="received" fill="rgba(74,222,128,0.7)" radius={[4, 4, 0, 0]} name="Received" />
            <Bar dataKey="shipped" fill="rgba(34,211,238,0.5)" radius={[4, 4, 0, 0]} name="Shipped" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">

        {/* Aging inventory */}
        <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#e8eaf0]">Aging Inventory</span>
            <button
              onClick={() => handleExport("aging")}
              disabled={exporting}
              className="rounded-[8px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-1.5 text-[12px] font-medium text-[#8b92a8] hover:text-[#e8eaf0] disabled:opacity-50"
            >
              Export
            </button>
          </div>
          <div className="flex flex-col">
            {(aging ?? []).map((bucket, i) => {
              const colors = ["#4ade80", "#22d3ee", "#f59e0b", "#f87171"];
              return (
                <div key={bucket.label} className="flex items-center gap-4 border-b border-[#2a2f42] py-3 last:border-b-0">
                  <span className="w-24 flex-shrink-0 text-[13px] text-[#e8eaf0]">{bucket.label}</span>
                  <div className="flex-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#232839]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${bucket.percentage}%`, background: colors[i % colors.length] }}
                      />
                    </div>
                  </div>
                  <div className="flex w-28 items-center justify-end gap-2">
                    <span className="font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8]">
                      {formatCurrency(bucket.value, "USD", true)}
                    </span>
                    <span className="w-8 text-right font-['JetBrains_Mono',monospace] text-[11px] text-[#555d73]">
                      {bucket.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
            {(aging ?? []).length === 0 && (
              <p className="py-6 text-center text-[13px] text-[#555d73]">No aging data available.</p>
            )}
          </div>
        </div>

        {/* Supplier performance */}
        <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
          <div className="mb-4 text-[14px] font-semibold text-[#e8eaf0]">Supplier On-Time Rate</div>
          <div className="flex flex-col">
            {(suppliers ?? []).map((s) => (
              <div key={s.supplierId} className="flex items-center gap-4 border-b border-[#2a2f42] py-3 last:border-b-0">
                <span className="flex-1 truncate text-[13px] text-[#e8eaf0]">{s.supplierName}</span>
                <div className="w-32 flex-shrink-0">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#232839]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${s.onTimeRate}%`,
                        background: s.onTimeRate >= 90 ? "#4ade80" : s.onTimeRate >= 80 ? "#f59e0b" : "#f87171",
                      }}
                    />
                  </div>
                </div>
                <span
                  className="w-10 flex-shrink-0 text-right font-['JetBrains_Mono',monospace] text-[13px] font-semibold"
                  style={{
                    color: s.onTimeRate >= 90 ? "#4ade80" : s.onTimeRate >= 80 ? "#f59e0b" : "#f87171",
                  }}
                >
                  {s.onTimeRate}%
                </span>
              </div>
            ))}
            {(suppliers ?? []).length === 0 && (
              <p className="py-6 text-center text-[13px] text-[#555d73]">No supplier data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}