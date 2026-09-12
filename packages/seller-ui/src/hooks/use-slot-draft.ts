import { useCallback, useRef, useSyncExternalStore } from "react";
import type { SlotEntry } from "@khinemyaezin/seller-contracts";
import { useSlotProvider } from "@/context/slot-provider";

function fingerprint(entries: ReadonlyMap<string, SlotEntry>): string {
  return JSON.stringify(
    [...entries.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([groupId, entry]) => [groupId, entry.domain, entry.payload]),
  );
}

export function useSlotPayload<TPayload>(groupId: string): TPayload | undefined {
  const store = useSlotProvider();
  const getSnapshot = useCallback(
    () => store.getEntry(groupId)?.payload as TPayload | undefined,
    [store, groupId],
  );
  return useSyncExternalStore(store.subscribe, getSnapshot);
}

export function useSlotDraft<TPayload>(domain: string, groupId: string) {
  const store = useSlotProvider();
  const initialValue = useSlotPayload<TPayload>(groupId);

  const onChange = useCallback(
    (payload: TPayload) => {
      store.setPayload({
        domain,
        groupId,
        payload,
      });
    },
    [store, domain, groupId],
  );

  return { initialValue, onChange };
}

export function collectDomainPayloads<TPayload>(
  entries: ReadonlyMap<string, SlotEntry>,
  domain: string,
): Map<string, TPayload> {
  const byGroup = new Map<string, TPayload>();
  for (const [groupId, entry] of entries) {
    if (entry.domain !== domain) continue;
    byGroup.set(groupId, entry.payload as TPayload);
  }
  return byGroup;
}

export function useIsExtensionDirty(): [boolean, () => void] {
  const store = useSlotProvider();
  const baselineRef = useRef(fingerprint(store.getSnapshot()));

  const getSnapshot = useCallback(() => {
    return fingerprint(store.getSnapshot()) !== baselineRef.current;
  }, [store]);

  const isDirty = useSyncExternalStore(store.subscribe, getSnapshot);

  const resetDirty = useCallback(() => {
    baselineRef.current = fingerprint(store.getSnapshot());
  }, [store]);

  return [isDirty, resetDirty];
}
