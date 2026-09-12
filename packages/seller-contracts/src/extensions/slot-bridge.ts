import type { ExtensionFieldErrors } from "../events/core.js";

export type SlotPresentationVariant = "full" | "inline";

export type SlotDeclaration = {
  groupId: string;
  slotId: string;
  optional?: boolean;
};

export type SlotContribution = {
  slice: string;
  append: unknown[];
};

export type SlotHandle<TValue = unknown, TErrors = ExtensionFieldErrors> = {
  validate: (
    signal?: AbortSignal,
  ) => Promise<{ valid: boolean; value?: TValue; errors?: TErrors }>;
  getValues: () => TValue;
  reset?: () => void;
  project?: () => SlotContribution[];
};

export type WidgetValidateResult<TValue> = {
  value?: TValue;
  errors?: Record<string, string>;
};

export type SlotWidgetHandle<TValue> = {
  validate: (signal?: AbortSignal) => Promise<WidgetValidateResult<TValue>>;
  getValues: () => TValue;
  reset?: () => void;
  project?: () => SlotContribution[];
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
