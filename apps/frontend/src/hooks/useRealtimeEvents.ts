import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { useUIStore } from "../store/uiStore";
import { QUERY_KEYS } from "../lib/constants";
import { API_BASE_URL } from "../lib/constants";

interface SseEvent {
  type: string;
  payload: unknown;
  timestamp: string;
}

export function useRealtimeEvents() {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    function connect() {
      if (esRef.current) {
        esRef.current.close();
      }

      const url = `${API_BASE_URL}/events?token=${token}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.addEventListener("ping", () => {
        // Keep-alive — no action needed
      });

      es.addEventListener("low_stock_alert", (e: MessageEvent) => {
        const data: SseEvent = JSON.parse(e.data);
        const items = (data.payload as { items: Array<{ sku: string; name: string; qty: number }> }).items;
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LOW_STOCK });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
        items.forEach((item) => {
          addToast("warning", `⚡ Low stock: ${item.name} (${item.sku}) — ${item.qty} units remaining`);
        });
      });

      es.addEventListener("order_update", (e: MessageEvent) => {
        const data: SseEvent = JSON.parse(e.data);
        const { soNumber, status } = data.payload as { soNumber: string; status: string };
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SALES_ORDERS });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_ACTIVITY });
        addToast("info", `Order ${soNumber} status updated to ${status}`);
      });

      es.addEventListener("transfer_update", (e: MessageEvent) => {
        const data: SseEvent = JSON.parse(e.data);
        const { transferNumber, status } = data.payload as { transferNumber: string; status: string };
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSFERS });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVENTORY_LEVELS });
        addToast("success", `Transfer ${transferNumber} — ${status}`);
      });

      es.onerror = () => {
        es.close();
        esRef.current = null;
        reconnectTimer.current = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [isAuthenticated, token, queryClient, addToast]);
}