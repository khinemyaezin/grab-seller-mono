import type { SellerPlatform } from "./auth.js";

export const PRODUCT_EXTENSION_SLOTS = {
  CREATE_PRICING: "product.create.pricing",
  CREATE_INVENTORY: "product.create.inventory",
  EDIT_PRICING: "product.edit.pricing",
  EDIT_INVENTORY: "product.edit.inventory",
} as const;

export type ProductExtensionSlotName =
  (typeof PRODUCT_EXTENSION_SLOTS)[keyof typeof PRODUCT_EXTENSION_SLOTS];

export type ProductExtensionEntryLink = {
  href: string;
  templated?: boolean;
};

export type ProductEditCommerceSlotProps = {
  productId: string;
  variantId: string;
  sku: string;
  entryLink: ProductExtensionEntryLink;
  platform?: SellerPlatform;
  onSaved?: () => void;
  onError?: (error: unknown) => void;
};

export type ProductEditPricingSlotProps = ProductEditCommerceSlotProps;
export type ProductEditInventorySlotProps = ProductEditCommerceSlotProps;
