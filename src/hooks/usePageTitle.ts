import { useEffect } from "react";

export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `鍛記 · ${title}` : "鍛記";
  }, [title]);
}
