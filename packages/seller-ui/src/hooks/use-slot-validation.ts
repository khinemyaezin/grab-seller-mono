import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSlotProvider } from "@/context/slot-provider";
import type {
  SlotDeclaration,
  SlotHandle,
  SlotValidateResult,
  SlotValidationErrors,
} from "@khinemyaezin/seller-contracts";
import {
  SLOT_UNAVAILABLE_ERROR,
  SLOT_UNAVAILABLE_MESSAGE,
  SLOT_VALIDATE_TIMEOUT_MESSAGE,
  slotErrorKey,
} from "@khinemyaezin/seller-contracts";

export type { SlotValidateResult, SlotValidationErrors };

export const DEFAULT_SLOT_VALIDATE_TIMEOUT_MS = 10_000;

export class SlotValidateTimeoutError extends Error {
  constructor() {
    super(SLOT_VALIDATE_TIMEOUT_MESSAGE);
    this.name = "SlotValidateTimeoutError";
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = window.setTimeout(() => {
      reject(new SlotValidateTimeoutError());
    }, timeoutMs);

    const onAbort = () => {
      window.clearTimeout(timer);
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });

    promise.then(
      (value) => {
        window.clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

export async function requestValidate(
  declaration: SlotDeclaration,
  handle: SlotHandle | undefined,
  options?: { timeoutMs?: number; signal?: AbortSignal },
): Promise<SlotValidateResult> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_SLOT_VALIDATE_TIMEOUT_MS;

  if (!handle) {
    if (declaration.optional) {
      return {
        groupId: declaration.groupId,
        slotId: declaration.slotId,
        valid: true,
      };
    }
    return {
      groupId: declaration.groupId,
      slotId: declaration.slotId,
      valid: false,
      errors: { [SLOT_UNAVAILABLE_ERROR]: SLOT_UNAVAILABLE_MESSAGE },
    };
  }

  try {
    const result = await withTimeout(
      handle.validate(options?.signal),
      timeoutMs,
      options?.signal,
    );
    return {
      groupId: declaration.groupId,
      slotId: declaration.slotId,
      ...result,
      contributions: result.valid ? handle.project?.() : undefined,
    };
  } catch (error) {
    if (error instanceof SlotValidateTimeoutError) {
      return {
        groupId: declaration.groupId,
        slotId: declaration.slotId,
        valid: false,
        errors: { [SLOT_UNAVAILABLE_ERROR]: SLOT_VALIDATE_TIMEOUT_MESSAGE },
      };
    }
    throw error;
  }
}

export function collectSlotFieldErrors(
  results: SlotValidateResult[],
): SlotValidationErrors {
  const map: SlotValidationErrors = {};
  for (const result of results) {
    if (result.valid) continue;
    map[slotErrorKey(result.groupId, result.slotId)] = result.errors ?? {
      [SLOT_UNAVAILABLE_ERROR]: SLOT_UNAVAILABLE_MESSAGE,
    };
  }
  return map;
}

export function useValidateAllSlots(options?: {
  timeoutMs?: number;
}): {
  validate: (signal?: AbortSignal) => Promise<SlotValidateResult[]>;
  isValidating: boolean;
  results: SlotValidateResult[];
  errors: SlotValidationErrors;
} {
  const { listDeclarations, getHandle, setResults: publishResults, getResults } =
    useSlotProvider();
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<SlotValidateResult[]>(() => getResults());
  const inFlightRef = useRef<Promise<SlotValidateResult[]> | null>(null);
  const mountedRef = useRef(true);
  const timeoutMs = options?.timeoutMs ?? DEFAULT_SLOT_VALIDATE_TIMEOUT_MS;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const validate = useCallback(
    (signal?: AbortSignal): Promise<SlotValidateResult[]> => {
      if (inFlightRef.current) return inFlightRef.current;

      const pending = (async () => {
        setIsValidating(true);
        try {
          const declarations = listDeclarations();
          const next = await Promise.all(
            declarations.map((declaration) =>
              requestValidate(
                declaration,
                getHandle(declaration.groupId, declaration.slotId),
                { timeoutMs, signal },
              ),
            ),
          );
          if (mountedRef.current) {
            setResults(next);
            publishResults(next);
          }
          return next;
        } finally {
          inFlightRef.current = null;
          if (mountedRef.current) setIsValidating(false);
        }
      })();

      inFlightRef.current = pending;
      return pending;
    },
    [getHandle, listDeclarations, publishResults, timeoutMs],
  );

  const errors = useMemo(() => collectSlotFieldErrors(results), [results]);

  return { validate, isValidating, results, errors };
}
