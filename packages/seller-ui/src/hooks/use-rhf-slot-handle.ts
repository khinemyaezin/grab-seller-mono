import { useImperativeHandle, useMemo, useRef } from "react";
import type { FieldErrors, FieldValues } from "react-hook-form";
import type {
  SlotContribution,
  SlotHandle,
  SlotValueSource,
  SlotWidgetHandle,
} from "@khinemyaezin/seller-contracts";
import { useRegisterSlotHandle } from "./use-register-slot-handle";

function flattenErrors(errors: FieldErrors): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, err] of Object.entries(errors)) {
    if (err && typeof err === "object" && "message" in err && err.message) {
      result[key] = String(err.message);
    }
  }
  return result;
}

export type RhfSlotForm<T extends FieldValues> = {
  trigger: (...args: any[]) => Promise<boolean>;
  getValues: (...args: any[]) => T;
  reset: (...args: any[]) => void;
  formState: { errors: FieldErrors<T> };
  watch: (...args: any[]) => { unsubscribe: () => void };
};

export function useRhfValueSource<T extends FieldValues>(
  form: RhfSlotForm<T>,
): SlotValueSource<T> {
  const formRef = useRef(form);
  formRef.current = form;
  return useMemo(
    () => ({
      getValues: () => formRef.current.getValues(),
      subscribe: (onFieldChange) => {
        const sub = formRef.current.watch((_v: T, info: { name?: string }) =>
          onFieldChange(info.name),
        );
        return () => sub.unsubscribe();
      },
    }),
    [],
  );
}

export type UseRhfSlotHandleOptions<T extends FieldValues> = {
  registerHandle?: (handle: SlotHandle<T>) => void | (() => void);
  getBaseline: () => T;
  onChange?: (value: T) => void;
  project?: (value: T) => SlotContribution[];
};

export function useRhfSlotHandle<T extends FieldValues>(
  form: RhfSlotForm<T>,
  options: UseRhfSlotHandleOptions<T>,
) {
  const { registerHandle, getBaseline, onChange, project } = options;
  const ref = useRef<SlotWidgetHandle<T>>(null);
  const getBaselineRef = useRef(getBaseline);
  getBaselineRef.current = getBaseline;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const projectRef = useRef(project);
  projectRef.current = project;

  useRegisterSlotHandle(ref, registerHandle);

  useImperativeHandle(ref, () => ({
    validate: async () => {
      const isValid = await form.trigger();
      if (isValid) return { value: form.getValues() };
      return { errors: flattenErrors(form.formState.errors) };
    },
    getValues: () => form.getValues(),
    reset: () => {
      const baseline = getBaselineRef.current();
      form.reset(baseline);
      onChangeRef.current?.(baseline);
    },
    project: () => projectRef.current?.(form.getValues()) ?? [],
  }));
}
