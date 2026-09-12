import type { SlotValidateResult } from "@khinemyaezin/seller-contracts";

export class UnknownSlotSliceError extends Error {
  constructor(public readonly slice: string) {
    super(`Unknown slot contribution slice: ${slice}`);
    this.name = "UnknownSlotSliceError";
  }
}

export function mergeContributions(
  results: SlotValidateResult[],
  allowedSlices: readonly string[],
): Record<string, unknown[]> {
  const allowed = new Set(allowedSlices);
  const merged: Record<string, unknown[]> = {};
  for (const slice of allowedSlices) {
    merged[slice] = [];
  }

  for (const result of results) {
    if (!result.valid || !result.contributions) continue;
    for (const contribution of result.contributions) {
      if (!allowed.has(contribution.slice)) {
        throw new UnknownSlotSliceError(contribution.slice);
      }
      merged[contribution.slice].push(...contribution.append);
    }
  }

  return merged;
}
