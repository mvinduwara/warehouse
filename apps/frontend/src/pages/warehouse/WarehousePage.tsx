import { useZones, useRackMap } from "../../hooks/useWarehouse";
import { PageSpinner } from "../../components/ui/Spinner";
import { ErrorState } from "../../components/ui/ErrorState";

const RACK_COLORS: Record<string, string> = {
  full: "bg-[rgba(248,113,113,0.2)] border-[rgba(248,113,113,0.4)] text-[#f87171]",
  high: "bg-[rgba(245,158,11,0.2)] border-[rgba(245,158,11,0.4)] text-[#f59e0b]",
  mid: "bg-[rgba(34,211,238,0.15)] border-[rgba(34,211,238,0.3)] text-[#22d3ee]",
  low: "bg-[rgba(74,222,128,0.12)] border-[rgba(74,222,128,0.25)] text-[#4ade80]",
  empty: "bg-[#232839] border-[#2a2f42] text-[#555d73]",
};

export default function WarehousePage() {
  const { data: zones, isLoading: zonesLoading, error: zonesError } = useZones();
  const { data: rackMap, isLoading: mapLoading } = useRackMap();

  if (zonesLoading || mapLoading) return <PageSpinner />;
  if (zonesError) return <ErrorState message="Failed to load warehouse data." />;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        {/* Rack Heatmap */}
        <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#e8eaf0]">Rack Occupancy Map</span>
            <div className="flex gap-3 text-[11px]">
              {[
                { label: "Full >90%", color: "rgba(248,113,113,0.4)" },
                { label: "High", color: "rgba(245,158,11,0.4)" },
                { label: "Mid", color: "rgba(34,211,238,0.3)" },
                { label: "Low", color: "rgba(74,222,128,0.25)" },
              ].map((l) => (
                <span key={l.label} className="flex items-center gap-1.5 text-[#8b92a8]">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-8 gap-1.5">
            {(rackMap ?? []).map((cell) => (
              <div
                key={cell.locationId}
                title={`${cell.label}: ${cell.occupancyPercent}% full`}
                className={`aspect-square cursor-pointer rounded-md border text-center transition-transform hover:scale-105 ${RACK_COLORS[cell.status]}`}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
              >
                <div style={{ fontSize: 8, opacity: 0.7 }}>{cell.rack}</div>
                <div style={{ fontSize: 9, fontWeight: 600 }}>
                  {cell.occupancyPercent > 0 ? `${cell.occupancyPercent}%` : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone Capacities */}
        <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-5">
          <div className="mb-4 text-[14px] font-semibold text-[#e8eaf0]">Zone Capacity</div>
          <div className="flex flex-col gap-0">
            {(zones ?? []).map((zone) => (
              <div key={zone.id} className="flex items-center gap-4 border-b border-[#2a2f42] py-3 last:border-b-0">
                <div className="w-36 flex-shrink-0">
                  <div className="text-[13px] text-[#e8eaf0]">{zone.name}</div>
                  <div className="mt-0.5 text-[11px] text-[#555d73]">{zone.category}</div>
                </div>
                <div className="flex-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#232839]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${zone.occupancyPercent}%`,
                        background:
                          zone.occupancyPercent >= 90
                            ? "#f87171"
                            : zone.occupancyPercent >= 75
                            ? "#f59e0b"
                            : "#4ade80",
                      }}
                    />
                  </div>
                </div>
                <span className="w-10 text-right font-['JetBrains_Mono',monospace] text-[12px] font-semibold" style={{ color: zone.occupancyPercent >= 90 ? "#f87171" : zone.occupancyPercent >= 75 ? "#f59e0b" : "#4ade80" }}>
                  {zone.occupancyPercent}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] text-[#8b92a8]">Overall Capacity Used</span>
              <span className="font-['JetBrains_Mono',monospace] text-[13px] font-semibold text-[#4ade80]">
                {zones ? Math.round(zones.reduce((a, z) => a + z.occupancyPercent, 0) / zones.length) : 0}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#232839]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${zones ? Math.round(zones.reduce((a, z) => a + z.occupancyPercent, 0) / zones.length) : 0}%`,
                  background: "linear-gradient(90deg, #4ade80, #22d3ee)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}