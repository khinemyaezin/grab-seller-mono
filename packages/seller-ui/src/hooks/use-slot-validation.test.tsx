import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  SLOT_UNAVAILABLE_ERROR,
  SLOT_UNAVAILABLE_MESSAGE,
  SLOT_VALIDATE_TIMEOUT_MESSAGE,
  slotErrorKey,
  type SlotHandle,
} from "@khinemyaezin/seller-contracts";
import { SlotProvider, useSlotProvider } from "@/context/slot-provider";
import { useResetAllSlots } from "@/hooks/use-slot-reset";
import {
  useValidateAllSlots,
} from "@/hooks/use-slot-validation";

const INVENTORY_SLOT = "test.inventory";
const PRICING_SLOT = "test.pricing";

function wrapper({ children }: { children: ReactNode }) {
  return <SlotProvider>{children}</SlotProvider>;
}

function useValidateHarness() {
  const { declare, register } = useSlotProvider();
  const validation = useValidateAllSlots();
  return { declare, register, ...validation };
}

function fakeHandle(
  result: Awaited<ReturnType<SlotHandle["validate"]>>,
  project?: SlotHandle["project"],
): SlotHandle {
  return {
    validate: vi.fn(async () => result),
    getValues: () => result.value,
    project,
  };
}

describe("useValidateAllSlots", () => {
  it("calls declared handles and keys errors by groupId::slotId", async () => {
    const inventory = fakeHandle({
      valid: true,
      value: { sku: "SKU-1", locations: [] },
    });
    const pricing = fakeHandle({
      valid: false,
      errors: { amount: "required" },
    });

    const { result } = renderHook(() => useValidateHarness(), { wrapper });

    act(() => {
      result.current.declare({
        groupId: "variant-1",
        slotId: INVENTORY_SLOT,
      });
      result.current.declare({
        groupId: "variant-1",
        slotId: PRICING_SLOT,
      });
      result.current.register({
        groupId: "variant-1",
        slotId: INVENTORY_SLOT,
        handle: inventory,
      });
      result.current.register({
        groupId: "variant-1",
        slotId: PRICING_SLOT,
        handle: pricing,
      });
    });

    let results!: Awaited<ReturnType<typeof result.current.validate>>;
    await act(async () => {
      results = await result.current.validate();
    });

    expect(results).toEqual([
      {
        groupId: "variant-1",
        slotId: INVENTORY_SLOT,
        valid: true,
        value: { sku: "SKU-1", locations: [] },
      },
      {
        groupId: "variant-1",
        slotId: PRICING_SLOT,
        valid: false,
        errors: { amount: "required" },
      },
    ]);
    expect(result.current.errors).toEqual({
      [slotErrorKey("variant-1", PRICING_SLOT)]: {
        amount: "required",
      },
    });
  });

  it("fail-closes when a declared slot has no handle", async () => {
    const { result } = renderHook(() => useValidateHarness(), { wrapper });

    act(() => {
      result.current.declare({
        groupId: "variant-2",
        slotId: INVENTORY_SLOT,
      });
    });

    let results!: Awaited<ReturnType<typeof result.current.validate>>;
    await act(async () => {
      results = await result.current.validate();
    });

    expect(results).toEqual([
      {
        groupId: "variant-2",
        slotId: INVENTORY_SLOT,
        valid: false,
        errors: { [SLOT_UNAVAILABLE_ERROR]: SLOT_UNAVAILABLE_MESSAGE },
      },
    ]);
  });

  it("does not fail optional declared slots without a handle", async () => {
    const { result } = renderHook(() => useValidateHarness(), { wrapper });

    act(() => {
      result.current.declare({
        groupId: "variant-2",
        slotId: INVENTORY_SLOT,
        optional: true,
      });
    });

    let results!: Awaited<ReturnType<typeof result.current.validate>>;
    await act(async () => {
      results = await result.current.validate();
    });

    expect(results).toEqual([
      {
        groupId: "variant-2",
        slotId: INVENTORY_SLOT,
        valid: true,
      },
    ]);
  });

  it("fail-closes when validate times out", async () => {
    const handle: SlotHandle<string> = {
      validate: vi.fn(() => new Promise(() => {})),
      getValues: () => "pending",
    };

    const { result } = renderHook(
      () => {
        const api = useSlotProvider();
        const validation = useValidateAllSlots({ timeoutMs: 20 });
        return { ...api, ...validation };
      },
      { wrapper },
    );

    act(() => {
      result.current.declare({
        groupId: "variant-timeout",
        slotId: PRICING_SLOT,
      });
      result.current.register({
        groupId: "variant-timeout",
        slotId: PRICING_SLOT,
        handle,
      });
    });

    let results!: Awaited<ReturnType<typeof result.current.validate>>;
    await act(async () => {
      results = await result.current.validate();
    });

    expect(results).toEqual([
      {
        groupId: "variant-timeout",
        slotId: PRICING_SLOT,
        valid: false,
        errors: { [SLOT_UNAVAILABLE_ERROR]: SLOT_VALIDATE_TIMEOUT_MESSAGE },
      },
    ]);
  });

  it("collects project() contributions only for valid handles", async () => {
    const pricing = fakeHandle(
      { valid: true, value: { sku: "SKU-1", amount: 10, currencyCode: "USD" } },
      () => [{ slice: "slice.a", append: [{ sku: "SKU-1", amount: 10 }] }],
    );

    const { result } = renderHook(() => useValidateHarness(), { wrapper });

    act(() => {
      result.current.declare({
        groupId: "variant-1",
        slotId: PRICING_SLOT,
      });
      result.current.register({
        groupId: "variant-1",
        slotId: PRICING_SLOT,
        handle: pricing,
      });
    });

    let results!: Awaited<ReturnType<typeof result.current.validate>>;
    await act(async () => {
      results = await result.current.validate();
    });

    expect(results[0]?.contributions).toEqual([
      { slice: "slice.a", append: [{ sku: "SKU-1", amount: 10 }] },
    ]);
  });

  it("awaits an in-flight validate instead of returning empty success", async () => {
    let release!: (value: { valid: boolean; value: string }) => void;
    const handle: SlotHandle<string> = {
      validate: vi.fn(
        () =>
          new Promise<{ valid: boolean; value: string }>((resolve) => {
            release = resolve;
          }),
      ),
      getValues: () => "pending",
    };

    const { result } = renderHook(() => useValidateHarness(), { wrapper });

    act(() => {
      result.current.declare({
        groupId: "variant-3",
        slotId: PRICING_SLOT,
      });
      result.current.register({
        groupId: "variant-3",
        slotId: PRICING_SLOT,
        handle,
      });
    });

    const first = result.current.validate();
    const second = result.current.validate();
    expect(second).toBe(first);
    expect(handle.validate).toHaveBeenCalledTimes(1);

    await act(async () => {
      release({ valid: true, value: "ok" });
      await first;
    });

    await expect(second).resolves.toEqual([
      {
        groupId: "variant-3",
        slotId: PRICING_SLOT,
        valid: true,
        value: "ok",
      },
    ]);
  });
});

function useResetHarness() {
  const { register } = useSlotProvider();
  const reset = useResetAllSlots();
  return { register, reset };
}

describe("useResetAllSlots", () => {
  it("calls reset on each registered handle and ignores missing reset", () => {
    const inventoryReset = vi.fn();
    const inventory: SlotHandle = {
      validate: vi.fn(async () => ({ valid: true })),
      getValues: () => undefined,
      reset: inventoryReset,
    };
    const pricing: SlotHandle = {
      validate: vi.fn(async () => ({ valid: true })),
      getValues: () => undefined,
    };

    const { result } = renderHook(() => useResetHarness(), { wrapper });

    act(() => {
      result.current.register({
        groupId: "variant-1",
        slotId: INVENTORY_SLOT,
        handle: inventory,
      });
      result.current.register({
        groupId: "variant-1",
        slotId: PRICING_SLOT,
        handle: pricing,
      });
    });

    act(() => {
      result.current.reset();
    });

    expect(inventoryReset).toHaveBeenCalledTimes(1);
  });
});
