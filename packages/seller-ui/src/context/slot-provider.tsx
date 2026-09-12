import {
  type SlotDeclaration,
  type SlotEntry,
  type SlotHandle,
  type SlotValidateResult,
  slotErrorKey,
} from "@khinemyaezin/seller-contracts";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type RegisteredSlot = {
  groupId: string;
  slotId: string;
  handle?: SlotHandle;
};

export type SlotProviderApi = {
  declare: (declaration: SlotDeclaration) => () => void;
  register: (slot: RegisteredSlot) => () => void;
  listDeclarations: () => SlotDeclaration[];
  list: () => RegisteredSlot[];
  getHandle: (groupId: string, slotId: string) => SlotHandle | undefined;

  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => ReadonlyMap<string, SlotEntry>;
  getEntry: (groupId: string) => SlotEntry | undefined;
  setPayload: (entry: SlotEntry) => void;
  prune: (liveGroupIds: ReadonlySet<string>) => string[];
  clear: () => void;

  setResults: (results: SlotValidateResult[]) => void;
  getResults: () => SlotValidateResult[];
  subscribeResults: (listener: () => void) => () => void;
};

const noopUnregister = () => {};

const EMPTY_ENTRIES: ReadonlyMap<string, SlotEntry> = new Map();
const EMPTY_RESULTS: SlotValidateResult[] = [];

const defaultApi: SlotProviderApi = {
  declare: () => noopUnregister,
  register: () => noopUnregister,
  listDeclarations: () => [],
  list: () => [],
  getHandle: () => undefined,
  subscribe: () => () => {},
  getSnapshot: () => EMPTY_ENTRIES,
  getEntry: () => undefined,
  setPayload: () => {},
  prune: () => [],
  clear: () => {},
  setResults: () => {},
  getResults: () => EMPTY_RESULTS,
  subscribeResults: () => () => {},
};

const SlotProviderContext = createContext<SlotProviderApi | null>(null);

export type SlotProviderProps = {
  children: ReactNode;
};

function createListenerSet() {
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    notify() {
      for (const listener of listeners) listener();
    },
  };
}

export function SlotProvider({ children }: SlotProviderProps) {
  const declarationsRef = useRef(new Map<string, SlotDeclaration>());
  const handlesRef = useRef(new Map<string, RegisteredSlot>());
  const entriesRef = useRef<ReadonlyMap<string, SlotEntry>>(EMPTY_ENTRIES);
  const resultsRef = useRef<SlotValidateResult[]>(EMPTY_RESULTS);
  const draftListeners = useRef(createListenerSet()).current;
  const resultListeners = useRef(createListenerSet()).current;
  const [declarationGeneration, setDeclarationGeneration] = useState(0);

  const declare = useCallback((declaration: SlotDeclaration) => {
    const key = slotErrorKey(declaration.groupId, declaration.slotId);
    declarationsRef.current.set(key, declaration);
    setDeclarationGeneration((value) => value + 1);
    return () => {
      declarationsRef.current.delete(key);
      setDeclarationGeneration((value) => value + 1);
    };
  }, []);

  const register = useCallback((slot: RegisteredSlot) => {
    const key = slotErrorKey(slot.groupId, slot.slotId);
    handlesRef.current.set(key, slot);
    return () => {
      handlesRef.current.delete(key);
    };
  }, []);

  const listDeclarations = useCallback(
    () => Array.from(declarationsRef.current.values()),
    [],
  );

  const list = useCallback(() => Array.from(handlesRef.current.values()), []);

  const getHandle = useCallback(
    (groupId: string, slotId: string) =>
      handlesRef.current.get(slotErrorKey(groupId, slotId))?.handle,
    [],
  );

  const subscribe = useCallback(
    (listener: () => void) => draftListeners.subscribe(listener),
    [draftListeners],
  );

  const getSnapshot = useCallback(() => entriesRef.current, []);

  const getEntry = useCallback(
    (groupId: string) => entriesRef.current.get(groupId),
    [],
  );

  const setPayload = useCallback(
    (entry: SlotEntry) => {
      const current = entriesRef.current.get(entry.groupId);
      if (
        current &&
        current.domain === entry.domain &&
        Object.is(current.payload, entry.payload)
      ) {
        return;
      }

      const next = new Map(entriesRef.current);
      next.set(entry.groupId, entry);
      entriesRef.current = next;
      draftListeners.notify();
    },
    [draftListeners],
  );

  const prune = useCallback(
    (liveGroupIds: ReadonlySet<string>) => {
      const removed: string[] = [];
      for (const [groupId] of entriesRef.current) {
        if (liveGroupIds.has(groupId)) continue;
        removed.push(groupId);
      }

      if (removed.length === 0) return removed;

      const next = new Map(entriesRef.current);
      for (const groupId of removed) next.delete(groupId);
      entriesRef.current = next;
      draftListeners.notify();
      return removed;
    },
    [draftListeners],
  );

  const clear = useCallback(() => {
    if (entriesRef.current.size === 0) return;
    entriesRef.current = EMPTY_ENTRIES;
    draftListeners.notify();
  }, [draftListeners]);

  const setResults = useCallback(
    (results: SlotValidateResult[]) => {
      resultsRef.current = results;
      resultListeners.notify();
    },
    [resultListeners],
  );

  const getResults = useCallback(() => resultsRef.current, []);

  const subscribeResults = useCallback(
    (listener: () => void) => resultListeners.subscribe(listener),
    [resultListeners],
  );

  const api = useMemo<SlotProviderApi>(
    () => ({
      declare,
      register,
      listDeclarations,
      list,
      getHandle,
      subscribe,
      getSnapshot,
      getEntry,
      setPayload,
      prune,
      clear,
      setResults,
      getResults,
      subscribeResults,
    }),
    [
      declare,
      register,
      listDeclarations,
      list,
      getHandle,
      subscribe,
      getSnapshot,
      getEntry,
      setPayload,
      prune,
      clear,
      setResults,
      getResults,
      subscribeResults,
    ],
  );

  return (
    <SlotProviderContext.Provider value={api}>
      <SlotDraftReconciler generation={declarationGeneration} />
      {children}
    </SlotProviderContext.Provider>
  );
}

function SlotDraftReconciler({ generation }: { generation: number }) {
  const { listDeclarations, prune } = useSlotProvider();

  useEffect(() => {
    const id = window.setTimeout(() => {
      const live = new Set(listDeclarations().map((declaration) => declaration.groupId));
      prune(live);
    }, 0);
    return () => window.clearTimeout(id);
  }, [generation, listDeclarations, prune]);

  return null;
}

export function useSlotProvider(): SlotProviderApi {
  const context = useContext(SlotProviderContext);
  if (!context) {
    throw new Error("Slot provider must be used");
  }
  return context;
}

export function useOptionalSlotProvider(): SlotProviderApi {
  return useContext(SlotProviderContext) ?? defaultApi;
}
