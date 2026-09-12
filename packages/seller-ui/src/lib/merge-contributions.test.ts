import { describe, expect, it } from "vitest";
import { mergeContributions, UnknownSlotSliceError } from "./merge-contributions";
import type { SlotValidateResult } from "@khinemyaezin/seller-contracts";

const FIXTURE_SLOT = "test.pricing";
const SLICE_A = "slice.a";
const SLICE_B = "slice.b";

describe("mergeContributions", () => {
  it("concatenates append arrays per allowed slice", () => {
    const results: SlotValidateResult[] = [
      {
        groupId: "a",
        slotId: FIXTURE_SLOT,
        valid: true,
        contributions: [
          { slice: SLICE_A, append: [{ sku: "A" }] },
        ],
      },
      {
        groupId: "b",
        slotId: FIXTURE_SLOT,
        valid: true,
        contributions: [
          { slice: SLICE_A, append: [{ sku: "B" }] },
        ],
      },
    ];

    expect(
      mergeContributions(results, [SLICE_A, SLICE_B]),
    ).toEqual({
      [SLICE_A]: [{ sku: "A" }, { sku: "B" }],
      [SLICE_B]: [],
    });
  });

  it("throws on an unknown slice", () => {
    const results: SlotValidateResult[] = [
      {
        groupId: "a",
        slotId: FIXTURE_SLOT,
        valid: true,
        contributions: [{ slice: "shippingLines", append: [{}] }],
      },
    ];

    expect(() =>
      mergeContributions(results, [SLICE_A]),
    ).toThrow(UnknownSlotSliceError);
  });
});
