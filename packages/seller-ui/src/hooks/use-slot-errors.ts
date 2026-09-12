import { useMemo, useSyncExternalStore } from "react";
import type { ExtensionFieldErrors } from "@khinemyaezin/seller-contracts";
import { slotErrorKey } from "@khinemyaezin/seller-contracts";
import { useSlotProvider } from "@/context/slot-provider";
import { collectSlotFieldErrors } from "./use-slot-validation";

export function useSlotErrors(groupId: string): ExtensionFieldErrors {
  const { subscribeResults, getResults } = useSlotProvider();
  const results = useSyncExternalStore(subscribeResults, getResults);
  return useMemo(() => {
    const all = collectSlotFieldErrors(results);
    const merged: ExtensionFieldErrors = {};
    for (const [key, errors] of Object.entries(all)) {
      if (key === groupId || key.startsWith(`${groupId}::`)) {
        Object.assign(merged, errors);
      }
    }
    return merged;
  }, [groupId, results]);
}

export function useSlotErrorsFor(groupId: string, slotId: string): ExtensionFieldErrors {
  const { subscribeResults, getResults } = useSlotProvider();
  const results = useSyncExternalStore(subscribeResults, getResults);
  return useMemo(() => {
    const all = collectSlotFieldErrors(results);
    return all[slotErrorKey(groupId, slotId)] ?? {};
  }, [groupId, results, slotId]);
}
