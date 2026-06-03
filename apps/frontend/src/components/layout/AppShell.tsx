import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useUIStore } from "../../store/uiStore";
import { useRealtimeEvents } from "../../hooks/useRealtimeEvents";

export default function AppShell() {
  const closeNotifPanel = useUIStore((s) => s.closeNotifPanel);

  useRealtimeEvents();

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#0d0f14]"
      onClick={() => closeNotifPanel()}
    >
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}