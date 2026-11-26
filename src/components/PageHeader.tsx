import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  action,
}: {
  kicker?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-3 px-4 pt-[max(1.15rem,env(safe-area-inset-top))] pb-3">
      <div className="min-w-0">
        {kicker ? <p className="text-sm text-muted-foreground">{kicker}</p> : null}
        <h1 className="truncate text-[1.7rem] font-semibold leading-tight tracking-tight">{title}</h1>
      </div>
      {action}
    </header>
  );
}
