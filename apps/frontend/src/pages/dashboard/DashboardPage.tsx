import { useRef, useEffect } from "react";
import {
  useDashboardStats,
  useStockTrend,
  useRecentActivity,
  useTopProducts,
  useCategoryDistribution,
} from "../../hooks/useInventory";
import { formatCurrency, formatNumber, formatRelative } from "../../lib/utils";
import { PageSpinner } from "../../components/ui/Spinner";
import { ErrorState } from "../../components/ui/ErrorState";
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, ResponsiveContainer, Legend,
} from "recharts";

const ACTIVITY_COLORS: Record<string, string> = {
  received: "#4ade80",
  shipped: "#22d3ee",
  alert: "#f59e0b",
  transfer: "#f472b6",
  cycle_count: "#8b92a8",
};

const PIE_COLORS = ["#22d3ee", "#4ade80", "#f59e0b", "#f472b6", "#555d73"];

function KpiCard({
  label,
  value,
  delta,
  deltaLabel,
  positive,
  accentColor,
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaLabel?: string;
  positive?: boolean;
  accentColor: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-[#8b92a8]">{label}</span>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-[10px]"
          style={{ background: `${accentColor}1a` }}
        >
          {icon}
        </div>
      </div>
      <div className="font-['JetBrains_Mono',monospace] text-[28px] font-semibold leading-none text-[#e8eaf0]">
        {value}
      </div>
      {deltaLabel && (
        <div
          className={`flex items-center gap-1 text-[12px] font-medium ${positive ? "text-[#4ade80]" : "text-[#f87171]"}`}
        >
          {positive ? (
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>
          ) : (
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          )}
          {deltaLabel}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useDashboardStats();
  const { data: trend } = useStockTrend(30);
  const { data: activity } = useRecentActivity(8);
  const { data: topProducts } = useTopProducts(5);
  const { data: categories } = useCategoryDistribution();

  if (statsLoading) return <PageSpinner />;
  if (statsError) return <ErrorState message="Failed to load dashboard data." onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-5">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total SKUs"
          value={formatNumber(stats?.totalSkus ?? 0)}
          deltaLabel={`+${stats?.totalSkusDelta ?? 0} this month`}
          positive
          accentColor="#4ade80"
          icon={
            <svg width="18" height="18" fill="none" stroke="#4ade80" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          }
        />
        <KpiCard
          label="Inventory Value"
          value={formatCurrency(stats?.inventoryValue ?? 0, "USD", true)}
          deltaLabel={`+${formatCurrency(stats?.inventoryValueDelta ?? 0, "USD", true)} vs last month`}
          positive
          accentColor="#22d3ee"
          icon={
            <svg width="18" height="18" fill="none" stroke="#22d3ee" strokeWidth="1.8" viewBox="0 0 24 24">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          }
        />
        <KpiCard
          label="Pending Orders"
          value={String(stats?.pendingOrders ?? 0)}
          deltaLabel={`+${stats?.pendingOrdersDelta ?? 0} since yesterday`}
          positive={false}
          accentColor="#f59e0b"
          icon={
            <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="1.8" viewBox="0 0 24 24">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          }
        />
        <KpiCard
          label="Low Stock Alerts"
          value={String(stats?.lowStockCount ?? 0)}
          deltaLabel={`Critical: ${stats?.criticalCount ?? 0} items`}
          positive={false}
          accentColor="#f87171"
          icon={
            <svg width="18" height="18" fill="none" stroke="#f87171" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Trend */}
        <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#e8eaf0]">
              Stock Movement — 30 Days
            </span>
            <div className="flex gap-4 text-[11px] text-[#8b92a8]">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[#4ade80]" />Received
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[#22d3ee]" />Shipped
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend ?? []}>
              <CartesianGrid stroke="#1a1e28" strokeDasharray="0" />
              <XAxis dataKey="date" tick={{ fill: "#555d73", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#555d73", fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#1a1e28", border: "1px solid #2a2f42", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="received" stroke="#4ade80" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="shipped" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Categories */}
        <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#e8eaf0]">Category Distribution</span>
            <span className="rounded-full bg-[rgba(74,222,128,0.12)] px-2.5 py-0.5 text-[11px] font-semibold text-[#4ade80]">4 zones</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="h-[160px] w-[160px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories ?? []} dataKey="percentage" nameKey="category" cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3}>
                    {(categories ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-1 flex-col gap-0">
              {(categories ?? []).map((cat, i) => (
                <div key={cat.category} className="flex items-center gap-3 border-b border-[#2a2f42] py-2.5 last:border-b-0">
                  <span className="flex-1 text-[13px] text-[#e8eaf0]">{cat.category}</span>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#232839]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${cat.percentage}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                  </div>
                  <span className="w-10 text-right font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8]">
                    {cat.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Activity */}
        <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#e8eaf0]">Recent Activity</span>
            <button className="rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-1.5 text-[12px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]">
              View all
            </button>
          </div>
          <div className="flex flex-col">
            {(activity ?? []).map((item) => (
              <div key={item.id} className="flex gap-3 border-b border-[#2a2f42] py-3 last:border-b-0">
                <div
                  className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ background: ACTIVITY_COLORS[item.type] ?? "#555d73" }}
                />
                <div>
                  <p className="text-[13px] leading-[1.5] text-[#e8eaf0]">{item.message}</p>
                  <p className="mt-0.5 text-[11px] text-[#555d73]">
                    {formatRelative(item.createdAt)}
                    {item.location && ` · ${item.location}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#e8eaf0]">Top Moving Products</span>
            <button className="rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-1.5 text-[12px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]">
              Export
            </button>
          </div>
          <div className="flex flex-col">
            {(topProducts ?? []).map((p) => (
              <div key={p.productId} className="flex items-center gap-3 border-b border-[#2a2f42] py-2.5 last:border-b-0">
                <div className="flex-1 overflow-hidden">
                  <span className="mr-2 rounded bg-[#232839] px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] text-[#8b92a8]">
                    {p.sku}
                  </span>
                  <span className="text-[13px] text-[#8b92a8]">{p.name}</span>
                </div>
                <div className="flex h-10 items-end gap-0.5">
                  {p.sparkData.map((v, i) => (
                    <div
                      key={i}
                      className="w-1 min-w-[4px] rounded-t-sm bg-[#4ade80] opacity-70"
                      style={{ height: `${v}%` }}
                    />
                  ))}
                </div>
                <span className="w-12 text-right font-['JetBrains_Mono',monospace] text-[12px] font-medium text-[#4ade80]">
                  {formatNumber(p.unitsMoved, true)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}