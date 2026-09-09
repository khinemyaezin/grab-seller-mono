import type { ExtensionFieldErrors } from "../events/core.js";

export type SlotHandle<TValue = unknown, TErrors = ExtensionFieldErrors> = {
  validate: () => Promise<{ valid: boolean; value?: TValue; errors?: TErrors }>;
  getValues: () => TValue;
  reset?: () => void;
};

export type WidgetValidateResult<TValue> = {
  value?: TValue;
  errors?: Record<string, string>;
};

export type SlotWidgetHandle<TValue> = {
  validate: () => Promise<WidgetValidateResult<TValue>>;
  getValues: () => TValue;
  reset?: () => void;
};

export type SlotValueSource<TValue> = {
  getValues: () => TValue;
  subscribe: (onFieldChange: (name?: string) => void) => () => void;
};

export async function adaptWidgetValidate<TValue>(
  result: Promise<WidgetValidateResult<TValue>> | undefined,
): Promise<{ valid: boolean; value?: TValue; errors?: Record<string, string> }> {
  if (!result) return { valid: false };
  const next = await result;
  if (next.errors) {
    return { valid: false, errors: next.errors };
  }
  return { valid: true, value: next.value };
}
