import { EventSubscribeOptions } from "./core";
import { EventPayloads, SignalEventPayloads, StateEventPayloads } from "./payload";

export type EventClearScope =
    | { topic: keyof StateEventPayloads; key?: string }
    | { instanceId: string }
    | { entityKey: string };


export interface PlatformEvents {
    emit<K extends keyof SignalEventPayloads>(
        type: K,
        payload: SignalEventPayloads[K],
    ): void;
    setState<K extends keyof StateEventPayloads>(
        type: K,
        payload: StateEventPayloads[K],
    ): void;
    subscribe<K extends keyof EventPayloads>(
        type: K,
        handler: (payload: EventPayloads[K]) => void,
        opts?: EventSubscribeOptions,
    ): () => void;
    getSnapshot<K extends keyof StateEventPayloads>(
        type: K,
        key: string,
    ): StateEventPayloads[K] | undefined;
    clear(scope?: EventClearScope): void;
}