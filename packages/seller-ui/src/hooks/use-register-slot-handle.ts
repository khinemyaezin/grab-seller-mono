import { useLayoutEffect, type RefObject } from "react";
import {
  adaptWidgetValidate,
  type SlotHandle,
  type SlotWidgetHandle,
} from "@khinemyaezin/seller-contracts";

export function useRegisterSlotHandle<TValue>(
  ref: RefObject<SlotWidgetHandle<TValue> | null>,
  registerHandle?: (handle: SlotHandle<TValue>) => void | (() => void),
) {
  useLayoutEffect(() => {
    if (!registerHandle) return;
    return registerHandle({
      validate: (signal) => adaptWidgetValidate(ref.current?.validate(signal)),
      getValues: () => ref.current!.getValues(),
      reset: () => ref.current?.reset?.(),
      project: () => ref.current?.project?.() ?? [],
    });
  }, [ref, registerHandle]);
}
