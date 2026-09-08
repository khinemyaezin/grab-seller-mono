import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { SlotValueSource } from "@khinemyaezin/seller-contracts";
import { useSlotChangeEmitter } from "./use-slot-change-emitter.js";

type Values = { amount: number };

function createFakeSource(initial: Values): SlotValueSource<Values> & {
  emit: (name?: string) => void;
  setValues: (value: Values) => void;
} {
  let value = initial;
  const listeners = new Set<(name?: string) => void>();

  return {
    getValues: () => value,
    subscribe: (onFieldChange) => {
      listeners.add(onFieldChange);
      return () => {
        listeners.delete(onFieldChange);
      };
    },
    emit: (name) => {
      for (const listener of listeners) listener(name);
    },
    setValues: (next) => {
      value = next;
    },
  };
}

describe("useSlotChangeEmitter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces named field changes from a SlotValueSource without RHF", () => {
    const source = createFakeSource({ amount: 1 });
    const onChange = vi.fn();

    renderHook(() => useSlotChangeEmitter(source, onChange, 300));

    act(() => {
      source.setValues({ amount: 2 });
      source.emit();
      source.emit("amount");
      source.emit("amount");
    });

    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ amount: 2 });
  });

  it("unsubscribes when the hook unmounts", () => {
    const source = createFakeSource({ amount: 1 });
    const onChange = vi.fn();

    const { unmount } = renderHook(() =>
      useSlotChangeEmitter(source, onChange, 300),
    );

    unmount();

    act(() => {
      source.setValues({ amount: 9 });
      source.emit("amount");
      vi.advanceTimersByTime(300);
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});
