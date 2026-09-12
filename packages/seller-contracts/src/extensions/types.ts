import type { SellerPlatform } from "../auth.js";
import type { SlotHandle, SlotPresentationVariant } from "./slot-bridge.js";

export type ExtensionSlotContract = {
  id: string;
  payloadSchema?: Record<string, unknown>;
};

export type ExtensionEntryLink = {
  href: string;
  templated?: boolean;
};

export type ExtensionMountProps = {
  groupId: string;
  slotId?: string;
  variant?: SlotPresentationVariant;
  context?: Record<string, unknown>;
  initialValue?: unknown;
  onChange?: (value: unknown) => void;
  registerHandle?: (handle: SlotHandle) => void | (() => void);
  platform?: SellerPlatform;
  entryLink?: ExtensionEntryLink;
};

export type SlotWidgetProps<TContext, TPayload> = {
  groupId: string;
  slotId: string;
  variant?: SlotPresentationVariant;
  context?: TContext;
  initialValue?: TPayload;
  onChange: (value: TPayload) => void;
  registerHandle?: (handle: SlotHandle<TPayload>) => void | (() => void);
};