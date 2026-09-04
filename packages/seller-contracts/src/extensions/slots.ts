import { ExtensionFieldErrors } from "../events";

export const PRODUCT_EXTENSION_SLOTS = {
  CREATE_PRICING: "product.create.pricing",
  CREATE_PRICING_INLINE: "product.create.pricing.inline",
  CREATE_INVENTORY: "product.create.inventory",
  CREATE_INVENTORY_INLINE: "product.create.inventory.inline",
  EDIT_PRICING: "product.edit.pricing",
  EDIT_PRICING_INLINE: "product.edit.pricing.inline",
  EDIT_INVENTORY: "product.edit.inventory",
  EDIT_INVENTORY_INLINE: "product.edit.inventory.inline",
} as const;

export type ProductExtensionSlotName =
  (typeof PRODUCT_EXTENSION_SLOTS)[keyof typeof PRODUCT_EXTENSION_SLOTS];

export type ExtensionSlotName = ProductExtensionSlotName;

export type SlotValidateResult = {
  groupId: string;
  slotId: ExtensionSlotName;
  valid: boolean;
  value?: unknown;
  errors?: ExtensionFieldErrors;
};

export type SlotValidationErrors = Record<string, ExtensionFieldErrors>;

export type SlotEntry<TPayload = unknown> = {
  groupId: string;
  domain: string;
  payload: TPayload;
};
