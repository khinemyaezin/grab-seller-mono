import { ExtensionFieldErrors } from "../events";
import type { SlotContribution } from "./slot-bridge.js";

export type ExtensionSlotName = string;

export const SLOT_UNAVAILABLE_ERROR = "_slot";
export const SLOT_UNAVAILABLE_MESSAGE = "Extension slot is unavailable";
export const SLOT_VALIDATE_TIMEOUT_MESSAGE = "Extension slot timed out";

export function slotErrorKey(groupId: string, slotId: string): string {
  return `${groupId}::${slotId}`;
}

export type SlotValidateResult = {
  groupId: string;
  slotId: ExtensionSlotName;
  valid: boolean;
  value?: unknown;
  errors?: ExtensionFieldErrors;
  contributions?: SlotContribution[];
};

export type SlotValidationErrors = Record<string, ExtensionFieldErrors>;

export type SlotEntry<TPayload = unknown> = {
  groupId: string;
  domain: string;
  payload: TPayload;
};
