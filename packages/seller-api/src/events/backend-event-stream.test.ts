import { describe, expect, it, vi } from "vitest";
import { consumeSseBuffer } from "./sse-parser.js";
import { createBackendEventStream } from "./backend-event-stream.js";

function sseResponse(chunks: string[], status = 200): Response {
  const encoder = new TextEncoder();
  let index = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(chunks[index]));
      index += 1;
    },
  });
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("consumeSseBuffer", () => {
  it("drops comment-only heartbeat blocks", () => {
    const { frames, rest } = consumeSseBuffer(": ping\n\nid: 1\nevent: ready\ndata: {\"producerId\":\"backend\"}\n\n");

    expect(frames).toHaveLength(1);
    expect(frames[0]).toEqual({
      id: "1",
      event: "ready",
      data: "{\"producerId\":\"backend\"}",
    });
    expect(rest).toBe("");
  });

  it("joins multiline data and keeps a partial trailing block", () => {
    const { frames, rest } = consumeSseBuffer("event: workflow\ndata: {\"a\":1}\ndata: {\"b\":2}\n\nevent: workflow\ndata: {");

    expect(frames).toEqual([
      { event: "workflow", data: "{\"a\":1}\n{\"b\":2}" },
    ]);
    expect(rest).toBe("event: workflow\ndata: {");
  });
});

describe("createBackendEventStream", () => {
  it("parses ready and workflow frames and ignores comments", async () => {
    const frames: { event?: string; data: string }[] = [];
    const controller = new AbortController();

    await createBackendEventStream({
      url: "http://api.test/events/stream",
      signal: controller.signal,
      refresh: vi.fn(),
      onFrame: (frame) => {
        frames.push(frame);
        if (frames.length >= 2) {
          controller.abort();
        }
      },
      fetchImpl: vi.fn(async () =>
        sseResponse([
          ": ping\n\n",
          "id: evt-1\nevent: ready\ndata: {\"producerId\":\"backend\"}\n\n",
          "id: evt-2\nevent: workflow\ndata: {\"workflowId\":\"wf-1\",\"status\":\"COMPLETED\"}\n\n",
        ]),
      ),
      delay: async () => undefined,
    });

    expect(frames.map((frame) => frame.event)).toEqual(["ready", "workflow"]);
  });

  it("refreshes on 401 then reconnects", async () => {
    const refresh = vi.fn(async () => undefined);
    const fetchImpl = vi.fn();
    const controller = new AbortController();
    let calls = 0;

    fetchImpl.mockImplementation(async (_url: string, init?: RequestInit) => {
      calls += 1;
      if (calls === 1) {
        return new Response(null, { status: 401 });
      }
      const headers = new Headers(init?.headers);
      expect(headers.get("Last-Event-ID")).toBeNull();
      controller.abort();
      return sseResponse(["id: evt-1\nevent: ready\ndata: {}\n\n"]);
    });

    await createBackendEventStream({
      url: "http://api.test/events/stream",
      signal: controller.signal,
      refresh,
      onFrame: () => undefined,
      fetchImpl,
      delay: async () => undefined,
    });

    expect(refresh).toHaveBeenCalledOnce();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("sends Last-Event-ID after a prior frame id when reconnecting", async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn();
    let calls = 0;

    fetchImpl.mockImplementation(async (_url: string, init?: RequestInit) => {
      calls += 1;
      if (calls === 1) {
        return sseResponse(["id: evt-9\nevent: ready\ndata: {}\n\n"]);
      }
      const headers = new Headers(init?.headers);
      expect(headers.get("Last-Event-ID")).toBe("evt-9");
      controller.abort();
      return sseResponse([]);
    });

    await createBackendEventStream({
      url: "http://api.test/events/stream",
      signal: controller.signal,
      refresh: vi.fn(),
      onFrame: () => undefined,
      fetchImpl,
      delay: async () => undefined,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("stops the reconnect loop when aborted", async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn(async () => {
      controller.abort();
      throw new DOMException("aborted", "AbortError");
    });

    await createBackendEventStream({
      url: "http://api.test/events/stream",
      signal: controller.signal,
      refresh: vi.fn(),
      onFrame: () => undefined,
      fetchImpl,
      delay: async () => undefined,
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
