import { consumeSseBuffer, type SseFrame } from "./sse-parser.js";

export type { SseFrame };

export type BackendEventStreamDisconnectReason = "error";

export type CreateBackendEventStreamOptions = {
  url: string;
  signal: AbortSignal;
  refresh: () => Promise<void>;
  onFrame: (frame: SseFrame) => void;
  onDisconnected?: (reason: BackendEventStreamDisconnectReason) => void;
  fetchImpl?: typeof fetch;
  delay?: (ms: number, signal: AbortSignal) => Promise<void>;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
};

export async function createBackendEventStream(
  options: CreateBackendEventStreamOptions,
): Promise<void> {
  const {
    url,
    signal,
    refresh,
    onFrame,
    onDisconnected,
    fetchImpl = fetch,
    delay = delayRespectingAbort,
    initialBackoffMs = 1_000,
    maxBackoffMs = 30_000,
  } = options;

  let lastEventId: string | undefined;
  let backoffMs = initialBackoffMs;
  let refreshed = false;

  while (!signal.aborted) {
    try {
      const headers: Record<string, string> = {
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      };
      if (lastEventId) {
        headers["Last-Event-ID"] = lastEventId;
      }

      const response = await fetchImpl(url, {
        method: "GET",
        headers,
        credentials: "include",
        signal,
      });

      if (response.status === 401 && !refreshed) {
        await refresh();
        refreshed = true;
        continue;
      }

      if (!response.ok || !response.body) {
        throw new Error(`Event stream failed: ${response.status} ${response.statusText}`);
      }

      refreshed = false;
      backoffMs = initialBackoffMs;

      await readSseStream(response.body, signal, (frame) => {
        if (frame.id) {
          lastEventId = frame.id;
        }
        onFrame(frame);
      });

      if (signal.aborted) {
        return;
      }

      onDisconnected?.("error");
    } catch {
      if (signal.aborted) {
        return;
      }
      onDisconnected?.("error");
    }

    await delay(backoffMs, signal);
    backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
  }
}

async function readSseStream(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  onFrame: (frame: SseFrame) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        const { frames } = consumeSseBuffer(`${buffer}\n\n`);
        for (const frame of frames) {
          onFrame(frame);
        }
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const consumed = consumeSseBuffer(buffer);
      buffer = consumed.rest;
      for (const frame of consumed.frames) {
        onFrame(frame);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function delayRespectingAbort(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
