import type { ExtensionFieldErrors } from "../events/core.js";

export type SlotHandle<TValue = unknown, TErrors = ExtensionFieldErrors> = {
  validate: () => Promise<{ valid: boolean; value?: TValue; errors?: TErrors }>;
  getValues: () => TValue;
  reset?: () => void;
};
