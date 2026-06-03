import { useEffect, useRef, useState } from "react";
import { useBarcodeScan } from "../../hooks/useBarcodeScan";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = "Scan Barcode",
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { isScanning, hasCamera, startScan, stopScan } = useBarcodeScan({
    onScan: (result) => {
      setLastScan(result.text);
      onScan(result.text);
      stopScan();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  useEffect(() => {
    if (isOpen && videoRef.current && hasCamera) {
      setLastScan(null);
      setError(null);
      startScan(videoRef.current);
    }
    return () => {
      if (!isOpen) stopScan();
    };
  }, [isOpen, hasCamera]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="w-[400px] overflow-hidden rounded-[16px] border border-[#2a2f42] bg-[#13161e]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2a2f42] px-5 py-4">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" fill="none" stroke="#4ade80" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M3 9V6a3 3 0 0 1 3-3h3M15 3h3a3 3 0 0 1 3 3v3M21 15v3a3 3 0 0 1-3 3h-3M9 21H6a3 3 0 0 1-3-3v-3"/>
              <rect x="7" y="7" width="3" height="10" rx="1"/><rect x="14" y="7" width="3" height="10" rx="1"/>
            </svg>
            <span className="text-[15px] font-semibold text-[#e8eaf0]">{title}</span>
          </div>
          <button onClick={onClose} className="text-[#8b92a8] hover:text-[#e8eaf0]">✕</button>
        </div>

        {/* Camera viewport */}
        <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
          {hasCamera ? (
            <>
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                autoPlay
                muted
                playsInline
              />
              {/* Scanning overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-48 w-64">
                  {/* Corner markers */}
                  {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((pos, i) => (
                    <div
                      key={i}
                      className={`absolute h-6 w-6 border-[#4ade80] ${pos}`}
                      style={{
                        borderTopWidth: i < 2 ? 3 : 0,
                        borderBottomWidth: i >= 2 ? 3 : 0,
                        borderLeftWidth: i % 2 === 0 ? 3 : 0,
                        borderRightWidth: i % 2 === 1 ? 3 : 0,
                      }}
                    />
                  ))}
                  {/* Scan line */}
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-[#4ade80] opacity-80"
                    style={{ animation: "scanline 2s ease-in-out infinite", top: "50%" }}
                  />
                </div>
              </div>
              {isScanning && (
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="rounded-full bg-black/60 px-3 py-1 text-[12px] text-[#8b92a8]">
                    Point camera at barcode
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <svg width="40" height="40" fill="none" stroke="#555d73" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto mb-3">
                  <circle cx="12" cy="12" r="3.5"/><path d="M3 9V6a3 3 0 0 1 3-3h3M15 3h3a3 3 0 0 1 3 3v3M21 15v3a3 3 0 0 1-3 3h-3M9 21H6a3 3 0 0 1-3-3v-3"/>
                </svg>
                <p className="text-[13px] text-[#555d73]">No camera detected</p>
              </div>
            </div>
          )}
        </div>

        {/* Manual entry fallback */}
        <div className="p-5">
          {lastScan && (
            <div className="mb-3 flex items-center gap-2 rounded-[10px] bg-[rgba(74,222,128,0.1)] px-3 py-2.5">
              <svg width="14" height="14" fill="none" stroke="#4ade80" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              <span className="font-['JetBrains_Mono',monospace] text-[13px] font-medium text-[#4ade80]">{lastScan}</span>
            </div>
          )}
          {error && (
            <p className="mb-3 text-[12px] text-[#f87171]">Camera error: {error}</p>
          )}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
              Or enter barcode manually
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter barcode or SKU…"
                className="flex-1 rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 font-['JetBrains_Mono',monospace] text-[13px] text-[#e8eaf0] outline-none focus:border-[#4ade80]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    onScan(e.currentTarget.value.trim());
                    e.currentTarget.value = "";
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                  if (input.value.trim()) {
                    onScan(input.value.trim());
                    input.value = "";
                  }
                }}
                className="rounded-[10px] bg-[#4ade80] px-4 py-2.5 text-[13px] font-semibold text-[#0d0f14] hover:bg-[#22c55e]"
              >
                Look up
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes scanline { 0%,100%{top:20%} 50%{top:80%} }`}</style>
    </div>
  );
}