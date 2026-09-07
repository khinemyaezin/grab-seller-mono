import { useSlotProvider } from "@/context";
import { useCallback } from "react";

export function useResetAllSlots(): () => void {
  const { list } = useSlotProvider();

  return useCallback(() => {
    for (const slot of list()) {
      slot.handle?.reset?.();
    }
  }, [list]);
}