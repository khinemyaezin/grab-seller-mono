import { useEffect, useRef } from "react";
import type { SlotValueSource } from "@khinemyaezin/seller-contracts";
import { useDebounce } from "./use-debounce.js";

export function useSlotChangeEmitter<TValue>(
  source: SlotValueSource<TValue>,
  onChange?: (value: TValue) => void,
  debounceMs = 300,
) {
  const sourceRef = useRef(source);
  sourceRef.current = source;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const { debounceFn } = useDebounce(() => {
    onChangeRef.current?.(sourceRef.current.getValues());
  }, debounceMs);

  useEffect(() => {
    return source.subscribe((name) => {
      if (name) debounceFn();
    });
  }, [source, debounceFn]);
}
