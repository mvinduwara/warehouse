import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usersService } from "../../services/users.service";
import { QUERY_KEYS } from "../../lib/constants";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { addToast } = useUIStore();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  const { data: users } = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: usersService.getUsers,
  });

  const { data: apiKeyData } = useQuery({
    queryKey: ["api-key"],
    queryFn: usersService.getApiKey,
    enabled: user?.role === "admin",
  });

  const regenerateKey = useMutation({
    mutationFn: usersService.regenerateApiKey,
    onSuccess: () => addToast("success", "API key regenerated successfully."),
  });

  const testWebhook = useMutation({
    mutationFn: usersService.testWebhook,
    onSuccess: () => addToast("success", "Webhook test sent successfully."),
    onError: () => addToast("error", "Webhook test failed."),
  });

  const ROLE_BADGE: Record<string, string> = {
    admin: "bg-[rgba(74,222,128,0.12)] text-[#4ade80]",
    manager: "bg-[rgba(139,92,246,0.12)] text-[#a78bfa]",
    operator: "bg-[rgba(34,211,238,0.12)] text-[#22d3ee]",
    viewer: "bg-[rgba(245,158,11,0.12)] text-[#f59e0b]",
  };

  return (
    <div className="grid grid-cols-2 gap-5">
      <div className="flex flex-col gap-4">
        {/* Warehouse Config */}
        <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
          <div className="mb-4 text-[14px] font-semibold text-[#e8eaf0]">Warehouse Configuration</div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Warehouse Name</label>
              <input defaultValue="Main Distribution Center — LK01" className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Currency</label>
                <select className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none">
                  <option>USD ($)</option><option>EUR (€)</option><option>LKR (₨)</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Weight Unit</label>
                <select className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none">
                  <option>Kilograms (kg)</option><option>Pounds (lb)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Low Stock Threshold (%)</label>
              <input type="number" defaultValue={20} className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]" />
            </div>
            <button onClick={() => addToast("success", "Settings saved.")} className="self-start rounded-[10px] bg-[#4ade80] px-4 py-2.5 text-[13px] font-semibold text-[#0d0f14] hover:bg-[#22c55e]">
              Save Changes
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
          <div className="mb-4 text-[14px] font-semibold text-[#e8eaf0]">Notification Preferences</div>
          <div className="flex flex-col gap-4">
            {[
              { label: "Low stock alerts", on: true },
              { label: "PO arrival reminders", on: true },
              { label: "Daily summary email", on: false },
              { label: "Transfer confirmations", on: true },
            ].map((pref) => (
              <div key={pref.label} className="flex items-center justify-between">
                <span className="text-[13px] text-[#e8eaf0]">{pref.label}</span>
                <div
                  className="relative h-5 w-9 cursor-pointer rounded-full transition-colors"
                  style={{ background: pref.on ? "#4ade80" : "#232839", border: pref.on ? "none" : "1px solid #2a2f42" }}
                >
                  <div
                    className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                    style={{ left: pref.on ? "calc(100% - 18px)" : "2px" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Users */}
        <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
          <div className="mb-4 text-[14px] font-semibold text-[#e8eaf0]">Users & Roles</div>
          <div className="flex flex-col gap-2">
            {(users ?? []).map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-[10px] bg-[#1a1e28] px-3 py-2.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#22d3ee] text-[11px] font-semibold text-white">
                  {u.avatarInitials}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="truncate text-[13px] font-medium text-[#e8eaf0]">{u.name}</div>
                  <div className="truncate text-[11px] text-[#555d73]">{u.email}</div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${ROLE_BADGE[u.role] ?? ROLE_BADGE.viewer}`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
          <button className="mt-3 rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2 text-[12px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]">
            + Invite User
          </button>
        </div>

        {/* API & Webhooks */}
        <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
          <div className="mb-4 text-[14px] font-semibold text-[#e8eaf0]">Integration & API</div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">API Key</label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? "text" : "password"}
                  readOnly
                  value={apiKeyData?.key ?? "wms_live_sk_xxxxxxxxxxxxxx"}
                  className="flex-1 rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 font-['JetBrains_Mono',monospace] text-[12px] text-[#8b92a8] outline-none"
                />
                <button onClick={() => setShowApiKey((v) => !v)} className="rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2 text-[12px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]">
                  {showApiKey ? "Hide" : "Show"}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apiKeyData?.key ?? "");
                    addToast("success", "API key copied to clipboard.");
                  }}
                  className="rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2 text-[12px] font-medium text-[#8b92a8] hover:text-[#e8eaf0]"
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">Webhook URL</label>
              <input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-app.com/webhook"
                className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => testWebhook.mutate()} disabled={!webhookUrl || testWebhook.isPending} className="rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2 text-[12px] font-medium text-[#8b92a8] hover:text-[#e8eaf0] disabled:opacity-40">
                Test Webhook
              </button>
              <button onClick={() => regenerateKey.mutate()} disabled={regenerateKey.isPending} className="rounded-[10px] border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.1)] px-3 py-2 text-[12px] font-medium text-[#f87171] hover:bg-[rgba(248,113,113,0.2)] disabled:opacity-40">
                Regenerate Key
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}