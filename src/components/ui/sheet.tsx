import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  full = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45" />
        <DialogPrimitive.Content
          aria-describedby={description ? undefined : undefined}
          className={cn(
            "sheet-rise fixed z-50 flex flex-col bg-card text-card-foreground shadow-xl outline-none",
            full
              ? "inset-0 h-dvh max-h-dvh"
              : "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:pb-4",
          )}
        >
          <div className="flex items-start justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2 md:pt-4">
            <div>
              <DialogPrimitive.Title className="text-lg font-semibold tracking-tight">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              className="grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="關閉"
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>
          <div className={cn("min-h-0 flex-1 overflow-y-auto px-4 pb-4", full && "pb-[max(1rem,env(safe-area-inset-bottom))]")}>
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
