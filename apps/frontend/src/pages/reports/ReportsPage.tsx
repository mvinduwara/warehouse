import { useState } from "react";
import { useReportSummary, useMovementReport, useAgingReport, useSupplierPerformance } from "../../hooks/useReports";
import { formatCurrency } from "../../lib/utils";
import { PageSpinner } from "../../components/ui/Spinner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ReportsPage() {
  const [period, setPeriod] = useState<"6m" | "1y" | "ytd">("6m");
  const { data: summary, isLoading } = useReportSummary();
  const { data: movement } = useMovementReport(period);
  const { data: aging } = useAgingReport();
  const { data: suppliers } = useSupplierPerformance();

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-5">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Inventory Turnover", value: `${summary?.inventoryTurnover ?? 0}x`, sub: `vs ${summary?.inventoryTurnoverDelta ?? 0}x last quarter` },
          { label: "Order Fill Rate", value: `${summary?.orderFillRate ?? 0}%`, sub: "Target: 95%" },
          { label: "Avg Lead Time", value: `${summary?.avgLeadTimeDays ?? 0}d`, sub: `${(summary?.avgLeadTimeDelta ?? 0) >= 0 ? "+" : ""}${summary?.avgLeadTimeDelta ?? 0}d change` },
          { label: "Shrinkage Rate", value: `${summary?.shrinkageRate ?? 0}%`, sub: `Target: ${summary?.shrinkageTarget ?? 0.5}%` },
        ].map((k) => (
          <div key={k.label} className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-4">
            <div className="text-[12px] font-medium text-[#8b92a8]">{k.label}</div>
            <div className="mt-1.5 font-['JetBrains_Mono',monospace] text-[22px] font-semibold text-[#e8eaf0]">{k.value}</div>
            <div className="mt-1 text-[12px] text-[#4ade80]">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Movement Chart */}
      <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[14px] font-semibold text-[#e8eaf0]">Monthly Stock Movement</span>
          <div className="flex gap-2">
            {(["6m", "1y", "ytd"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`rounded-[8px] border px-3 py-1.5 text-[12px] font-medium transition-all ${period === p ? "border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ade80]" : "border-[#2a2f42] bg-[#1a1e28] text-[#8b92a8] hover:text-[#e8eaf0]"}`}>
                {p === "6m" ? "Last 6 months" : p === "1y" ? "Last year" : "Year to date"}
              </button>
            ))}
            <button className="rounded-[8px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-1.5 text-[12px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]">
              Export PDF
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={movement ?? []}>
            <CartesianGrid stroke="#1a1e28" strokeDasharray="0" />
            <XAxis dataKey="month" tick={{ fill: "#555d73", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#555d73", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#1a1e28", border: "1px solid #2a2f42", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="received" fill="rgba(74,222,128,0.7)" radius={[4, 4, 0, 0]} name="Received" />
            <Bar dataKey="shipped" fill="rgba(34,211,238,0.5)" radius={[4, 4, 0, 0]} name="Shipped" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Aging */}
        <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
          <div className="mb-4 text-[14px] font-semibold text-[#e8eaf0]">Aging Inventory</div>
          {(aging ?? []).map((bucket, i) => {
            const colors = ["#4ade80", "#22d3ee", "#f59e0b", "#f87171"];
            return (
              <div key={bucket.label} className="flex items-center gap-4 border-b border-[#2a2f42] py-3 last:border-b-0">
                <span className="w-24 flex-shrink-0 text-[13px] text-[#e8eaf0]">{bucket.label}</span>
                <div className="flex-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#232839]">
                    <div className="h-full rounded-full" style={{ width: `${bucket.percentage}%`, background: colors[i % colors.length] }} />
                  </div>
                </div>
                <span className="w-16 text-right font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8]">{formatCurrency(bucket.value, "USD", true)}</span>
              </div>
            );
          })}
        </div>

        {/* Supplier Performance */}
        <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
          <div className="mb-4 text-[14px] font-semibold text-[#e8eaf0]">Supplier On-Time Rate</div>
          {(suppliers ?? []).map((s) => (
            <div key={s.supplierId} className="flex items-center gap-4 border-b border-[#2a2f42] py-3 last:border-b-0">
              <span className="flex-1 truncate text-[13px] text-[#e8eaf0]">{s.supplierName}</span>
              <div className="w-32">
                <div className="h-1.5 overflow-hidden rounded-full bg-[#232839]">
                  <div className="h-full rounded-full" style={{ width: `${s.onTimeRate}%`, background: s.onTimeRate >= 90 ? "#4ade80" : s.onTimeRate >= 80 ? "#f59e0b" : "#f87171" }} />
                </div>
              </div>
              <span className="w-10 text-right font-['JetBrains_Mono',monospace] text-[12px]" style={{ color: s.onTimeRate >= 90 ? "#4ade80" : s.onTimeRate >= 80 ? "#f59e0b" : "#f87171" }}>
                {s.onTimeRate}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}