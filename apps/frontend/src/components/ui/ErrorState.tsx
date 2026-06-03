interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(248,113,113,0.1)]">
        <svg width="24" height="24" fill="none" stroke="#f87171" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <p className="text-[14px] text-[#8b92a8]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-4 py-2 text-[13px] font-medium text-[#8b92a8] transition-all hover:text-[#e8eaf0]"
        >
          Try Again
        </button>
      )}
    </div>
  );
}