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
      validate: () => adaptWidgetValidate(ref.current?.validate()),
      getValues: () => ref.current!.getValues(),
      reset: () => ref.current?.reset?.(),
    });
  }, [ref, registerHandle]);
}
