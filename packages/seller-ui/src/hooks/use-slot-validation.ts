import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSlotProvider, type RegisteredSlot } from "@/context/slot-provider";
import type {
  SlotValidateResult,
  SlotValidationErrors,
} from "@khinemyaezin/seller-contracts";

export type { SlotValidateResult, SlotValidationErrors };

export async function requestValidate(
  slot: RegisteredSlot,
): Promise<SlotValidateResult> {
  if (!slot.handle) {
    return { groupId: slot.groupId, slotId: slot.slotId, valid: false };
  }
  const result = await slot.handle.validate();
  return { groupId: slot.groupId, slotId: slot.slotId, ...result };
}

export function useValidateAllSlots(): {
  validate: () => Promise<SlotValidateResult[]>;
  isValidating: boolean;
  results: SlotValidateResult[];
  errors: SlotValidationErrors;
} {
  const { list } = useSlotProvider();
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<SlotValidateResult[]>([]);
  const inFlightRef = useRef<Promise<SlotValidateResult[]> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const validate = useCallback((): Promise<SlotValidateResult[]> => {
    if (inFlightRef.current) return inFlightRef.current;

    const pending = (async () => {
      setIsValidating(true);
      try {
        const next = await Promise.all(list().map(requestValidate));
        if (mountedRef.current) setResults(next);
        return next;
      } finally {
        inFlightRef.current = null;
        if (mountedRef.current) setIsValidating(false);
      }
    })();

    inFlightRef.current = pending;
    return pending;
  }, [list]);

  const errors = useMemo<SlotValidationErrors>(() => {
    const map: SlotValidationErrors = {};
    for (const result of results) {
      if (!result.valid && result.errors) map[result.groupId] = result.errors;
    }
    return map;
  }, [results]);

  return { validate, isValidating, results, errors };
}
