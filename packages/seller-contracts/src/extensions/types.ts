import type { SellerPlatform } from "../auth.js";

export type ExtensionSlotContract = {
  id: string;
  payloadSchema?: Record<string, unknown>;
};

export type ExtensionEntryLink = {
  href: string;
  templated?: boolean;
};

export type ExtensionMountProps = {
  instanceId: string;
  slotId?: string;
  context?: Record<string, unknown>;
  platform?: SellerPlatform;
  entryLink?: ExtensionEntryLink;
};
