import { useEffect, useId, useRef } from "react";
import { usePlatform } from "@/context";

export type UseContextBarOptions = {
    dirty: boolean;
    onSave: () => void | Promise<void>;
    onDiscard?: () => void;
    groupId?: string;
    label?: string;
};

export function useContextBar({
    dirty,
    onSave,
    onDiscard,
    groupId,
    label,
}: UseContextBarOptions): void {
    const platform = usePlatform();
    const producerId = useId();
    const resolvedGroupId = groupId ?? producerId;

    const onSaveRef = useRef(onSave);
    const onDiscardRef = useRef(onDiscard);
    onSaveRef.current = onSave;
    onDiscardRef.current = onDiscard;

    const events = platform?.events;

    useEffect(() => {
        if (!events) return;

        events.setState("form:dirty:v1", {
            producerId,
            groupId: resolvedGroupId,
            payload: { dirty, label },
        });
    }, [events, producerId, resolvedGroupId, dirty, label]);

    useEffect(() => {
        if (!events) return;

        return () => {
            events.setState("form:dirty:v1", {
                producerId,
                groupId: resolvedGroupId,
                payload: { dirty: false },
            });
        };
    }, [events, producerId, resolvedGroupId]);

    useEffect(() => {
        if (!events) return;

        const unsubs = [
            events.subscribe("form:save:v1", async (msg) => {
                if (msg.producerId === producerId) return;
                if (msg.groupId !== resolvedGroupId) return;

                try {
                    await onSaveRef.current();
                    events.emit("form:saved:v1", {
                        producerId,
                        groupId: resolvedGroupId,
                        status: "success",
                    });
                } catch (error) {
                    events.emit("form:saved:v1", {
                        producerId,
                        groupId: resolvedGroupId,
                        status: "failed",
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }, { replay: false }),
            events.subscribe("form:discard:v1", (msg) => {
                if (msg.producerId === producerId) return;
                if (msg.groupId !== resolvedGroupId) return;

                onDiscardRef.current?.();
            }, { replay: false }),
        ];

        return () => unsubs.forEach((unsub) => unsub());
    }, [events, producerId, resolvedGroupId]);
}
