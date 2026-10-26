import { STATUS_LABEL, WATCH_THRESHOLD, type LessonStatus } from "@/lib/learning";

const STATUS_STYLE: Record<LessonStatus, string> = {
  locked: "bg-zinc-100 text-zinc-600",
  available: "bg-brand-soft text-brand-dark",
  in_progress: "bg-sky-100 text-sky-800",
  quiz_pending: "bg-amber-100 text-amber-800",
  passed: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: LessonStatus }) {
  return <span className={`badge ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}

// Barra de progresso (value de 0 a 1). Com showMark, desenha a marca dos 90% do quiz.
export function ProgressBar({
  value,
  showMark = false,
  className = "",
}: {
  value: number;
  showMark?: boolean;
  className?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className={`relative h-2.5 w-full rounded-full bg-zinc-200 ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all ${pct >= WATCH_THRESHOLD * 100 ? "bg-emerald-500" : "bg-brand"}`}
        style={{ width: `${pct}%` }}
      />
      {showMark && (
        <div
          className="absolute top-[-3px] h-4 w-0.5 rounded bg-slate-500"
          style={{ left: `${WATCH_THRESHOLD * 100}%` }}
          title="90%: libera o quiz"
        />
      )}
    </div>
  );
}

export function LockIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function CheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className} aria-hidden>
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

export function PlayIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
