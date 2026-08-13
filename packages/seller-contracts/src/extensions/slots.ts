import { ExtensionFieldErrors } from "../events";

export const PRODUCT_EXTENSION_SLOTS = {
  CREATE_PRICING: "product.create.pricing",
  CREATE_PRICING_INLINE: "product.create.pricing.inline",
  CREATE_INVENTORY: "product.create.inventory",
  CREATE_INVENTORY_INLINE: "product.create.inventory.inline",
  EDIT_PRICING: "product.edit.pricing",
  EDIT_INVENTORY: "product.edit.inventory",
} as const;

export type ProductExtensionSlotName =
  (typeof PRODUCT_EXTENSION_SLOTS)[keyof typeof PRODUCT_EXTENSION_SLOTS];

export type ExtensionSlotName = ProductExtensionSlotName;

export type SlotValidateResult = {
  instanceId: string;
  slotId: ExtensionSlotName;
  valid: boolean;
  value?: unknown;
  errors?: ExtensionFieldErrors;
};

export type SlotValidationErrors = Record<string, ExtensionFieldErrors>;

export type SlotEntry<TPayload = unknown> = {
  instanceId: string;
  domain: string;
  payload: TPayload;
};
