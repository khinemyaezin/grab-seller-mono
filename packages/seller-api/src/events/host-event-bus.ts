import { EventClearScope, EventPayloads, EventSubscribeOptions, PlatformEvents, SignalEventPayloads, StateEventPayloads } from "@khinemyaezin/seller-contracts";

type CacheEntry = {
  topic: keyof StateEventPayloads;
  key: string;
  payload: StateEventPayloads[keyof StateEventPayloads];
};

function correlationKey(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object")
    return undefined;
  const record = payload as Record<string, unknown>;
  if (typeof record.entityKey === "string" && record.entityKey.length > 0) {
    return record.entityKey;
  }
  if (typeof record.groupId === "string" && record.groupId.length > 0) {
    return record.groupId;
  }
  return undefined;
}

function cacheStorageKey(
  topic: keyof StateEventPayloads,
  correlation: string,
): string {
  return `${String(topic)}:${correlation}`;
}

function withSequence<T extends object>(
  payload: T,
  sequence: number,
): T & { sequence: number } {
  return { ...payload, sequence };
}

export function createHostEventBus(): PlatformEvents {
  const transport = new EventTarget();
  const cache = new Map<string, CacheEntry>();
  const sequences = new Map<string, number>();

  function nextSequence(
    topic: keyof StateEventPayloads,
    correlation: string | undefined,
  ): number {
    const seqKey = `${String(topic)}:${correlation ?? ""}`;
    const next = (sequences.get(seqKey) ?? 0) + 1;
    sequences.set(seqKey, next);
    return next;
  }

  function dispatch<K extends Extract<keyof EventPayloads, string>>(
    type: K,
    detail: EventPayloads[K],
  ): void {
    transport.dispatchEvent(new CustomEvent(type, { detail }));
  }

  function emit<K extends Extract<keyof SignalEventPayloads, string>>(
    type: K,
    payload: SignalEventPayloads[K],
  ): void {
    dispatch(type, payload as EventPayloads[K]);
  }

  function setState<K extends Extract<keyof StateEventPayloads, string>>(
    type: K,
    payload: StateEventPayloads[K],
  ): void {
    const correlation = correlationKey(payload);
    let detail: StateEventPayloads[K] = payload;

    if (payload && typeof payload === "object") {
      const sequence = nextSequence(type, correlation);
      detail = withSequence(payload, sequence) as StateEventPayloads[K];

      if (correlation) {
        cache.set(cacheStorageKey(type, correlation), {
          topic: type,
          key: correlation,
          payload: detail,
        });
      }
    }

    dispatch(type, detail as EventPayloads[K]);
  }

  function subscribe<K extends Extract<keyof EventPayloads, string>>(
    type: K,
    handler: (payload: EventPayloads[K]) => void,
    opts?: EventSubscribeOptions,
  ): () => void {
    const listener = (event: Event) => {
      try {
        handler((event as CustomEvent<EventPayloads[K]>).detail);
      } catch (error) {
        console.error(
          `[HostEventBus] Error in subscriber for ${String(type)}:`,
          error,
        );
      }
    };

    transport.addEventListener(type, listener);

    if (opts?.replay ?? true) {
      const prefix = `${String(type)}:`;
      for (const [storageKey, entry] of cache) {
        if (!storageKey.startsWith(prefix)) continue;
        try {
          handler(entry.payload as EventPayloads[K]);
        } catch (error) {
          console.error(
            `[HostEventBus] Error replaying ${String(type)}:`,
            error,
          );
        }
      }
    }

    return () => transport.removeEventListener(type, listener);
  }

  function getSnapshot<K extends keyof StateEventPayloads>(
    type: K,
    key: string,
  ): StateEventPayloads[K] | undefined {
    const entry = cache.get(cacheStorageKey(type, key));
    return entry?.payload as StateEventPayloads[K] | undefined;
  }

  function clear(scope?: EventClearScope): void {
    if (scope === undefined) {
      cache.clear();
      sequences.clear();
      return;
    }

    if ("topic" in scope) {
      if (scope.key !== undefined) {
        cache.delete(cacheStorageKey(scope.topic, scope.key));
        sequences.delete(`${String(scope.topic)}:${scope.key}`);
        return;
      }
      const prefix = `${String(scope.topic)}:`;
      for (const storageKey of [...cache.keys()]) {
        if (storageKey.startsWith(prefix)) {
          cache.delete(storageKey);
        }
      }
      for (const seqKey of [...sequences.keys()]) {
        if (seqKey.startsWith(prefix) || seqKey === `${String(scope.topic)}:`) {
          sequences.delete(seqKey);
        }
      }
      return;
    }

    if ("groupId" in scope) {
      const { groupId } = scope;
      for (const [storageKey, entry] of [...cache.entries()]) {
        const payload = entry.payload as Record<string, unknown>;
        if (entry.key === groupId || payload.groupId === groupId) {
          cache.delete(storageKey);
        }
      }
      return;
    }

    if ("entityKey" in scope) {
      const { entityKey } = scope;
      for (const [storageKey, entry] of [...cache.entries()]) {
        const payload = entry.payload as Record<string, unknown>;
        if (entry.key === entityKey || payload.entityKey === entityKey) {
          cache.delete(storageKey);
        }
      }
    }
  }

  return { emit, setState, subscribe, getSnapshot, clear };
}
