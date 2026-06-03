import { useLocation } from "react-router-dom";
import { useState } from "react";
import { useUIStore } from "../../store/uiStore";
import { useLogout } from "../../hooks/useAuth";
import { useDashboardStats } from "../../hooks/useInventory";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/inventory": "Inventory",
  "/inbound": "Inbound — Receiving",
  "/outbound": "Outbound — Shipping",
  "/transfers": "Stock Transfers",
  "/warehouse": "Warehouse Map",
  "/reports": "Reports & Analytics",
  "/settings": "Settings",
};

const NOTIFICATIONS = [
  { id: "1", message: "⚠ Low stock alert: SKU-4821 has only 12 units remaining", ts: "2 min ago", unread: true },
  { id: "2", message: "📦 PO-2024-089 has been received and logged", ts: "14 min ago", unread: true },
  { id: "3", message: "🚚 SO-2024-441 dispatched via FedEx — tracking: FX88291", ts: "1 hr ago", unread: true },
  { id: "4", message: "Transfer TR-0082 completed: Zone A → Zone C", ts: "3 hr ago", unread: false },
  { id: "5", message: "New user added: james.chen@company.com (Operator)", ts: "Yesterday", unread: false },
];

export default function Topbar() {
  const location = useLocation();
  const { toggleSidebar, notifPanelOpen, toggleNotifPanel } = useUIStore();
  const logout = useLogout();
  const { data: stats } = useDashboardStats();
  const [search, setSearch] = useState("");

  const title = PAGE_TITLES[location.pathname] ?? "WarehouseOS";
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <div className="flex items-center gap-4 border-b border-[#2a2f42] bg-[#13161e] px-6 py-3">
      <div className="flex-1 text-[18px] font-semibold text-[#e8eaf0]">{title}</div>

      {/* Search */}
      <div className="flex w-[260px] items-center gap-2 rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3.5 py-2">
        <svg width="14" height="14" fill="none" stroke="#555d73" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search products, orders, zones…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent font-[inherit] text-[13px] text-[#e8eaf0] outline-none placeholder:text-[#555d73]"
        />
      </div>

      {/* Actions */}
      <div className="relative flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {/* Notifications */}
        <button
          onClick={toggleNotifPanel}
          className="relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] text-[#8b92a8] transition-all hover:border-[#353b52] hover:text-[#e8eaf0]"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#f87171]" />
          )}
        </button>

        {/* Notif panel */}
        {notifPanelOpen && (
          <div className="absolute right-0 top-12 z-50 w-[300px] overflow-hidden rounded-[16px] border border-[#2a2f42] bg-[#13161e] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a2f42] px-4 py-3">
              <span className="text-[12px] font-semibold text-[#e8eaf0]">Notifications</span>
              <span className="cursor-pointer text-[12px] font-medium text-[#4ade80]">Mark all read</span>
            </div>
            {NOTIFICATIONS.map((n) => (
              <div
                key={n.id}
                className={`cursor-pointer border-b border-[#2a2f42] px-4 py-3 last:border-b-0 hover:bg-[#1a1e28] ${n.unread ? "bg-[rgba(74,222,128,0.03)]" : ""}`}
              >
                <div className="text-[12px] leading-[1.4] text-[#e8eaf0]">{n.message}</div>
                <div className="mt-1 text-[10px] text-[#555d73]">{n.ts}</div>
              </div>
            ))}
          </div>
        )}

        {/* Sidebar toggle */}
        <button
          onClick={toggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] text-[#8b92a8] transition-all hover:border-[#353b52] hover:text-[#e8eaf0]"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* Logout */}
        <button
          onClick={() => logout.mutate()}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] text-[#8b92a8] transition-all hover:border-[#353b52] hover:text-[#f87171]"
          title="Log out"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  );
}