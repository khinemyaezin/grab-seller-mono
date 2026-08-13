import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RegisteredSlot } from "@/context/slot-provider";
import { usePlatform } from "@/context";
import { useSlotProvider } from "@/context";
import { ExtensionFieldErrors, ExtensionSlotName, PlatformEvents } from "@khinemyaezin/seller-contracts";

const DEFAULT_VALIDATE_TIMEOUT_MS = 3000;

export type SlotValidateResult = {
  instanceId: string;
  slotId: ExtensionSlotName;
  valid: boolean;
  value?: unknown;
  errors?: ExtensionFieldErrors;
};

export type SlotValidationErrors = Record<string, ExtensionFieldErrors>;

function runValidation(
  events: PlatformEvents,
  slots: RegisteredSlot[],
  timeoutMs: number,
): Promise<SlotValidateResult[]> {
  return new Promise((resolve) => {
    if (slots.length === 0) {
      resolve([]);
      return;
    }

    const slotsById = new Map(slots.map((slot) => [slot.instanceId, slot]));
    const results = new Map<string, SlotValidateResult>();
    const timers = new Map<string, number>();
    let settled = 0;

    const settle = (instanceId: string, result: SlotValidateResult) => {
      if (results.has(instanceId)) return;
      results.set(instanceId, result);
      const timer = timers.get(instanceId);
      if (timer) window.clearTimeout(timer);
      timers.delete(instanceId);
      settled += 1;
      if (settled === slots.length) {
        unsubscribe();
        resolve(slots.map((slot) => results.get(slot.instanceId)!));
      }
    };

    const unsubscribe = events.subscribe("extension:validated:v1", (msg) => {
      if (!msg.producerId) return;
      const slot = slotsById.get(msg.instanceId);
      if (!slot) return;
      settle(msg.instanceId, {
        instanceId: msg.instanceId,
        slotId: slot.slotId,
        valid: msg.valid,
        value: msg.payload,
        errors: msg.errors,
      });
    }, { replay: false });

    for (const slot of slots) {
      timers.set(slot.instanceId, window.setTimeout(() => {
        settle(slot.instanceId, {
          instanceId: slot.instanceId,
          slotId: slot.slotId,
          valid: false,
        });
      }, timeoutMs));

      events.emit("extension:validate:v1", {
        producerId: "host",
        instanceId: slot.instanceId,
        slotId: slot.slotId,
      });
    }
  });
}

export function requestValidate(
  events: PlatformEvents,
  slot: RegisteredSlot,
  timeoutMs = DEFAULT_VALIDATE_TIMEOUT_MS,
): Promise<SlotValidateResult> {
  return runValidation(events, [slot], timeoutMs).then(([result]) => result);
}

export function useValidateAllSlots(
  timeoutMs = DEFAULT_VALIDATE_TIMEOUT_MS,
): {
  validate: () => Promise<SlotValidateResult[]>;
  isValidating: boolean;
  results: SlotValidateResult[];
  errors: SlotValidationErrors;
} {
  const platform = usePlatform();
  const { list } = useSlotProvider();
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<SlotValidateResult[]>([]);
  const validatingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const validate = useCallback(async (): Promise<SlotValidateResult[]> => {
    const events = platform?.events;
    if (!events || validatingRef.current) return [];

    validatingRef.current = true;
    setIsValidating(true);

    try {
      const next = await runValidation(events, list(), timeoutMs);
      if (mountedRef.current) setResults(next);
      return next;
    } finally {
      validatingRef.current = false;
      if (mountedRef.current) setIsValidating(false);
    }
  }, [platform, list, timeoutMs]);

  const errors = useMemo<SlotValidationErrors>(() => {
    const map: SlotValidationErrors = {};
    for (const result of results) {
      if (!result.valid && result.errors) map[result.instanceId] = result.errors;
    }
    return map;
  }, [results]);

  return { validate, isValidating, results, errors };
}
