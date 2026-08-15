import { ExtensionSlotName } from "@khinemyaezin/seller-contracts";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

export type RegisteredSlot = {
  groupId: string;
  slotId: ExtensionSlotName;
};

export type SlotProviderApi = {
  register: (slot: RegisteredSlot) => () => void;
  list: () => RegisteredSlot[];
};

const noopUnregister = () => { };

const defaultApi: SlotProviderApi = {
  register: () => noopUnregister,
  list: () => [],
};

const SlotProviderContext = createContext<SlotProviderApi | null>(null);

export type SlotProviderProps = {
  children: ReactNode;
};

export function SlotProvider({ children }: SlotProviderProps) {
  const slotsRef = useRef(new Map<string, RegisteredSlot>());

  const register = useCallback((slot: RegisteredSlot) => {
    const key = `${slot.groupId}::${slot.slotId}`;
    slotsRef.current.set(key, slot);
    return () => {
      slotsRef.current.delete(key);
    };

  }, []);

  const list = useCallback(() => Array.from(slotsRef.current.values()), []);
  const api = useMemo<SlotProviderApi>(() => ({ register, list }), [register, list]);

  return (
    <SlotProviderContext.Provider value={api}>
      {children}
    </SlotProviderContext.Provider>
  );
}

export function useSlotProvider(): SlotProviderApi {
  return useContext(SlotProviderContext) ?? defaultApi;
}
