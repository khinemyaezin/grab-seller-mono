import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlatformEvents } from "@khinemyaezin/seller-contracts";
import { usePlatform } from "@/context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonStatus, type ButtonStatusState } from "@/components/ui/button-status";

const DEFAULT_SAVE_TIMEOUT_MS = 10_000;
const STATUS_RESET_MS = 2_000;
const BAR_PRODUCER_ID = "context-bar";

type DirtyEntry = {
    dirty: boolean;
    label?: string;
};

type SaveStatus = "success" | "failed";

function runSave(
    events: PlatformEvents,
    groupIds: string[],
    timeoutMs: number,
): Promise<Map<string, SaveStatus>> {
    return new Promise((resolve) => {
        if (groupIds.length === 0) {
            resolve(new Map());
            return;
        }

        const pending = new Set(groupIds);
        const results = new Map<string, SaveStatus>();
        const timers = new Map<string, number>();

        const settle = (groupId: string, status: SaveStatus) => {
            if (!pending.has(groupId)) return;
            pending.delete(groupId);
            results.set(groupId, status);
            const timer = timers.get(groupId);
            if (timer) window.clearTimeout(timer);
            timers.delete(groupId);
            if (pending.size === 0) {
                unsubscribe();
                resolve(results);
            }
        };

        const unsubscribe = events.subscribe("form:saved:v1", (msg) => {
            settle(msg.groupId, msg.status);
        }, { replay: false });

        for (const groupId of groupIds) {
            timers.set(groupId, window.setTimeout(() => settle(groupId, "failed"), timeoutMs));
            events.emit("form:save:v1", { producerId: BAR_PRODUCER_ID, groupId });
        }
    });
}

export type ContextBarProps = {
    saveTimeoutMs?: number;
    className?: string;
};

export function ContextBar({ saveTimeoutMs = DEFAULT_SAVE_TIMEOUT_MS, className }: ContextBarProps) {
    const platform = usePlatform();
    const events = platform?.events;

    const [entries, setEntries] = useState<Map<string, DirtyEntry>>(new Map());
    const [status, setStatus] = useState<ButtonStatusState>("idle");
    const savingRef = useRef(false);
    const statusTimerRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!events) return;

        return events.subscribe("form:dirty:v1", (msg) => {
            setEntries((prev) => {
                const current = prev.get(msg.groupId);
                if (current && current.dirty === msg.payload.dirty && current.label === msg.payload.label) {
                    return prev;
                }
                const next = new Map(prev);
                next.set(msg.groupId, { dirty: msg.payload.dirty, label: msg.payload.label });
                return next;
            });
        });
    }, [events]);

    useEffect(() => () => window.clearTimeout(statusTimerRef.current), []);

    const dirtyGroups = useMemo(
        () => [...entries].filter(([, entry]) => entry.dirty).map(([groupId]) => groupId),
        [entries],
    );
    const label = useMemo(() => {
        for (const [, entry] of entries) {
            if (entry.dirty && entry.label) return entry.label;
        }
        return undefined;
    }, [entries]);

    const handleSave = useCallback(async () => {
        if (!events || savingRef.current || dirtyGroups.length === 0) return;

        savingRef.current = true;
        window.clearTimeout(statusTimerRef.current);
        setStatus("pending");

        try {
            const results = await runSave(events, dirtyGroups, saveTimeoutMs);
            const failed = [...results.values()].some((result) => result === "failed");
            setStatus(failed ? "failed" : "success");
        } finally {
            savingRef.current = false;
            statusTimerRef.current = window.setTimeout(() => setStatus("idle"), STATUS_RESET_MS);
        }
    }, [events, dirtyGroups, saveTimeoutMs]);

    const handleDiscard = useCallback(() => {
        if (!events || savingRef.current) return;

        for (const groupId of dirtyGroups) {
            events.emit("form:discard:v1", { producerId: BAR_PRODUCER_ID, groupId });
        }
    }, [events, dirtyGroups]);

    if (dirtyGroups.length === 0) return null;

    return (
        <div
            role="region"
            aria-label="Unsaved changes"
            className={cn(
                "sticky top-[var(--header-height,3rem)] z-10 flex items-center justify-between gap-4 border-b bg-background/90 px-4 py-2 backdrop-blur-md animate-in slide-in-from-top-2 fade-in duration-200 lg:px-6",
                className,
            )}
        >
            <p className="text-sm font-medium">
                Unsaved changes{label ? ` — ${label}` : ""}
            </p>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDiscard}
                    disabled={status === "pending"}
                >
                    Discard
                </Button>
                <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={status === "pending"}
                >
                    <ButtonStatus
                        status={status}
                        pendingLabel="Saving…"
                        successLabel="Saved"
                        failedLabel="Save failed"
                    >
                        Save
                    </ButtonStatus>
                </Button>
            </div>
        </div>
    );
}
