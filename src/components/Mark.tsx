import { cn } from "@/lib/cn";

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <rect x="1" y="12" width="5" height="8" rx="1.2" fill="currentColor" />
      <rect x="6.5" y="9" width="3.5" height="14" rx="1.2" fill="currentColor" />
      <rect x="10" y="14.5" width="12" height="3" rx="1.2" fill="currentColor" />
      <rect x="22" y="9" width="3.5" height="14" rx="1.2" fill="currentColor" />
      <rect x="26" y="12" width="5" height="8" rx="1.2" fill="currentColor" />
    </svg>
  );
}
