import { ExtensionSlotContract } from "./types";

export const PRODUCT_EXTENSION_SLOTS = {
  CREATE_PRICING: "product.create.pricing",
  CREATE_PRICING_INLINE: "product.create.pricing.inline",
  CREATE_INVENTORY: "product.create.inventory",
  EDIT_PRICING: "product.edit.pricing",
  EDIT_INVENTORY: "product.edit.inventory",
} as const;

export type ProductExtensionSlotName =
  (typeof PRODUCT_EXTENSION_SLOTS)[keyof typeof PRODUCT_EXTENSION_SLOTS];