export const PRODUCT_EXTENSION_SLOTS = {
  CREATE_PRICING: "product.create.pricing",
  CREATE_INVENTORY: "product.create.inventory",
  EDIT_PRICING: "product.edit.pricing",
  EDIT_INVENTORY: "product.edit.inventory",
} as const;

export type ProductExtensionSlotName =
  (typeof PRODUCT_EXTENSION_SLOTS)[keyof typeof PRODUCT_EXTENSION_SLOTS];

export const PRODUCT_CONTRIBUTION_SLICES = {
  PRICING_LINES: "pricingLines",
  INVENTORY_LINES: "inventoryLines",
} as const;

export type ProductContributionSlice =
  (typeof PRODUCT_CONTRIBUTION_SLICES)[keyof typeof PRODUCT_CONTRIBUTION_SLICES];

export const PRODUCT_SLOT_DOMAINS = {
  PRICING: "pricing",
  PRICING_EDIT: "pricing-edit",
  INVENTORY: "inventory",
  INVENTORY_EDIT: "inventory-edit",
} as const;

export type ProductSlotDomain =
  (typeof PRODUCT_SLOT_DOMAINS)[keyof typeof PRODUCT_SLOT_DOMAINS];

export const PRICING_DOMAIN = PRODUCT_SLOT_DOMAINS.PRICING;
export const PRICING_EDIT_DOMAIN = PRODUCT_SLOT_DOMAINS.PRICING_EDIT;
export const INVENTORY_DOMAIN = PRODUCT_SLOT_DOMAINS.INVENTORY;
export const INVENTORY_EDIT_DOMAIN = PRODUCT_SLOT_DOMAINS.INVENTORY_EDIT;
