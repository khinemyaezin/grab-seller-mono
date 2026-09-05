export type SseFrame = {
  id?: string;
  event?: string;
  data: string;
};

export function consumeSseBuffer(buffer: string): { frames: SseFrame[]; rest: string } {
  const normalized = buffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const parts = normalized.split("\n\n");
  const rest = parts.pop() ?? "";
  const frames: SseFrame[] = [];

  for (const block of parts) {
    const frame = parseSseBlock(block);
    if (frame) {
      frames.push(frame);
    }
  }

  return { frames, rest };
}

function parseSseBlock(block: string): SseFrame | null {
  let id: string | undefined;
  let event: string | undefined;
  const dataLines: string[] = [];
  let hasField = false;

  for (const line of block.split("\n")) {
    if (line.startsWith(":") || line.length === 0) {
      continue;
    }

    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) {
      value = value.slice(1);
    }

    hasField = true;
    if (field === "id") {
      id = value;
    } else if (field === "event") {
      event = value;
    } else if (field === "data") {
      dataLines.push(value);
    }
  }

  if (!hasField) {
    return null;
  }

  return { id, event, data: dataLines.join("\n") };
}
